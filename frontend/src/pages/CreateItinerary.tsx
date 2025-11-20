import { Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
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
        destination: destination,
        start_date: checkInDate?.toISOString() ?? null,
        end_date: checkOutDate?.toISOString() ?? null,
        num_guests: numGuests,
        title: `Trip to ${destination} from ${checkInDate} to ${checkOutDate}`,
      },
    ]);

    if (error) {
      console.error("Error inserting data:", error.message);
      alert("Something went wrong — please try again!");
    } else {
      alert("Itinerary generation beginning!");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex justify-center mt-10">
        <div className="relative w-full max-w-4xl">
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
                Check in
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
                Check out
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
        </div>
      </div>
    </div>
  );
}
