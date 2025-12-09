import { Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateItinerary() {
  const navigate = useNavigate();

  // Trip Query Details
  const [locationAutocomplete, setLocationAutocomplete] = useState<string[]>(
    []
  );
  const [destination, setDestination] = useState("");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });

  // UI state variables
  const [showGuestMenu, setShowGuestMenu] = useState(false);

  // Chat Window
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");

  type ItineraryItem = {
    time: string;
    title: string;
    explanation: string;
    address: string;
    url: string;
  };

  type ItineraryDay = {
    date: string;
    items: ItineraryItem[];
  };

  // Backend States
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [foodOptions, setFoodOptions] = useState<any>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Approval states
  const [selections, setSelections] = useState<
    Record<number, "yes" | "no" | null>
  >({});

  const resetAll = () => {
    // Clear itinerary + food
    setItinerary(null);
    setFoodOptions(null);

    // Clear tabs
    setTabs([]);
    setSelectedTab(null);

    // Clear chat
    setMessages([]);
    setChatInput("");

    // Hide results panel
    setShowResults(false);

    // Reset trip query state
    setDestination("");
    setCheckInDate(null);
    setCheckOutDate(null);
    setGuests({
      adults: 0,
      children: 0,
      infants: 0,
      pets: 0,
    });

    // Hide guest menu if open
    setShowGuestMenu(false);
  };

  type GooglePlacesAutocompleteResponse = {
    suggestions: {
      placePrediction: {
        text: { text: string };
      };
    }[];
  };

  // Google Places Autocomplete
  const handleLocationAutocomplete = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDestination(e.target.value);
    const res = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        body: JSON.stringify({
          input: e.target.value,
          includedPrimaryTypes: "(cities)",
        }),
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": import.meta.env.VITE_MAP_CLIENT_KEY,
        },
      }
    );

    const data: GooglePlacesAutocompleteResponse = await res.json();
    console.log(data);
    const locationPredictions = data.suggestions.map(
      (s) => s.placePrediction.text.text
    );
    console.log(locationPredictions);
    setLocationAutocomplete(locationPredictions);
  };

  const updateGuests = (label: String, delta: number) => {
    if (label === "adults") {
      setGuests({
        adults: Math.max(0, guests.adults + delta),
        children: guests.children,
        infants: guests.infants,
        pets: guests.pets,
      });
    }
    if (label === "children") {
      setGuests({
        adults: guests.adults,
        children: Math.max(0, guests.children + delta),
        infants: guests.infants,
        pets: guests.pets,
      });
    }
    if (label === "infants") {
      setGuests({
        adults: guests.adults,
        children: guests.children,
        infants: Math.max(0, guests.infants + delta),
        pets: guests.pets,
      });
    }
    if (label === "pets") {
      setGuests({
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
        pets: Math.max(0, guests.pets + delta),
      });
    }
  };

  const submitTripQuery = async () => {
    setShowGuestMenu(false);
    setLoading(true);
    // Get logged in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if user is logged in before inserting trip query
    if (!user) {
      alert("User is not logged in!");
      setLoading(false);
      return;
    }

    // Get itinerary

    try {
      const response = await fetch("http://localhost:8000/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          destination: destination,
          start_date: checkInDate,
          end_date: checkOutDate,
          num_guests: `${guests.adults} adults, ${guests.children} children, ${guests.infants} infants, ${guests.pets} pets`,
        }),
      });

      const result = await response.json();
      console.log("ITINERARY:", result);

      setItinerary(result.itinerary);
      const loadedDates = result.itinerary.map((d: any) => d.date);
      setTabs([...loadedDates, "Food"]);
      setSelectedTab(loadedDates[0]);
      setShowResults(true);
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Itinerary could not be generated!");
    }

    // Get food options
    try {
      const response = await fetch("http://localhost:8000/generate-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          destination: destination,
          start_date: checkInDate,
          end_date: checkOutDate,
          num_guests: `${guests.adults} adults, ${guests.children} children, ${guests.infants} infants, ${guests.pets} pets`,
        }),
      });

      const result = await response.json();
      console.log("FOOD:", result);

      setFoodOptions(result.food_recommendations);
    } catch (error) {
      console.error(error);
      alert("Error generating food recommendations");
    }
  };

  // Icons
  const detectEventType = (title: string): string => {
    const t = title.toLowerCase();

    if (t.includes("museum") || t.includes("exhibit")) return "🏛️";
    if (t.includes("park") || t.includes("trail") || t.includes("garden"))
      return "🌳";
    if (t.includes("tour")) return "🎧";
    if (t.includes("festival")) return "🎉";
    if (t.includes("concert") || t.includes("music")) return "🎵";
    if (t.includes("art") || t.includes("gallery")) return "🖼️";
    if (t.includes("historic") || t.includes("heritage")) return "🏺";
    if (t.includes("zoo") || t.includes("aquarium")) return "🐾";
    if (t.includes("brewery") || t.includes("beer")) return "🍺";
    if (t.includes("wine") || t.includes("tasting")) return "🍷";
    if (t.includes("stadium") || t.includes("arena")) return "🏟️";
    if (t.includes("bar")) return "🍸";

    // fallback to general place pin
    return "📍";
  };

  const foodTypeToIcon = (type: string = "") => {
    const t = type.toLowerCase();

    if (t.includes("restaurant")) return "🍽️";
    if (t.includes("cafe")) return "☕";
    if (t.includes("bar")) return "🍸";
    if (t.includes("dessert") || t.includes("sweet")) return "🍰";
    if (t.includes("bakery")) return "🥐";
    if (t.includes("pizza")) return "🍕";
    if (t.includes("seafood")) return "🐟";
    if (t.includes("steak")) return "🥩";

    return "🍽️"; // fallback
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: chatInput }]);

    // TODO: call backend here if needed

    // Fake bot reply for now
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "Thanks! I'm generating suggestions…" },
    ]);

    setChatInput("");
  };

  // Handle approve event buttons for each card
  const handleSelect = (index: number, choice: "yes" | "no") => {
    setSelections((prev) => ({
      ...prev,
      [index]: prev[index] === choice ? null : choice, // toggle off if same choice clicked
    }));
  };

  // Handle itinerary regen
  const regenerateItinerary = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not logged in!");
      setLoading(false);
      return;
    }

    const approvalResults =
      itinerary?.flatMap((day: ItineraryDay, dayIndex: number) =>
        day.items.map((item: ItineraryItem, itemIndex: number) => ({
          day: day.date,
          index: itemIndex,
          title: item.title,
          decision: selections[itemIndex] ?? null,
        }))
      ) ?? [];

    try {
      const response = await fetch(
        "http://localhost:8000/regenerate-itinerary",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            destination,
            start_date: checkInDate,
            end_date: checkOutDate,

            chat_messages: messages,
            approvals: approvalResults,
            previous_itinerary: itinerary,
          }),
        }
      );

      const result = await response.json();
      console.log("REGENERATED ITINERARY:", result);

      setItinerary(result.itinerary);
      setSelections({}); // reset selection states
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Error regenerating itinerary");
      setLoading(false);
    }
  };

  const saveFinalItinerary = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Not logged in!");
      return;
    }

    if (!itinerary) {
      alert("No itinerary to save");
      return;
    }

    // 1️⃣ Create main itinerary row
    const { data: itineraryRow, error: itineraryErr } = await supabase
      .from("itineraries")
      .insert({
        user_id: user.id,
        title: `${destination} Trip`,
        destination,
        start_date: checkInDate,
        end_date: checkOutDate,
        num_guests: `${guests.adults} adults, ${guests.children} children, ${guests.infants} infants, ${guests.pets} pets`,
      })
      .select()
      .single();

    if (itineraryErr) {
      console.error(itineraryErr);
      alert("Error saving itinerary");
      return;
    }

    const itineraryId = itineraryRow.id;

    // 2️⃣ Insert all days
    const dayRowsPayload = itinerary.map((day, index) => ({
      itinerary_id: itineraryId,
      day_number: index + 1,
      date: day.date,
      notes: "",
    }));

    const { data: dayRows, error: dayErr } = await supabase
      .from("itinerary_days")
      .insert(dayRowsPayload)
      .select();

    if (dayErr) {
      console.error(dayErr);
      alert("Error saving itinerary days");
      return;
    }

    // Build map: date → day_id
    const dayIdMap = new Map();
    dayRows.forEach((d) => dayIdMap.set(d.date, d.id));

    // 3️⃣ Insert activities for each day
    const allActivities = itinerary.flatMap((day) =>
      day.items.map((item, index) => ({
        day_id: dayIdMap.get(day.date),
        name: item.title,
        category: null,
        location_name: null,
        location_address: item.address,
        description: item.explanation,
        cost: null,
        start_time: null, // optional, unless you track real start times
        end_time: null,
        latitude: null,
        longitude: null,
        booking_url: item.url,
        place_id: null,
        is_fixed: selections[index] !== "no", // approved OR not explicitly rejected
      }))
    );

    const { error: actErr } = await supabase
      .from("activities")
      .insert(allActivities);

    if (actErr) {
      console.error(actErr);
      alert("Error saving activities");
      return;
    }

    setShowSavedModal(true);

    setTimeout(() => {
      setShowSavedModal(false);
      navigate(`/tripSummary/${itineraryId}`);
    }, 2000); // modal visible for 2s
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-101px)] 
  bg-gradient-to-br from-[#b4d6ff] via-[#dceeff] to-white"
    >
      <div className="flex justify-center mt-10">
        <div className="relative w-full mx-10">
          <div
            className="
    flex items-center 
    rounded-full px-6 py-4 
    bg-white/40 backdrop-blur-md 
    border border-[#c7d9f5]
    shadow-md 
    hover:bg-white/60 
    hover:shadow-xl 
    transition-all
  "
          >
            <div
              className="flex flex-col flex-1 px-4 border-r border-gray-300
             rounded-xl transition-all duration-200 
             hover:bg-gray-100 hover:shadow-sm hover:scale-[1.02] cursor-pointer"
            >
              <label className="text-sm font-semibold text-gray-800">
                Where
              </label>
              <input
                type="text"
                value={destination}
                placeholder="Search Destination"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
                onChange={handleLocationAutocomplete}
              />
            </div>

            <div
              className="flex flex-col flex-1 px-4 border-r border-gray-300
             rounded-xl transition-all duration-200
             hover:bg-gray-100 hover:shadow-sm hover:scale-[1.02] cursor-pointer"
            >
              <label className="text-sm font-semibold text-gray-800">
                Trip Start Date
              </label>
              <DatePicker
                selected={checkInDate}
                onChange={(date) => setCheckInDate(date)}
                placeholderText="Add dates"
                dateFormat="MM/dd/yyyy"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
              />
            </div>

            <div
              className="flex flex-col flex-1 px-4 border-r border-gray-300
             rounded-xl transition-all duration-200
             hover:bg-gray-100 hover:shadow-sm hover:scale-[1.02] cursor-pointer"
            >
              <label className="text-sm font-semibold text-gray-800">
                Trip End Date
              </label>
              <DatePicker
                selected={checkOutDate}
                onChange={(date) => setCheckOutDate(date)}
                placeholderText="Add dates"
                dateFormat="MM/dd/yyyy"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
              />
            </div>

            <div
              className="flex flex-col flex-1 px-4 
             rounded-xl transition-all duration-200
             hover:bg-gray-100 hover:shadow-sm hover:scale-[1.02] cursor-pointer"
            >
              <label className="text-sm font-semibold text-gray-800">
                Who (Number of guests)
              </label>

              <div
                className="text-sm text-gray-400"
                onClick={() => setShowGuestMenu(!showGuestMenu)}
              >
                {guests.adults +
                  guests.children +
                  guests.infants +
                  guests.pets >
                0
                  ? `${guests.adults} adults, ${guests.children} children, ${guests.infants} infants, ${guests.pets} pets`
                  : "Add guests"}
              </div>
            </div>

            <button
              className="ml-4 bg-[#81b4fa] text-white rounded-full p-3 hover:bg-blue-400 transition"
              onClick={() => submitTripQuery()}
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {locationAutocomplete.length > 0 && (
            <ul className="absolute top-[100%] left-0 right-0 bg-white border border-gray-200 rounded-b-2xl shadow-lg mt-1 z-20 overflow-hidden">
              {locationAutocomplete.map((city, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setDestination(city);
                    setLocationAutocomplete([]);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  {city}
                </li>
              ))}
            </ul>
          )}
          {showGuestMenu && (
            <div
              className="
    absolute mt-3 right-10 
    bg-white/60 backdrop-blur-xl 
    shadow-xl rounded-3xl 
    w-80 p-5 z-30 
    border border-[#c7d9f5]
  "
            >
              <div className="flex justify-between mx-5">
                <h1 className="mt-1">Adults</h1>
                <div className="flex gap-6">
                  <button
                    className="rounded-full border border-gray-400 text-gray-400 py-1 px-3 hover:border-black hover:text-black"
                    onClick={() => updateGuests("adults", -1)}
                    disabled={guests.adults === 0}
                  >
                    -
                  </button>
                  <h1 className="mt-1">{guests.adults}</h1>
                  <button
                    className="rounded-full border border-gray-400 text-gray-400 py-1 px-3 hover:border-black hover:text-black"
                    onClick={() => updateGuests("adults", 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <hr className="ml-5 w-[85%] mt-3 mb-3 border border-gray-200"></hr>
              <div className="flex justify-between mx-5">
                <h1 className="mt-1">Children</h1>
                <div className="flex gap-6">
                  <button
                    className="rounded-full border border-gray-400 text-gray-400 py-1 px-3 hover:border-black hover:text-black"
                    onClick={() => updateGuests("children", -1)}
                    disabled={guests.children === 0}
                  >
                    -
                  </button>
                  <h1 className="mt-1">{guests.children}</h1>
                  <button
                    className="rounded-full border border-gray-400 text-gray-400 py-1 px-3 hover:border-black hover:text-black"
                    onClick={() => updateGuests("children", 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <hr className="ml-5 w-[85%] mt-3 mb-3 border border-gray-200"></hr>
              <div className="flex justify-between mx-5">
                <h1 className="mt-1">Infants</h1>
                <div className="flex gap-6">
                  <button
                    className="rounded-full border border-gray-400 text-gray-400 py-1 px-3 hover:border-black hover:text-black"
                    onClick={() => updateGuests("infants", -1)}
                    disabled={guests.infants === 0}
                  >
                    -
                  </button>
                  <h1 className="mt-1">{guests.infants}</h1>
                  <button
                    className="rounded-full border border-gray-400 text-gray-400 py-1 px-3 hover:border-black hover:text-black"
                    onClick={() => updateGuests("infants", 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <hr className="ml-5 w-[85%] mt-3 mb-3 border border-gray-200"></hr>
              <div className="flex justify-between mx-5">
                <h1 className="mt-1">Pets</h1>
                <div className="flex gap-6">
                  <button
                    className="rounded-full border border-gray-400 text-gray-400 py-1 px-3 hover:border-black hover:text-black"
                    onClick={() => updateGuests("pets", -1)}
                    disabled={guests.pets === 0}
                  >
                    -
                  </button>
                  <h1 className="mt-1">{guests.pets}</h1>
                  <button
                    className="rounded-full border border-gray-400 text-gray-400 py-1 px-3 hover:border-black hover:text-black"
                    onClick={() => updateGuests("pets", 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {loading && (
        <div className="flex justify-center mt-16">
          <div
            className="
    flex flex-col items-center 
    bg-white/70 backdrop-blur-md 
    shadow-xl rounded-2xl 
    px-12 py-10 
    border border-[#c7d9f5]
    animate-fadeIn
  "
          >
            {/* Airplane Animation */}
            <div className="relative w-40 h-20 overflow-visible">
              <div className="absolute animate-planeFlight text-4xl">✈️</div>
            </div>

            {/* Bouncing Map Pin */}
            <div className="text-5xl mt-2 animate-bounce">📍</div>

            {/* Text */}
            <p className="mt-6 text-gray-700 font-semibold text-lg animate-pulse">
              Crafting your perfect adventure…
            </p>
          </div>
        </div>
      )}
      {showSavedModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30 z-[999] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl px-12 py-10 flex flex-col items-center animate-scaleIn">
            {/* Checkmark Animation */}
            <div className="text-6xl animate-bounce text-green-500">✔️</div>

            {/* Text */}
            <p className="mt-4 text-gray-700 font-semibold text-lg">
              Your itinerary has been saved!
            </p>

            <p className="text-gray-500 text-sm mt-1">
              Redirecting to bookings…
            </p>
          </div>
        </div>
      )}

      {showResults && (
        <div className="flex justify-between mx-10 mt-5">
          <div className="mt-3 bg-white shadow-xl rounded-2xl w-[35%] p-6 h-[65vh] flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800">
              Plan Your Activities
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tell me what you'd like to do on your trip. Mention specific
              activities, interests, or places you want to visit.
            </p>
            <div className="flex-1 bg-gray-50 rounded-xl mt-4 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#4b8ce8] text-white ml-auto"
                      : "bg-[#81d4fa] text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="E.g., I want to play tennis, visit jazz bars..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-[#4b8ce8] text-white px-5 py-2 rounded-xl hover:bg-blue-600 transition"
              >
                Send
              </button>
            </div>
          </div>

          <div className="mt-3 bg-white shadow-xl rounded-2xl w-[62%] p-6 h-[65vh] flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Itinerary
            </h2>
            <div className="flex gap-3 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-5 py-2 rounded-full border text-sm ${
                    selectedTab === tab
                      ? "bg-[#4b8ce8] text-white border-transparent"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  {tab === "Food" ? "🍽 Food Options" : tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-2">
              {/* --- FOOD TAB CONTENT --- */}
              {selectedTab === "Food" && (
                <div className="space-y-6">
                  {!foodOptions && (
                    <p className="text-gray-400 italic">
                      Loading food options…
                    </p>
                  )}

                  {foodOptions?.map((place: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition"
                    >
                      {/* Top Row: Icon + Name */}
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {foodTypeToIcon(place.type)}
                        </span>

                        <h3 className="text-xl font-semibold text-gray-900">
                          {place.title}
                        </h3>
                      </div>

                      {/* Type */}
                      <p className="text-sm text-gray-500 capitalize mt-1">
                        {place.type || "Food Spot"}
                      </p>

                      {/* Address */}
                      <div className="flex items-center gap-2 mt-2 text-gray-600 text-sm">
                        <span className="text-lg text-gray-400">📍</span>
                        <p>{place.address}</p>
                      </div>

                      {/* Rating + Price */}
                      <div className="flex items-center gap-4 mt-3">
                        <p className="text-yellow-600 font-medium text-sm flex items-center gap-1">
                          ⭐ {place.rating}
                        </p>

                        <p className="text-gray-700 font-medium text-sm">
                          {place.priceLevel}
                        </p>
                      </div>

                      {/* Explanation */}
                      {place.explanation && (
                        <p className="text-gray-500 italic text-sm mt-3 leading-relaxed">
                          {place.explanation}
                        </p>
                      )}

                      {/* Link */}
                      <a
                        href={place.url}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm underline mt-4 hover:text-blue-800 transition"
                      >
                        <span className="text-lg">🗺️</span>
                        <span>View on Maps</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* --- ITINERARY DAY TABS CONTENT --- */}
              {selectedTab !== "Food" &&
                itinerary
                  ?.find((day: any) => day.date === selectedTab)
                  ?.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition"
                    >
                      {/* Time */}
                      <p className="text-sm font-semibold text-orange-500">
                        {item.time}
                      </p>

                      {/* Icon + Title */}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xl">
                          {detectEventType(item.title)}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {item.title}
                        </h3>
                      </div>

                      {/* Explanation */}
                      <p className="text-gray-600 text-sm mt-3 italic leading-relaxed">
                        {item.explanation}
                      </p>

                      {/* Address row */}
                      <div className="flex items-center gap-2 mt-3 text-gray-500 text-sm">
                        <span className="text-lg text-gray-400">📍</span>
                        <p>{item.address}</p>
                      </div>
                      {/* Bottom Row: View on Map + Yes/No Buttons */}
                      <div className="flex justify-between items-center mt-3">
                        {/* View on Map (Left Side) */}
                        <a
                          href={item.url}
                          target="_blank"
                          className="inline-flex items-center gap-2 text-blue-600 text-sm underline hover:text-blue-800 transition"
                        >
                          <span className="text-lg">🗺️</span>
                          <span>View on Map</span>
                        </a>

                        <div className="flex gap-3">
                          {/* YES BUTTON */}
                          <button
                            className={`
      px-4 py-1.5 rounded-full text-sm font-medium transition shadow-sm
      ${
        selections[index] === "yes"
          ? "bg-green-500 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-green-200 hover:text-green-700"
      }
    `}
                            onClick={() => handleSelect(index, "yes")}
                          >
                            Yes ✔
                          </button>

                          {/* NO BUTTON */}
                          <button
                            className={`
      px-4 py-1.5 rounded-full text-sm font-medium transition shadow-sm
      ${
        selections[index] === "no"
          ? "bg-red-500 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-red-200 hover:text-red-700"
      }
    `}
                            onClick={() => handleSelect(index, "no")}
                          >
                            No ✖
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            <div className="flex justify-between items-center mt-5">
              <button
                className="bg-[#4b8ce8] text-white px-6 py-3 rounded-full hover:bg-blue-600 transition"
                onClick={regenerateItinerary}
              >
                Regenerate Itinerary
              </button>

              <button
                onClick={resetAll}
                className="border border-gray-300 px-6 py-3 rounded-full text-gray-700 hover:bg-gray-100 transition"
              >
                Clear & Restart
              </button>

              <button
                onClick={saveFinalItinerary}
                className="bg-[#4b8ce8] text-white px-6 py-3 rounded-full hover:bg-blue-600 transition"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
