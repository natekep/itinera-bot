import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import type { ChatRequest, Message } from "../types/chat";

// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_BASE = "http://127.0.0.1:8000";

type UserOnboarding = {
  user_id: string;
  preferred_pace?: string | null;
  travel_style?: string | null;
  preferred_travel_mode?: string | null;
  interests?: string | null;
  dietary_restrictions?: string | null;
  budget_range?: string | null;
  accessibility?: string | null;
  age_range?: string | null;
  gender?: string | null;
  home_location?: string | null;
  created_at?: string | null;
};

const SYSTEM_BASE = `You are Itinera, an expert travel planner. Your goal is to generate a complete, day-by-day travel itinerary based on user-provided details.

Respond with ONLY a single JSON object. Do not include any text, markdown formatting, or explanations before or after the JSON.

The JSON object must have a single root key named "trip_itinerary".

The "trip_itinerary" object must follow this structure:
- destination (string): The name of the primary travel destination.
- days (array of objects): A list of day-by-day plans.
  - day (number): The sequential day number (e.g., 1, 2, 3).
  - date (string): The date for this day in "YYYY-MM-DD" format.
  - theme (string): A brief, descriptive title for the day's plan (e.g., "Arrival and City Exploration").
  - activities (array of objects): A list of activities for the day.
    - start_time (string): The start time of the activity (e.g., "09:00", "13:00").
    - end_time (string): The end time of the activity (e.g., "12:00", "14:00").
    - description (string): A concise description of the activity.

Here is the user's information to help you personalize the itinerary:`;

const todayISO = () => new Date().toISOString().split("T")[0];
const addDaysISO = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split("T")[0];
};

function summarizeOnboarding(o: UserOnboarding | null): string {
  if (!o) return "No saved onboarding preferences.";
  const parts: string[] = [];
  if (o.preferred_pace) parts.push(`pace: ${o.preferred_pace}`);
  if (o.travel_style) parts.push(`style: ${o.travel_style}`);
  if (o.preferred_travel_mode)
    parts.push(`travel_mode: ${o.preferred_travel_mode}`);
  if (o.interests) parts.push(`interests: ${o.interests}`);
  if (o.dietary_restrictions)
    parts.push(`dietary: ${o.dietary_restrictions}`);
  if (o.budget_range) parts.push(`budget: ${o.budget_range}`);
  if (o.accessibility) parts.push(`accessibility: ${o.accessibility}`);
  if (o.age_range) parts.push(`age: ${o.age_range}`);
  if (o.gender) parts.push(`gender: ${o.gender}`);
  if (o.home_location) parts.push(`home_location: ${o.home_location}`);
  return parts.length ? parts.join(", ") : "No saved onboarding preferences.";
}

export default function CreateItinerary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Trip input states (top bar)
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [people, setPeople] = useState("");

  // Fetch the logged-in user's onboarding record to enrich the LLM context
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return; // supabase may be disabled in dev
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      setUserId(user.id);
      const { data, error } = await supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        if (!error) setOnboarding((data as UserOnboarding) ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Prefill From from onboarding
    if (!origin && onboarding?.home_location)
      setOrigin(onboarding.home_location);

    // Prefill Who
    if (!people && onboarding?.preferred_travel_mode) {
      // or a better source if you store party info; fallback to a sensible default
      setPeople("1 adult");
    } else if (!people) {
      setPeople("1 adult");
    }

    // Prefill dates
    if (!checkIn) setCheckIn(todayISO());
    if (!checkOut) setCheckOut(addDaysISO(3)); // 3 nights default, change as you like

    // Load last-used values
    const last = JSON.parse(
      localStorage.getItem("itinera_trip_defaults") || "{}"
    );
    if (!origin && last.origin) setOrigin(last.origin);
    if (!destination && last.destination) setDestination(last.destination);
    if (!people && last.people) setPeople(last.people);
    if (!checkIn && last.checkIn) setCheckIn(last.checkIn);
    if (!checkOut && last.checkOut) setCheckOut(last.checkOut);
  }, [onboarding]);

  useEffect(() => {
    if (checkIn && checkOut && checkOut < checkIn) {
      setCheckOut(checkIn);
    }
  }, [checkIn, checkOut]);

  async function handleInitialSend() {
    // For the API call, rebuild the system message to include onboarding context
    const tripParts: string[] = [];
    if (origin) tripParts.push(`origin: ${origin}`);
    if (destination) tripParts.push(`destination: ${destination}`);
    if (checkIn) tripParts.push(`check in date: ${checkIn}`);
    if (checkOut) tripParts.push(`check out date: ${checkOut}`);
    if (people) tripParts.push(`People: ${people}`);
    const tripSummary = tripParts.length ? tripParts.join(", ") : "None";

    const systemMessage: Message = {
      role: "system",
      content: `${SYSTEM_BASE}\n\nUser profile: ${summarizeOnboarding(
        onboarding
      )}\nTrip inputs: ${tripSummary}`,
    };

    const userMessage: Message = {
      role: "user",
      content: "Generate the itinerary based on the details provided.",
    };

    const payloadMessages: Message[] = [systemMessage, userMessage];

    setLoading(true);
    setError(null);

    try {
      const body: ChatRequest = {
        messages: payloadMessages,
        user_id: userId,
        people: people,
      };
      const res = await fetch(`${API_BASE}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.itinerary && data.itinerary.id) {
        navigate(`/itinerary/${data.itinerary.id}`);
      } else {
        setError(
          "Could not generate a structured itinerary from the response or missing itinerary ID."
        );
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex justify-center mt-20">
        <div className="flex items-center bg-white shadow-md rounded-full px-6 py-3 w-full max-w-4xl border border-gray-200 hover:shadow-lg transition-shadow">
          {/* top search bar UI (optional to wire later) */}
          <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
            <label className="text-sm font-semibold text-gray-800">
              From
            </label>
            <input
              type="text"
              placeholder="Where you at?"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
            <label className="text-sm font-semibold text-gray-800">
              Where
            </label>
            <input
              type="text"
              placeholder="Search destinations"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
            <label className="text-sm font-semibold text-gray-800">
              Check in
            </label>
            <input
              type="date"
              value={checkIn}
              min={todayISO()}
              onChange={(e) => setCheckIn(e.target.value)}
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
            <label className="text-sm font-semibold text-gray-800">
              Check out
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || todayISO()}
              onChange={(e) => setCheckOut(e.target.value)}
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col flex-1 px-4">
            <label className="text-sm font-semibold text-gray-800">
              Who
            </label>
            <input
              type="text"
              placeholder="Add people"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={handleInitialSend}
            className="ml-4 bg-[#81b4fa] text-white rounded-full p-3 hover:bg-blue-400 transition"
            disabled={loading}
          >
            {loading ? "..." : <Search className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl w-full mx-auto mt-4 text-center text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
