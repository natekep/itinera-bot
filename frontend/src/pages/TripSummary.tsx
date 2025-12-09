import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import MapView from "../components/MapView";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Car, Footprints, Bike, Bus, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function TripSummary() {
  const { itinerary_id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [travelTimesMap, setTravelTimesMap] = useState<Record<string, string>>(
    {}
  );
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [travelMode, setTravelMode] = useState<
    "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT"
  >("DRIVE");
  const [mapLabels, setMapLabels] = useState<string[]>([]);

  const GOOGLE_KEY = import.meta.env.VITE_MAP_CLIENT_KEY;

  // Convert DB time string to readable 12-hour format
  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Map User Preference String to Google API Constant
  const mapUserModeToGoogle = (userPref: string) => {
    if (!userPref) return "DRIVE";
    const mode = userPref.toLowerCase();
    if (mode.includes("walk")) return "WALK";
    if (mode.includes("transit") || mode.includes("public")) return "TRANSIT";
    if (mode.includes("bike") || mode.includes("cycling")) return "BICYCLE";
    return "DRIVE";
  };

  const letter = (i: number) => {
    let s = "";
    while (i >= 0) {
      s = String.fromCharCode((i % 26) + 65) + s;
      i = Math.floor(i / 26) - 1;
    }
    return s;
  };

  const reverseGeocode = (lat?: number, lng?: number) => {
    if (!lat || !lng) return "Unknown location";
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Load itinerary from Supabase
  const loadItinerary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("itineraries")
        .select(
          `
          id,
          title,
          destination,
          start_date,
          end_date,
          num_guests,
          user_id,
          itinerary_days (
            id,
            day_number,
            date,
            notes,
            activities (
              id,
              name,
              category,
              location_name,
              place_id,
              description,
              start_time,
              end_time,
              location_address,
              latitude,
              longitude
            )
          )
        `
        )
        .eq("id", itinerary_id)
        .single();

      if (error) {
        console.error("Error loading itinerary: ", error);
        setItinerary(null);
        setLoading(false);
        return;
      }

      // Sort days and activities
      if (data.itinerary_days) {
        data.itinerary_days.sort(
          (a: any, b: any) => a.day_number - b.day_number
        );
        data.itinerary_days.forEach((day: any) => {
          if (day.activities) {
            day.activities.sort((a: any, b: any) => {
              const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
              const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
              return timeA - timeB;
            });
          } else {
            day.activities = [];
          }
        });
      } else {
        data.itinerary_days = [];
      }

      setItinerary(data);

      // Flatten activities for any global calculations you need
      const flatActivities = data.itinerary_days.flatMap(
        (d: any) => d.activities ?? []
      );
      setActivities(flatActivities);

      // Fetch User Preference for Travel Mode (optional)
      if (data.user_id) {
        const { data: profileData } = await supabase
          .from("user_onboarding")
          .select("preferred_travel_mode")
          .eq("user_id", data.user_id)
          .single();

        if (profileData?.preferred_travel_mode) {
          const mapped = mapUserModeToGoogle(profileData.preferred_travel_mode);
          setTravelMode(mapped as any);
        }
      }
    } catch (err) {
      console.error("loadItinerary error:", err);
      setItinerary(null);
    } finally {
      setLoading(false);
    }
  };

  const parseDurationFromEntry = (entry: any): number | null => {
    if (!entry) return null;
    const d =
      entry.duration ?? entry.durationSeconds ?? entry.durationMeters ?? null;

    // If it's a number (seconds)
    if (typeof d === "number") return Math.round(d);

    if (typeof d === "string") {
      // extract first number (could be "345s" or "345.2s")
      const m = d.match(/(\d+(\.\d+)?)/);
      if (m) return Math.round(parseFloat(m[1]));
      return null;
    }

    if (typeof entry === "object") {
      // sometimes entry.duration?.value exists (seconds)
      if (entry.duration?.value && typeof entry.duration.value === "number") {
        return Math.round(entry.duration.value);
      }
      if (entry.durationSeconds && typeof entry.durationSeconds === "number") {
        return Math.round(entry.durationSeconds);
      }
    }

    return null;
  };

  // Format seconds to human-friendly string
  const formatSeconds = (seconds: number) => {
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
    }
    return `${minutes} min`;
  };

  // Compute travel times per day and return a map activityId -> time to NEXT stop
  const computeTravelTimesPerDay = async () => {
    if (!itinerary || !itinerary.itinerary_days) return;
    if (!GOOGLE_KEY) {
      // no key — set N/A for all
      const map: Record<string, string> = {};
      itinerary.itinerary_days.forEach((day: any) => {
        (day.activities || []).forEach((act: any, i: number) => {
          // last activity has no next
          if (i < (day.activities?.length ?? 0) - 1) {
            map[act.id] = "N/A";
          }
        });
      });
      setTravelTimesMap(map);
      return;
    }

    const map: Record<string, string> = {};

    // Iterate each day to avoid crossing day boundaries
    for (const day of itinerary.itinerary_days) {
      const acts = day.activities ?? [];
      for (let i = 0; i < acts.length - 1; i++) {
        const origin = acts[i];
        const dest = acts[i + 1];

        if (
          !origin?.latitude ||
          !origin?.longitude ||
          !dest?.latitude ||
          !dest?.longitude
        ) {
          map[origin.id] = "N/A";
          continue;
        }

        try {
          const res = await axios.post(
            "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
            {
              origins: [
                {
                  waypoint: {
                    location: {
                      latLng: {
                        latitude: origin.latitude,
                        longitude: origin.longitude,
                      },
                    },
                  },
                },
              ],
              destinations: [
                {
                  waypoint: {
                    location: {
                      latLng: {
                        latitude: dest.latitude,
                        longitude: dest.longitude,
                      },
                    },
                  },
                },
              ],
              travelMode: travelMode,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_KEY,
                "X-Goog-FieldMask":
                  "originIndex,destinationIndex,distanceMeters,duration",
              },
            }
          );

          let entry: any = null;
          if (Array.isArray(res.data) && res.data.length > 0) {
            entry = res.data[0];
          } else if (res.data?.rows?.[0]?.elements?.[0]) {
            // Some distance matrix shapes
            entry = res.data.rows[0].elements[0];
          } else if (res.data?.entries?.[0]) {
            entry = res.data.entries[0];
          } else if (res.data?.[0]?.distanceMeters || res.data?.[0]?.duration) {
            entry = res.data[0];
          } else {
            entry = null;
          }

          const seconds = parseDurationFromEntry(entry);
          if (seconds === null) {
            map[origin.id] = "N/A";
          } else {
            map[origin.id] = formatSeconds(seconds);
          }
        } catch (err: any) {
          console.error("Distance API error:", err.response?.data ?? err);
          map[origin.id] = "N/A";
        }
      }
    }

    setTravelTimesMap(map);
  };

  // get index in flattened activities (if you still need global index)
  const getGlobalIndex = (activityId: string) => {
    return activities.findIndex((a) => a.id === activityId);
  };

  // Export function
  const exportItinerary = () => {
    if (!itinerary || !itinerary.itinerary_days) return;

    let csv = "Day,Activity,Start Time,End Time,Location,Description\n";
    itinerary.itinerary_days.forEach((day: any) => {
      day.activities?.forEach((act: any) => {
        csv += `${day.day_number},${act.name},${act.start_time || ""},${
          act.end_time || ""
        },${act.location_address || ""},${act.description || ""}\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${itinerary.title || "itinerary"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load itinerary on mount / when id changes
  useEffect(() => {
    loadItinerary();
  }, [itinerary_id]);

  // Recompute travel times whenever itinerary or travelMode changes
  useEffect(() => {
    if (!itinerary) return;
    // compute travel times per day
    computeTravelTimesPerDay();
  }, [itinerary, travelMode]);

  // Update Map and View when Tab Changes
  useEffect(() => {
    if (!itinerary || !itinerary.itinerary_days) {
      setCoords([]);
      setMapLabels([]);
      return;
    }

    const day = itinerary.itinerary_days[activeDayIndex] ?? { activities: [] };
    const dayCoords = (day.activities ?? [])
      .filter((a: any) => a.latitude && a.longitude)
      .map((a: any) => ({ lat: a.latitude, lng: a.longitude }));

    const labels = (day.activities ?? []).map((_: any, i: number) => letter(i));

    setCoords(dayCoords);
    setMapLabels(labels);
  }, [activeDayIndex, itinerary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-grey-600">
        Loading itinerary . . .
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex items-center justify-center h-screen text-grey-600">
        Itinerary not found.
      </div>
    );
  }

  const currentDay = itinerary.itinerary_days[activeDayIndex] ?? {
    activities: [],
  };

  return (
    <div className="flex flex-row h-screen w-screen bg-white overflow-hidden">
      {/* Left panel: Trip Summary */}
      <div className="w-[30%] border-r border-gray-200 flex flex-col h-screen">
        {/* Header Area */}
        <div className="p-6 border-b border-gray-100 bg-white shadow-sm z-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {itinerary.title}
          </h1>

          <p className="text-grey-500 text-sm mb-6 font-semibold">
            {itinerary.destination} <br />
            {itinerary.start_date} → {itinerary.end_date}
          </p>

          {/* Print, Export, Home Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
            >
              Print
            </button>

            <button
              onClick={() => exportItinerary()}
              className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
            >
              Export
            </button>

            <button
              onClick={() => navigate("/")}
              className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
            >
              Home
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center justify-between bg-gray-50 p-1 rounded-lg border border-gray-200">
            {[
              {
                mode: "DRIVE",
                icon: <Car size={26} color="purple" />,
                label: "Drive",
              },
              {
                mode: "WALK",
                icon: <Footprints size={26} color="green" />,
                label: "Walk",
              },
              {
                mode: "BICYCLE",
                icon: <Bike size={26} color="red" />,
                label: "Bike",
              },
              {
                mode: "TRANSIT",
                icon: <Bus size={26} color="blue" />,
                label: "Transit",
              },
            ].map((item) => (
              <button
                key={item.mode}
                onClick={() => setTravelMode(item.mode as any)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-s font-semibold transition-all
                  ${
                    travelMode === item.mode
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 bg-gray-50">
          {currentDay &&
          currentDay.activities &&
          currentDay.activities.length > 0 ? (
            <div className="animate-fade-in">
              <div className="flex items-baseline justify-between mb-6 border-b pb-2 border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Day {currentDay.day_number}
                </h2>
                <span className="text-gray-400 font-medium text-sm">
                  {currentDay.date}
                </span>
              </div>

              <div className="space-y-8 relative border-l-2 border-blue-100 ml-3 pl-8 pb-4">
                {currentDay.activities.map((act: any, i: number) => {
                  // global index if needed
                  const globalIdx = getGlobalIndex(act.id);

                  // get per-day travel time (time from this activity to NEXT in same day)
                  const timeToNext = travelTimesMap[act.id];

                  return (
                    <div key={act.id} className="relative group">
                      {/* Marker Label (A, B, C...) */}
                      <span className="absolute -left-[45px] top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold shadow-md ring-4 ring-gray-50 transition-transform group-hover:scale-110">
                        {letter(i)}
                      </span>

                      <div>
                        {/* Title & Time */}
                        <div className="flex flex-col mb-1">
                          <h3 className="font-semibold text-gray-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                            {act.name}
                          </h3>
                          {act.start_time && (
                            <div className="flex items-center text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wide">
                              <Clock size={12} className="mr-1" />
                              {formatTime(act.start_time)}
                              {act.end_time && ` - ${formatTime(act.end_time)}`}
                            </div>
                          )}
                        </div>

                        {/* Address */}
                        {act.location_address && (
                          <div className="flex items-center text-gray-600 text-sm mt-2 gap-1">
                            <MapPin
                              size={16}
                              className="text-red-500 flex-shrink-0"
                            />
                            <span>
                              {act.location_address ||
                                reverseGeocode(act.latitude, act.longitude)}
                            </span>
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                          {act.description || "No description provided."}
                        </p>

                        {/* Travel Time to Next Stop */}
                        {typeof timeToNext !== "undefined" && (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
                            {timeToNext === "N/A" ? (
                              <span className="text-gray-400">
                                Time unavailable
                              </span>
                            ) : (
                              <>
                                <span>
                                  {travelMode === "DRIVE" && (
                                    <Car
                                      size={16}
                                      className="text-purple-500"
                                    />
                                  )}
                                  {travelMode === "WALK" && (
                                    <Footprints
                                      size={16}
                                      className="text-green-500"
                                    />
                                  )}
                                  {travelMode === "BICYCLE" && (
                                    <Bike size={16} className="text-red-500" />
                                  )}
                                  {travelMode === "TRANSIT" && (
                                    <Bus size={16} className="text-blue-500" />
                                  )}
                                </span>
                                <span>
                                  To next stop: <strong>{timeToNext}</strong>
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 italic">
              Select a day to view details.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Map */}
      <div className="flex-1 flex flex-col overflow-hidden ">
        {/* Day Tabs */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm z-10">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Select Day
          </h3>
          <div className="flex gap-3 no-scrollbar pb-1">
            {itinerary.itinerary_days.map((day: any, index: number) => (
              <button
                key={day.id}
                onClick={() => setActiveDayIndex(index)}
                className={`
                  px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap border
                  ${
                    activeDayIndex === index
                      ? "bg-gray-900 text-white border-gray-900 shadow-md transform scale-105"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                  }
                `}
              >
                Day {day.day_number}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative h-full">
          <MapView coords={coords} markerLabels={mapLabels} />
        </div>
      </div>
    </div>
  );
}
