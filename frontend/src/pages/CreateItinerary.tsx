import { Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function CreateItinerary() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [locationAutocomplete, setLocationAutocomplete] = useState<string[]>(
    []
  );
  const [destination, setDestination] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numGuests, setNumGuests] = useState("");
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    setQuery(e.target.value);
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
          "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_API_KEY,
        },
      }
    );

    const data: GooglePlacesAutocompleteResponse = await res.json();
    const locationPredictions = data.suggestions.map(
      (s) => s.placePrediction.text.text
    );
    setLocationAutocomplete(locationPredictions);
  };

  // Submit itinerary
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      navigate("/login");
      return;
    }

    const { error } = await supabase.from("itineraries").insert([
      {
        user_id: user.id,
        destination,
        start_date: checkInDate,
        end_date: checkOutDate,
        num_guests: numGuests,
        title: `Trip to ${destination} from ${checkInDate} to ${checkOutDate}`,
      },
    ]);

    if (error) {
      console.error("Error inserting data:", error.message);
      alert("Something went wrong — please try again!");
    } else {
      alert("Itinerary generation beginning!");
      generateItinerary(user.id);
    }
  };

  const generateItinerary = async (userId: string) => {
    setLoading(true);
    const res = await fetch("http://localhost:8000/generate_itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        destination,
        checkInDate,
        checkOutDate,
        numGuests: parseInt(numGuests),
      }),
    });
    const data = await res.json();
    console.log(data.ai_itinerary);
    setItinerary(data.ai_itinerary);
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex justify-center mt-20">
        <div className="relative w-full max-w-4xl">
          <div className="flex items-center bg-white shadow-md rounded-full px-6 py-3 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Where
              </label>
              <input
                type="text"
                value={destination || query}
                placeholder="Search Destination"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
                onChange={handleLocationAutocomplete}
              />
            </div>

            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Check in (mm/dd/yyyy)
              </label>
              <input
                type="text"
                placeholder="Add dates"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Check out (mm/dd/yyyy)
              </label>
              <input
                type="text"
                placeholder="Add dates"
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
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
        </div>
      </div>

      {loading && (
        <div className="flex justify-center mt-8 text-gray-500">
          Generating your itinerary ✈️ ...
        </div>
      )}

      {!loading && itinerary && (
        <div className="mt-10 px-6 max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {itinerary.destination} Itinerary
          </h2>
          {itinerary.days.map((day: any, index: number) => (
            <div key={index} className="mb-6">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">
                Day {index + 1} — {day.date}
              </h3>
              <div className="space-y-3">
                {day.activities.map((activity: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
                  >
                    <p className="text-sm text-gray-500 font-medium">
                      {activity.time}
                    </p>
                    <h4 className="text-base font-semibold text-gray-800">
                      {activity.name}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 italic mt-1">
                      Explanation: {activity.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
