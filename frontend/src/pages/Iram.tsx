import React, { useState, useEffect } from "react";
import MapView from "../components/MapView";
import PlaceSidebar from "../components/PlaceSidebar";
import RoutePanel from "../components/RoutePanel";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

export interface RoutesByMode {
  [key: string]: any;
}

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const Iram: React.FC = () => {
  const [origin, setOrigin] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [budget, setBudget] = useState("medium");
  const [originTimezone, setOriginTimezone] = useState<string>("");
  const [destinationTimezones, setDestinationTimezones] = useState<string[]>([]);
  const [routesByMode, setRoutesByMode] = useState<RoutesByMode>({});
  const [preferences, setPreferences] = useState<any>({
    categories: ["restaurant", "museum", "park"],
    dietaryRestrictions: ["vegan"],
  });

  // 🧭 Load onboarding preferences from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData?.user) return;

        // Preferences
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", userData.user.id)
          .single();

        if (prefs) {
          setPreferences({
            categories: prefs.categories || ["restaurant"],
            dietaryRestrictions: prefs.dietaryRestrictions || [],
          });
          setBudget(prefs.budget || "medium");
        }

        // Trip info
        const { data: trip } = await supabase
          .from("user_trips")
          .select("*")
          .eq("user_id", userData.user.id)
          .single();

        if (trip) {
          setOrigin(trip.origin || "");
          setDestinations(trip.destinations || []);
        }
      } catch (err) {
        console.warn("Supabase fetch error:", err);
      }
    };

    fetchUserData();
  }, []);

  // 🌍 Fetch nearby places
  const fetchPlaces = async () => {
    console.log("Fetching nearby places for", destinations[0]);
    if (!destinations.length) return;

    try {
      const resp = await axios.post("http://127.0.0.1:8000/api/places/search", {
        origin,
        destinations,
        categories: preferences.categories,
        dietaryRestrictions: preferences.dietaryRestrictions,
        budget,
      });

      console.log("Fetched places:", resp.data);
      const fetchedPlaces = resp.data.places || [];
      setPlaces(fetchedPlaces);

      const placeCoords = fetchedPlaces.map((p: any) => ({
        lat: p.location?.latitude ?? p.location?.lat,
        lng: p.location?.longitude ?? p.location?.lng,
      }));

      setCoords((prev) => [...prev, ...placeCoords]);
    } catch (err: any) {
      console.error("Failed to fetch places:", err.response?.data || err.message);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* LEFT SIDE: Route panel + Sidebar */}
      <div className="flex flex-col w-[28%] bg-gray-50 border-r border-gray-300 overflow-hidden">
        <div className="flex-grow overflow-y-auto p-4 border-b border-gray-300">
          <RoutePanel
            origin={origin}
            setOrigin={setOrigin}
            destinations={destinations}
            setDestinations={setDestinations}
            setPlaces={setPlaces}
            setRouteLegs={setRoutes}
            setCoords={setCoords}
            budget={budget}
            setBudget={setBudget}
            originTimezone={originTimezone}
            setOriginTimezone={setOriginTimezone}
            destinationTimezones={destinationTimezones}
            setDestinationTimezones={setDestinationTimezones}
            setRoutesByMode={setRoutesByMode}
            onTripPlanned={fetchPlaces}
          />
        </div>

        {/* Sidebar */}
        <div className="h-[35%] overflow-y-auto p-3 bg-white">
          <PlaceSidebar
            origin={origin}
            destinations={destinations}
            routes={routes}
            places={places}
            destinationTimezones={destinationTimezones}
            routesByMode={routesByMode}
          />
        </div>
      </div>

      {/* RIGHT SIDE: Map */}
      <div className="flex-1">
        <MapView coords={coords} places={places} />
      </div>
    </div>
  );
};

export default Iram;
