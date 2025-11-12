import { Search, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "../types/chat";

export default function CreateItinerary() {
  const [query, setQuery] = useState("");
  const [where, setWhere] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  type ItineraryActivity = {
    time: string;
    attraction: string;
    weather?: string;
    description?: string;
  };

  type ItineraryDay = {
    day: number;
    activities: ItineraryActivity[];
  };

  type ItineraryPayload = {
    destination: string;
    duration: number;
    transportation?: string;
    itinerary: ItineraryDay[];
  };

  const tryParseItinerary = (content: string): ItineraryPayload | null => {
    const attempt = (text: string) => {
      try {
        const obj = JSON.parse(text);
        if (
          obj &&
          typeof obj === "object" &&
          Array.isArray((obj as any).itinerary) &&
          typeof (obj as any).destination === "string" &&
          typeof (obj as any).duration === "number"
        ) {
          return obj as ItineraryPayload;
        }
      } catch {}
      return null;
    };

    // Direct parse
    let parsed = attempt(content);
    if (parsed) return parsed;

    // Extract JSON substring between first '{' and last '}' if wrapped
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      parsed = attempt(content.slice(start, end + 1));
      if (parsed) return parsed;
    }

    // Handle Markdown fenced blocks ```json ... ```
    const fenceMatch = content.match(/```(?:json)?\n([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      parsed = attempt(fenceMatch[1]);
      if (parsed) return parsed;
    }

    return null;
  };

  // Remove unwanted citation-style links that sometimes appear at the end of descriptions
  const stripCitations = (text: string): string => {
    if (!text) return text;
    let out = text;

    // 1) Remove parenthetical groups that contain a markdown link entirely: ([label](url))
    //    Allow optional spaces/newlines between parts, optional leading dash/em-dash, and remove trailing punctuation.
    out = out.replace(
      /[\s\u2013\u2014-]*\(\s*\[[^\]]+\]\s*\(\s*(?:https?:\/\/)[^)]+\s*\)\s*\)[\s.,;:!?]*/gi,
      " "
    );

    // 2) Remove parenthetical groups that are just a URL or domain: (https://...), (example.com)
    out = out.replace(
      /[\s\u2013\u2014-]*\(\s*(?:https?:\/\/[^\s)]+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[\S)]*)?)\s*\)[\s.,;:!?]*/gi,
      " "
    );

    // 2b) Remove any parenthetical block that contains an http(s) URL, even if it has extra text
    out = out.replace(
      /[\s\u2013\u2014-]*\([^)]*https?:\/\/[^(\s)]+[^)]*\)[\s.,;:!?]*/gi,
      " "
    );

    // 3) Replace inline markdown links that include utm_source=openai with just the label
    out = out.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+utm_source=openai[^)]*)\)/gi,
      "$1"
    );

    // 4) Remove bare URLs containing utm_source=openai
    out = out.replace(/https?:\/\/[^\s)]+utm_source=openai[^\s)]*/gi, "");

    // 5) Remove trailing inline markdown link segments not wrapped in parentheses (allow optional spaces)
    out = out.replace(
      /[\s\u2013\u2014-]*\[[^\]]+\]\s*\((?:https?:\/\/)[^)]+\)[\s.,;:!?]*$/gi,
      ""
    );

    // 6) Clean up stray empty parentheses and extra spaces
    out = out.replace(/\s*\(\s*\)\s*/g, " ");
    out = out.replace(/\s{2,}/g, " ");
    return out.trim();
  };

  const ItineraryView = ({ data }: { data: ItineraryPayload }) => (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold text-gray-900">
          {data.destination}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">
            {data.duration} days
          </span>
          {data.transportation ? (
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">
              {data.transportation}
            </span>
          ) : null}
        </div>
      </div>
      {data.itinerary.map((day) => (
        <div key={day.day} className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-gray-700">
            Day {day.day}
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {day.activities.map((act, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-1.5"
              >
                <div className="text-xs text-gray-500">{act.time}</div>
                <div className="text-base font-semibold text-gray-900">
                  {act.attraction}
                </div>
                {act.weather ? (
                  <div className="text-xs text-gray-600">{act.weather}</div>
                ) : null}
                {act.description ? (
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {stripCitations(act.description)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (isLoading) return;

    const hasForm = [where, checkIn, checkOut, guests].some((v) => v.trim());
    const hasQuery = !!query.trim();
    if (!hasForm && !hasQuery) return;

    const computeDurationDays = (start: string, end: string): number | null => {
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
      const msPerDay = 1000 * 60 * 60 * 24;
      const diff = Math.ceil((e.getTime() - s.getTime()) / msPerDay);
      return diff > 0 ? diff + 1 : 1;
    };

    const durationDays =
      checkIn && checkOut ? computeDurationDays(checkIn, checkOut) : null;

    // Build a readable summary for the chat bubble
    const summaryParts: string[] = [];
    if (where.trim()) summaryParts.push(`Destination: ${where.trim()}`);
    if (checkIn.trim()) summaryParts.push(`Check-in: ${checkIn.trim()}`);
    if (checkOut.trim()) summaryParts.push(`Check-out: ${checkOut.trim()}`);
    if (guests.trim()) summaryParts.push(`Guests: ${guests.trim()}`);
    const summary = summaryParts.join(" | ");

    const visibleText = [
      summary || undefined,
      hasQuery ? `${query.trim()}` : undefined,
    ]
      .filter(Boolean)
      .join("\n\n");

    const userVisibleMessage: Message | null = visibleText
      ? { role: "user", content: visibleText }
      : null;

    // Structured payload to help the backend
    const structuredPayload = {
      type: "itinerary_request",
      where: where.trim() || undefined,
      check_in: checkIn.trim() || undefined,
      check_out: checkOut.trim() || undefined,
      duration: durationDays || undefined,
      guests: guests.trim() || undefined,
      additional_context: hasQuery ? query.trim() : undefined,
    };

    if (userVisibleMessage) {
      setMessages((prev) => [...prev, userVisibleMessage]);
    }

    // Clear only the free-form context; keep form fields so user can tweak
    setQuery("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages,
            ...(userVisibleMessage ? [userVisibleMessage] : []),
            {
              role: "user",
              content: JSON.stringify(structuredPayload),
            },
          ],
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      // Minimal debug to verify days returned
      try {
        const parsed = tryParseItinerary((data.message as Message).content);
        if (parsed) {
          console.log("Itinerary days received:", parsed.itinerary.length);
        } else {
          console.log(
            "Assistant message (non-itinerary):",
            (data.message as Message).content
          );
        }
      } catch {}
      setMessages((prev) => [...prev, data.message as Message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden md:block w-64 shrink-0 border-r border-t border-gray-200 bg-white">
        <div className="sticky top-24">
          <div className="border border-none p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              History
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 text-sm">No history yet!</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-center mt-20 px-4 md:px-8 lg:px-16 mb-4">
          <div className="flex items-center bg-white shadow-md rounded-full px-6 py-3 w-full max-w-4xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Where
              </label>
              <input
                type="text"
                placeholder="Search destinations"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Check in
              </label>
              <input
                type="text"
                placeholder="Add dates"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
              <label className="text-sm font-semibold text-gray-800">
                Check out
              </label>
              <input
                type="text"
                placeholder="Add dates"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col flex-1 px-4">
              <label className="text-sm font-semibold text-gray-800">Who</label>
              <input
                type="text"
                placeholder="Add guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={handleSend}
              className="ml-4 bg-[#81b4fa] text-white rounded-full p-3 hover:bg-blue-400 transition"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 px-4 md:px-8 lg:px-16 pb-32 mt-4">
          {/* Messages */}
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-16">
                Start planning your trip. Ask anything about destinations,
                dates, or ideas.
              </div>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`w-full px-3 py-4 ${
                  m.role === "assistant"
                    ? "bg-white border border-gray-200 rounded-xl"
                    : "bg-white border border-gray-200 rounded-xl"
                }`}
              >
                <div className="max-w-3xl mx-auto flex gap-3 items-start">
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded bg-emerald-500 text-black flex items-center justify-center text-lg shrink-0">
                      🤖
                    </div>
                  )}
                  <div className="flex-1">
                    {m.role === "assistant" && tryParseItinerary(m.content) ? (
                      <ItineraryView data={tryParseItinerary(m.content)!} />
                    ) : (
                      <div
                        className={`whitespace-pre-wrap break-words ${
                          m.role === "assistant"
                            ? "text-gray-800"
                            : "text-gray-900"
                        }`}
                      >
                        {m.content}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded bg-indigo-300 text-white flex items-center justify-center text-lg shrink-0">
                      👤
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="w-full px-3 py-4 bg-white border border-gray-200 rounded-xl">
                <div className="max-w-3xl mx-auto flex gap-3 items-center">
                  <div className="w-8 h-8 rounded bg-emerald-500 text-black flex items-center justify-center text-lg">
                    🤖
                  </div>
                  <div className="flex gap-1 text-gray-500 text-xl">
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-3xl mx-auto mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                ⚠️ {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
        {/* Right column bottom input bar */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 flex items-center justify-center shadow-md px-4 md:px-8 lg:px-16">
          <input
            type="text"
            placeholder="Ask Itinera anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="w-3/4 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
          />
          <button
            onClick={handleSend}
            className="ml-3 bg-[#81b4fa] text-white p-3 rounded-full hover:bg-blue-400 transition"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
