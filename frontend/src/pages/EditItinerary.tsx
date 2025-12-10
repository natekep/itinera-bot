import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import type { User } from "@supabase/supabase-js";

export default function EditItinerary() {
  const { itinerary_id } = useParams();
  const navigate = useNavigate();

  // Trip Query Details
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
  const [_, setShowGuestMenu] = useState(false);

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
  const [user, setUser] = useState<User | null>(null);

  // Approval states
  const [selections, setSelections] = useState<
    Record<number, "yes" | "no" | null>
  >({});

  const fetchItinerary = async (userId: string) => {
    setLoading(true);

    const response = await fetch("http://3.136.161.243:8000/fetch-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itinerary_id,
        user_id: userId,
      }),
    });

    console.log(guests);

    const result = await response.json();
    console.log("FETCHED ITINERARY:", result);

    if (!result || !result.itinerary || result.itinerary.length === 0) {
      throw new Error("No itinerary found");
    }

    const sortedDays = [...result.itinerary].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstDate = new Date(sortedDays[0].date);
    const lastDate = new Date(sortedDays[sortedDays.length - 1].date);

    setCheckInDate(firstDate);
    setCheckOutDate(lastDate);
    setItinerary(result.itinerary);

    const loadedDates = result.itinerary.map((d: any) => d.date);
    setTabs([...loadedDates, "Food"]);
    setSelectedTab(loadedDates[0]);
    setShowResults(true);
    setLoading(false);
  };

  const fetchFood = async (userId: string) => {
    // Dates are currently unused here because food options are persisted in Supabase
    if (!itinerary_id) return;

    const { data, error } = await supabase
      .from("food_options")
      .select(
        "id, user_id, itinerary_id, name, address, rating, price_level, url, explanation"
      )
      .eq("user_id", userId)
      .eq("itinerary_id", itinerary_id);

    if (error) {
      console.error("Error fetching food options from Supabase:", error);
      return;
    }

    const transformed = (data || []).map((row: any) => ({
      title: row.name,
      // type is not stored in food_options; leave undefined so UI falls back gracefully
      address: row.address,
      rating: row.rating,
      priceLevel: row.price_level,
      explanation: row.explanation,
      url: row.url,
    }));

    setFoodOptions(transformed);
  };

  useEffect(() => {
    const initUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        alert("User is not logged in!");
        return;
      }
      setUser(authUser);
    };

    initUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        await fetchItinerary(user.id);
        await fetchFood(user.id);
      } catch (error) {
        console.error(error);
        alert("Error loading itinerary");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

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
      itinerary?.flatMap((day: ItineraryDay, _: number) =>
        day.items.map((item: ItineraryItem, itemIndex: number) => ({
          day: day.date,
          index: itemIndex,
          title: item.title,
          decision: selections[itemIndex] ?? null,
        }))
      ) ?? [];

    try {
      const response = await fetch(
        "http://3.136.161.243:8000/regenerate-itinerary",
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
    if (!itinerary) {
      alert("No itinerary to save");
      return;
    }

    // 1️⃣ Fetch existing days for this itinerary
    const { data: existingDays, error: fetchDaysErr } = await supabase
      .from("itinerary_days")
      .select("id, date")
      .eq("itinerary_id", itinerary_id);

    if (fetchDaysErr) {
      console.error(fetchDaysErr);
      alert("Error fetching existing days");
      return;
    }

    // Build map: date → day_id
    const dayIdMap = new Map<string, string>();
    existingDays?.forEach((d) => dayIdMap.set(d.date, d.id));

    // 2️⃣ Delete existing activities for all days
    const dayIds = existingDays?.map((d) => d.id) ?? [];
    if (dayIds.length > 0) {
      const { error: deleteErr } = await supabase
        .from("activities")
        .delete()
        .in("day_id", dayIds);

      if (deleteErr) {
        console.error(deleteErr);
        alert("Error clearing old activities");
        return;
      }
    }

    // 3️⃣ Insert updated activities for each day
    const allActivities = itinerary.flatMap((day) =>
      day.items.map((item, index) => ({
        day_id: dayIdMap.get(day.date),
        name: item.title,
        category: null,
        location_name: null,
        location_address: item.address,
        description: item.explanation,
        cost: null,
        start_time: null,
        end_time: null,
        latitude: null,
        longitude: null,
        booking_url: item.url,
        place_id: null,
        is_fixed: selections[index] !== "no",
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
      navigate(`/tripSummary/${itinerary_id}`);
    }, 2000);
  };

  return (
    <div className="h-full bg-gradient-to-br from-[#b4d6ff] via-[#dceeff] to-white overflow-hidden">
      <main className="h-full w-full py-6 px-6 flex flex-col">
        <div className="w-full flex-1 min-h-0 flex flex-col">
          {loading && (
            <div className="flex justify-center mt-16">
              <div className="flex flex-col items-center bg-white shadow-xl rounded-2xl px-12 py-10 animate-fadeIn">
                {/* Airplane Animation */}
                <div className="relative w-40 h-20 overflow-visible">
                  <div className="absolute animate-planeFlight text-4xl">
                    ✈️
                  </div>
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

          {showResults && !loading && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] h-full min-h-0">
              <div className="bg-white/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/30 flex flex-col overflow-hidden min-h-0">
                <h2 className="text-xl font-semibold text-gray-800">
                  Plan Your Activities
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Tell me what you'd like to do on your trip. Mention specific
                  activities, interests, or places you want to visit.
                </p>
                <div className="flex-1 min-h-0 bg-white/40 rounded-xl mt-4 p-4 overflow-y-auto space-y-4">
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
                    className="flex-1 border border-[#c7d9f5] rounded-xl px-4 py-2 text-sm bg-white/40 backdrop-blur-sm focus:ring-2 focus:ring-[#81b4fa] focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-[#6fb3ff] to-[#4b8ce8] text-white px-5 py-2 rounded-xl shadow-md hover:shadow-lg hover:from-[#81c2ff] hover:to-[#5d9bf0] transition"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="bg-white/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/30 flex flex-col overflow-hidden min-h-0">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Your Itinerary
                </h2>
                <div className="flex flex-wrap gap-3 mt-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={`px-5 py-2 rounded-full border text-sm transition ${
                        selectedTab === tab
                          ? "bg-[#4b8ce8] text-white border-transparent shadow-md"
                          : "bg-white/60 text-gray-700 border-[#c7d9f5] hover:bg-white"
                      }`}
                    >
                      {tab === "Food" ? "🍽 Food Options" : tab}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto mt-4 space-y-6 pr-2">
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
                          className="bg-white/70 rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition"
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
                          className="bg-white/70 rounded-xl p-5 border border-white/50 shadow-sm hover:shadow-md transition"
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

                <div className="flex flex-wrap gap-3 justify-between items-center mt-5">
                  <button
                    className="bg-gradient-to-r from-[#6fb3ff] to-[#4b8ce8] text-white px-6 py-3 rounded-full shadow-md hover:shadow-lg hover:from-[#81c2ff] hover:to-[#5d9bf0] transition"
                    onClick={regenerateItinerary}
                  >
                    Regenerate Itinerary
                  </button>

                  <button
                    onClick={resetAll}
                    className="border border-[#c7d9f5] px-6 py-3 rounded-full text-gray-700 bg-white/60 hover:bg-white transition"
                  >
                    Clear & Restart
                  </button>

                  <button
                    onClick={saveFinalItinerary}
                    className="bg-gradient-to-r from-[#6fb3ff] to-[#4b8ce8] text-white px-6 py-3 rounded-full shadow-md hover:shadow-lg hover:from-[#81c2ff] hover:to-[#5d9bf0] transition"
                  >
                    Save & Continue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
