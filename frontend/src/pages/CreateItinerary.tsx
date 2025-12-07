import { Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import ItineraryTabs from "../components/ItineraryTabs";
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
    // Get logged in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if user is logged in before inserting trip query
    if (!user) {
      alert("User is not logged in!");
      return;
    }

    const { error } = await supabase.from("trip_queries").insert({
      user_id: user.id,
      destination: destination,
      trip_start_date: checkInDate,
      trip_end_date: checkOutDate,
      guest_summary: `${guests.adults} adults, ${guests.children} children, ${guests.infants} infants, ${guests.pets} pets`,
    });

    if (error) {
      alert("Itinerary could not be generated!");
    } else {
      alert("Generating Itinerary!!!");
    }
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#81b4fa] to-[#4b8ce8]">
      <div className="flex justify-center mt-10">
        <div className="relative w-full mx-10">
          <div className="flex items-center bg-white shadow-md rounded-full px-6 py-3 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Where
              </label>
              <input
                type="text"
                value={destination}
                placeholder="Search Destination"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
                onChange={handleLocationAutocomplete}
              />
            </div>

            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Trip Start Date
              </label>
              <DatePicker
                selected={checkInDate}
                onChange={(date) => setCheckInDate(date)}
                placeholderText="Add dates"
                dateFormat="MM/dd/yyyy"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Trip End Date
              </label>
              <DatePicker
                selected={checkOutDate}
                onChange={(date) => setCheckOutDate(date)}
                placeholderText="Add dates"
                dateFormat="MM/dd/yyyy"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-col flex-1 px-4">
              <label className="text-sm font-semibold text-gray-800">
                Who (Number of guests)
              </label>
              <div
                className="text-sm text-gray-400 "
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
            <div className="absolute mt-3 right-10 bg-white shadow-xl rounded-3xl w-80 p-5 z-30 ">
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
      <div className="flex justify-between mx-10 mt-5">
        <div className="mt-3 bg-white shadow-xl rounded-2xl w-[35%] p-6 h-[65vh] flex flex-col">
          {/* HEADER */}
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

        <div className="mt-3 bg-white shadow-xl rounded-2xl w-[62%] p-5 h-[65vh]"></div>
      </div>
    </div>
  );
}
