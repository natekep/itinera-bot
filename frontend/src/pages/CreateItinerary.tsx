import { Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import ItineraryTabs from "../components/ItineraryTabs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateItinerary() {
  const navigate = useNavigate();
  const [locationAutocomplete, setLocationAutocomplete] = useState<string[]>(
    []
  );
  const [destination, setDestination] = useState("");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [numGuests, setNumGuests] = useState("");
  const [searchComplete, setSearchComplete] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [adjustmentQuery, setAdjustmentQuery] = useState("");
  const [approvals, setApprovals] = useState<Record<string, boolean | null>>(
    {}
  );

  const [regenLoading, setRegenLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: string; content: string }[]
  >([]);

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

  // Submit itinerary
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log;
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          destination: destination,
          start_date: checkInDate?.toISOString().split("T")[0],
          end_date: checkOutDate?.toISOString().split("T")[0],
          num_guests: parseInt(numGuests),
        }),
      });

      const data = await response.json();

      console.log("Itinerary response:", data);

      if (data.status === "success") {
        setItinerary(data.itinerary);
        setSearchComplete(true);
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
      alert("Something went wrong!");
    }

    setLoading(false);
  };

  const handleRegenerate = async () => {
    if (!itinerary) return;

    const lastUserMessage =
      chatMessages.filter((m) => m.role === "user").slice(-1)[0]?.content || "";

    try {
      setRegenLoading(true);

      const response = await fetch(
        "http://localhost:8000/regenerate-itinerary",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original_itinerary: itinerary,
            approvals: approvals,
            user_query: lastUserMessage,
          }),
        }
      );

      const data = await response.json();
      console.log("Regenerated itinerary:", data);

      if (data.status === "success") {
        const pruned: Record<string, boolean> = {};

        const newDays = data.itinerary.days;

        for (const key in approvals) {
          const [dayIndexStr, activityIndexStr] = key.split("-");
          const dayIndex = parseInt(dayIndexStr);
          const activityIndex = parseInt(activityIndexStr);

          if (
            newDays[dayIndex] &&
            newDays[dayIndex].activities &&
            newDays[dayIndex].activities[activityIndex]
          ) {
            pruned[key] = approvals[key]!;
          }
        }

        setApprovals(pruned);
        setItinerary(data.itinerary);

        // assistant message
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Your itinerary has been updated!" },
        ]);
      }
    } catch (err) {
      console.error("Error regenerating itinerary:", err);
    } finally {
      setRegenLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (adjustmentQuery.trim() === "") return;

    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: adjustmentQuery },
    ]);

    const userMessage = adjustmentQuery;
    setAdjustmentQuery("");

    // === CALL BACKEND FOR LLM RESPONSE ===
    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, { role: "user", content: userMessage }],
          itinerary: itinerary,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  // Filter itinerary to remove rejected activities
  const getFilteredItinerary = () => {
    if (!itinerary) return null;

    const filteredDays = itinerary.days.map((day: any, dayIndex: number) => {
      const filteredActivities = day.activities.filter(
        (_: any, activityIndex: number) => {
          const key = `${dayIndex}-${activityIndex}`;
          const decision = approvals[key];

          // keep if YES or not selected
          return (
            decision === true || decision === null || decision === undefined
          );
        }
      );

      return {
        ...day,
        activities: filteredActivities,
      };
    });

    return { ...itinerary, days: filteredDays };
  };

  const handleSaveItinerary = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return alert("You must be logged in.");

    try {
      setSaveLoading(true);

      const filteredItinerary = getFilteredItinerary(); // <-- NEW

      const response = await fetch("http://localhost:8000/save-itinerary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          itinerary: filteredItinerary, // <-- send filtered version
          num_guests: numGuests,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        console.log("Saved!", data);
        alert("Itinerary saved successfully!");
        navigate(`/bookings/${data.itinerary_id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving itinerary.");
    } finally {
      setSaveLoading(false);
    }
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
              <input
                type="text"
                placeholder="Add guests"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
                value={numGuests}
                onChange={(e) => setNumGuests(e.target.value)}
              />
            </div>

            <button
              className="ml-4 bg-[#81b4fa] text-white rounded-full p-3 hover:bg-blue-400 transition"
              onClick={handleSubmit}
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
          {loading && (
            <div className="w-full flex justify-center mt-12">
              <div className="bg-white shadow-md rounded-xl px-6 py-4 border text-center">
                <p className="text-gray-700 font-medium text-sm">
                  Generating your itinerary… please wait!
                </p>
              </div>
            </div>
          )}
          {searchComplete && (
            <div className="w-full max-w-8xl mx-auto mt-12 pb-12 px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: Chat Window */}
                <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200 min-h-[350px]">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Plan Your Activities
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Tell me what you'd like to do on your trip. Mention specific
                    activities, interests, or places you want to visit.
                    <br></br>
                    <br></br>Press the regenerate itinerary after selecting yes
                    or no to each activity and chatting with Itinera!
                  </p>

                  {/* Chat messages */}
                  <div className="h-[260px] bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <p className="text-gray-400 text-sm">
                        Start typing to plan your trip…
                      </p>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`mb-2 p-2 rounded-lg text-sm w-fit max-w-[75%] ${
                            msg.role === "user"
                              ? "bg-blue-100 text-blue-900 ml-auto"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {msg.content}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input */}
                  <div className="flex items-center mt-4">
                    <input
                      type="text"
                      placeholder="E.g., Add more nightlife, remove museums..."
                      className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={adjustmentQuery}
                      onChange={(e) => setAdjustmentQuery(e.target.value)}
                    />
                    <button
                      className="ml-3 bg-[#81b4fa] text-white px-5 py-2 rounded-full hover:bg-blue-400 transition"
                      onClick={handleSendMessage}
                    >
                      Send
                    </button>
                  </div>
                </div>

                {/* RIGHT: Itinerary Card */}
                <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200 min-h-[350px]">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Your Itinerary
                  </h2>

                  {!itinerary ? (
                    <div className="flex flex-col items-center justify-center h-[260px] text-center">
                      <p className="text-gray-500 text-sm">No itinerary yet.</p>
                    </div>
                  ) : (
                    <ItineraryTabs
                      key={JSON.stringify(itinerary)}
                      itinerary={itinerary}
                      onApprovalChange={(data) => setApprovals(data)}
                    />
                  )}
                  <button
                    className={`px-6 py-2 rounded-full text-sm transition text-white mt-10 
    ${
      regenLoading
        ? "bg-blue-300 cursor-not-allowed"
        : "bg-blue-500 hover:bg-blue-600"
    }
  `}
                    onClick={handleRegenerate}
                    disabled={regenLoading}
                  >
                    {regenLoading ? "Regenerating…" : "Regenerate Itinerary"}
                  </button>

                  <div className="flex justify-between mt-4">
                    <button className="border border-gray-300 rounded-full px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                      Clear & Restart
                    </button>
                    <button
                      onClick={handleSaveItinerary}
                      disabled={saveLoading}
                      className={`px-6 py-2 rounded-full text-sm text-white transition ${
                        saveLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : Object.values(approvals).some((v) => v === false)
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-[#007BCE] hover:bg-blue-500"
                      }`}
                    >
                      {saveLoading ? "Saving…" : "Save & Continue"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
