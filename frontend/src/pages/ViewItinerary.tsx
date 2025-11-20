import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Message, ChatRequest, StructuredItinerary } from "../types/chat";
import { supabase } from "../supabaseClient";
import ItineraryView from "../components/ItineraryView";

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

function summarizeOnboarding(o: UserOnboarding | null): string {
  if (!o) return "No saved onboarding preferences.";
  const parts: string[] = [];
  if (o.preferred_pace) parts.push(`pace: ${o.preferred_pace}`);
  if (o.travel_style) parts.push(`style: ${o.travel_style}`);
  if (o.preferred_travel_mode) parts.push(`travel_mode: ${o.preferred_travel_mode}`);
  if (o.interests) parts.push(`interests: ${o.interests}`);
  if (o.dietary_restrictions) parts.push(`dietary: ${o.dietary_restrictions}`);
  if (o.budget_range) parts.push(`budget: ${o.budget_range}`);
  if (o.accessibility) parts.push(`accessibility: ${o.accessibility}`);
  if (o.age_range) parts.push(`age: ${o.age_range}`);
  if (o.gender) parts.push(`gender: ${o.gender}`);
  if (o.home_location) parts.push(`home_location: ${o.home_location}`);
  return parts.length ? parts.join(", ") : "No saved onboarding preferences.";
}

export default function ViewItinerary() {
  const { itineraryId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<StructuredItinerary | null>(null);

  // Fetch user and onboarding data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        navigate("/login");
        return;
      }
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
  }, [navigate]);

  // Fetch the itinerary data
  useEffect(() => {
    if (!userId || !itineraryId) return;

    async function fetchItinerary() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/v1/itinerary/${itineraryId}?user_id=${userId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch itinerary.");
        }
        const data = await res.json();
        setItinerary(data);
        setMessages([
          {
            role: "assistant",
            content: `Here is your itinerary for ${data.destination}. How can I help you modify it?`,
          },
        ]);
      } catch (e: any) {
        setError(e.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchItinerary();
  }, [userId, itineraryId]);

  async function handleModificationSend() {
    const trimmed = query.trim();
    if (!trimmed || !itinerary) return;

    const modificationSystemPrompt = `You are Itinera, an expert travel planner. Your task is to modify an existing itinerary based on the user's request.

        Respond with ONLY a single JSON object representing the *complete, updated* itinerary. Do not include any other text or markdown.

        The user wants to change the following itinerary.
        User's request: "${trimmed}"

        Current Itinerary JSON:
        ${JSON.stringify(itinerary, null, 2)}

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

        User profile: ${summarizeOnboarding(onboarding)}
        `;

    const systemMessage: Message = { role: "system", content: modificationSystemPrompt };
    const userMessage: Message = { role: "user", content: trimmed };

    const payloadMessages: Message[] = [systemMessage, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);
    setError(null);

    try {
      const body: ChatRequest = {
        messages: payloadMessages,
        user_id: userId,
        // people: itinerary.people, // Assuming people is part of itinerary object
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

      if (data.itinerary) {
        setItinerary(data.itinerary);
        const friendlyMessage: Message = {
          role: "assistant",
          content: `I have updated the itinerary based on your request.`,
        };
        setMessages((prev) => [...prev, friendlyMessage]);
      } else {
        setMessages((prev) => [...prev, data.message]);
        setError("Could not generate a structured itinerary from the response.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  }

  if (!itinerary) {
    return <div className="text-center py-10">{loading ? "Loading itinerary..." : "Itinerary not found."}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="max-w-4xl w-full mx-auto mt-8 pt-12">
        <ItineraryView itinerary={itinerary} />
      </div>

      {/* chat transcript */}
      <div className="flex-1 max-w-4xl w-full mx-auto mt-8 px-4 pb-28">
        {messages
          .filter((m) => m.role !== "system")
          .map((m, i) => (
            <div
              key={i}
              className={`mb-3 p-3 rounded-md ${
                m.role === "user" ? "bg-blue-50" : "bg-white border"
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {m.role === "user" ? "You" : "Itinera"}
              </div>
              <div className="whitespace-pre-wrap text-sm text-gray-800">
                {m.content}
              </div>
            </div>
          ))}
        {loading && <div className="text-sm text-gray-500">Thinking…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {/* bottom input */}
      <div className="border-t border-gray-200 bg-white p-4 fixed bottom-0 left-0 right-0 flex items-center justify-center shadow-md">
        <input
          type="text"
          placeholder="Ask Itinera to modify your itinerary..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleModificationSend()}
          className="w-3/4 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
        />
        <button
          onClick={handleModificationSend}
          className="ml-3 bg-[#81b4fa] text-white p-3 rounded-full hover:bg-blue-400 transition"
          disabled={loading}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
