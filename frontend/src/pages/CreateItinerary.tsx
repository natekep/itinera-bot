// frontend/src/pages/CreateItinerary.tsx

import mockItineraryTokyo from "../utils/mockItineraryTokyo";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import saveItinerary from "../services/saveItinerary";
import { listItineraryDetails } from "../services/listItineraryDetails";
import { supabase } from "../supabaseClient";

import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Calendar, MapPin, Users, Search, Send, Loader2 } from "lucide-react";

import type { Itinerary } from "../types/itinerary";
import { ItineraryCalendar } from "../components/ItineraryCalendar";
import ItinerarySidebar from "../components/ItinerarySidebar";
import mockItineraryNewYork from "../utils/mockItineraryNewYork";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CreateItinerary: React.FC = () => {
  const navigate = useNavigate();

  // Sidebar state
  const [selectedItineraryId, setSelectedItineraryId] = useState<number | null>(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  // Search form state
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  // Itinerary state
  const [itinerary, setItinerary] = useState<Itinerary | null>(mockItineraryNewYork);
  const [hasSearched, setHasSearched] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // AUTH GUARD
  // -----------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/login");
    };
    checkAuth();
  }, [navigate]);

  // -----------------------------
  // SEARCH HANDLER
  // -----------------------------
  const handleSearch = () => {
    if (!destination || !checkIn || !checkOut) {
      alert("Please fill in destination, check-in, check-out.");
      return;
    }

    console.log("SEARCHING →", { destination, checkIn, checkOut, guests });

    setHasSearched(true);
    setLoading(true);

    setItinerary({
      ...mockItineraryNewYork,
      destination,
      startDate: checkIn,
      endDate: checkOut,
      guests: parseInt(guests || "1", 10),
    });

    const days = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    setTimeout(() => {
      setChatMessages([
        {
          role: "assistant",
          content: `Great — generating a ${days}-day itinerary for ${guests} traveler(s) to ${destination}.`,
          timestamp: new Date(),
        },
      ]);
      setLoading(false);
    }, 800);
  };

  // -----------------------------
  // CHAT SEND
  // -----------------------------
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || loading) return;

    const msg: ChatMessage = {
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, msg]);
    setCurrentMessage("");
    setLoading(true);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Okay! I'll modify your itinerary accordingly.",
          timestamp: new Date(),
        },
      ]);
      setLoading(false);
    }, 900);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // -----------------------------
  // SAVE ITINERARY
  // -----------------------------
  const handleSaveItinerary = async () => {
    if (!itinerary) {
      alert("Nothing to save");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      alert("Not logged in");
      navigate("/login");
      return;
    }

    try {
      console.log("Saving itinerary →", itinerary);
      const { itineraryId } = await saveItinerary(itinerary, session.user.id);
      console.log("Saved itinerary ID =", itineraryId);

      alert("Saved!");

      setSidebarRefreshKey((k) => k + 1);
      setSelectedItineraryId(itineraryId);
    } catch (err) {
      console.error("SAVE FAILED:", err);
      alert("Could not save itinerary.");
    }
  };

  // -----------------------------
  // CLEAR ITINERARY
  // -----------------------------
  const handleClearItinerary = () => {
    console.log("Clearing itinerary...");
    setItinerary(null);
    setChatMessages([]);
    setDestination("");
    setCheckIn("");
    setCheckOut("");
    setGuests("1");
    setSelectedItineraryId(null);
    setHasSearched(false);
  };

  // -----------------------------
  // LOAD SAVED ITINERARY
  // -----------------------------
  const handleSelectSaved = async (id: number) => {
    console.log("LOADING ITINERARY ID =", id);

    try {
      const result = await listItineraryDetails(id);
      console.log("SUPABASE RESULT RAW →", JSON.parse(JSON.stringify(result)));

      const base = result.itinerary;
      const rawDays = result.days;

      console.log("RAW DAYS:", rawDays);

      const days = rawDays.map((d: any) => {
        console.log("Mapping day row:", d);

        const mappedActivities = (d.activities || []).map((a: any) => {
          console.log("Mapping activity row:", a);

          return {
            id: a.id,
            name: a.name,
            type: a.category,            // <-- FIXED
            startTime: a.start_time,
            endTime: a.end_time,
            description: a.description,
            isFixed: a.is_fixed,
            cost: a.cost,
            notes: a.notes,
            bookingUrl: a.booking_url,
            location: {
              name: a.location_name,
              address: a.location_address,
              latitude: a.latitude,
              longitude: a.longitude,
            },
          };
        });

        return {
          id: d.id,
          day_number: d.day_number,
          date: d.date,
          notes: d.notes,
          activities: mappedActivities,
        };
      });


      const full: Itinerary = {
        id: base.id,
        userId: base.user_id,
        title: base.title,
        destination: base.destination,
        startDate: base.start_date,
        endDate: base.end_date,
        guests: Number(base.num_guests ?? 1),
        totalCost: base.total_cost,
        createdAt: base.created_at,
        updatedAt: base.updated_at,
        days,
      };

      console.log("FINAL ITINERARY OBJECT →", full);

      setSelectedItineraryId(id);
      setItinerary(full);

      setDestination(full.destination);
      setCheckIn(full.startDate);
      setCheckOut(full.endDate);
      setGuests(full.guests.toString());
      setHasSearched(true);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      alert("Failed to load itinerary.");
    }
  };
  // -------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-20">
        {/* LEFT SIDEBAR — Saved Itineraries */}
        <ItinerarySidebar
          selectedId={selectedItineraryId ?? undefined}
          onSelect={handleSelectSaved}
          refreshKey={sidebarRefreshKey}
        />

        {/* RIGHT MAIN CONTENT */}
        <main className="flex-1 pb-8">
          <div className="container mx-auto px-4 max-w-6xl">

            {/* SEARCH BAR */}
            <Card className="p-4 mb-6 shadow-medium">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                {/* Destination Input */}
                <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Where to?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Check-In */}
                <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="border-0 p-0 h-auto focus-visible:ring-0"
                  />
                </div>

                {/* Check-Out */}
                <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn}
                    className="border-0 p-0 h-auto focus-visible:ring-0"
                  />
                </div>

                {/* Guests + Search */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background flex-1">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="border-0 p-0 h-auto w-14"
                    />
                  </div>

                  <Button
                    onClick={hasSearched ? handleClearItinerary : handleSearch}
                    className="px-3"
                    variant={hasSearched ? "outline" : "default"}
                  >
                    {hasSearched ? "Reset" : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>

            {/* GRID: Chat + Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* LEFT: Chat */}
              <Card className="shadow-medium flex flex-col h-[600px]">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Plan Your Activities</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ask for changes, additions, or recommendations.
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {chatMessages.length === 0 && !hasSearched && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-2">Ready to plan your perfect trip?</p>
                        <p className="text-sm">Search above to begin.</p>
                      </div>
                    )}

                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tell me what you'd like to change..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* RIGHT: Calendar */}
              <Card className="shadow-medium p-4 h-[600px]">
                <ItineraryCalendar
                  itinerary={itinerary}
                  onItineraryChange={(updated) => {
                    console.log("CALENDAR UPDATED ITINERARY:", updated);
                    setItinerary(updated);
                  }}
                  onSave={handleSaveItinerary}
                  onClear={handleClearItinerary}
                />
              </Card>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateItinerary;
