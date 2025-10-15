<<<<<<< HEAD
// src/components/RoutePanel.tsx
import React, { useState } from "react";
import axios from "axios";

interface Place {
  displayName?: string;
  types?: string[];
  rating?: string | number;
  budget?: string;
}

interface RoutePanelProps {
  origin: string;
  setOrigin: (value: string) => void;
  destinations: string[];
  setDestinations: (value: string[]) => void;
  setPlaces: (places: Place[]) => void;
  setRouteLegs: (legs: any[]) => void;
  budget: string;
  setBudget: (value: string) => void;
  setCoords: (coords: { lat: number; lng: number }[]) => void;
=======
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { type RoutesByMode } from "../pages/Iram";

export const TimeDisplay: React.FC<{ tz: string }> = ({ tz }) => {
  const [time, setTime] = useState("");
  useEffect(() => {
    if (!tz || tz === "Unknown") return setTime("Unknown");
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tz]);
  return <span className="text-gray-600">{time}</span>;
};

interface RoutePanelProps {
  origin: string;
  setOrigin: (v: string) => void;
  destinations: string[];
  setDestinations: (v: string[]) => void;
  setPlaces: (p: any[]) => void;
  setRouteLegs: (l: any[]) => void;
  budget: string;
  setBudget: (v: string) => void;
  setCoords: (c: { lat: number; lng: number }[]) => void;
  originTimezone: string;
  setOriginTimezone: (tz: string) => void;
  destinationTimezones: string[];
  setDestinationTimezones: (tz: string[]) => void;
  setRoutesByMode: (r: RoutesByMode) => void;
>>>>>>> main
}

const RoutePanel: React.FC<RoutePanelProps> = ({
  origin,
  setOrigin,
  destinations,
  setDestinations,
  setPlaces,
  setRouteLegs,
  budget,
  setBudget,
  setCoords,
<<<<<<< HEAD
}) => {
  const [newDestination, setNewDestination] = useState("");

  const addDestination = () => {
    if (newDestination.trim() !== "") {
      setDestinations([...destinations, newDestination.trim()]);
      setNewDestination("");
    }
  };

  const handlePlanTrip = async () => {
    if (!origin || destinations.length === 0) {
      return alert("Add an origin and at least one destination");
    }

    try {
      const waypoints = destinations.slice(0, -1).join("|");
      const finalDest = destinations[destinations.length - 1];

      // 1️⃣ Get route
      const res = await axios.get("http://127.0.0.1:8000/multi_route", {
        params: { origins: origin, waypoints, destination: finalDest },
      });

      const routeData = res.data.routes || [];
      setRouteLegs(routeData);

      // 2️⃣ Resolve coordinates for all points (origin + destinations)
      const allPoints = [origin, ...destinations];
      const coordsPromises = allPoints.map(async (addr) => {
        const geoRes = await axios.get("http://127.0.0.1:8000/geocode", {
          params: { address: addr },
        });
        const loc = geoRes.data.results?.[0]?.geometry?.location;
        return loc ? { lat: loc.lat, lng: loc.lng } : null;
      });

      const resolvedCoords = (await Promise.all(coordsPromises)).filter(
        Boolean
      ) as { lat: number; lng: number }[];
      setCoords(resolvedCoords);

      // 3️⃣ Get nearby places near final destination
      const geoResFinal = await axios.get("http://127.0.0.1:8000/geocode", {
        params: { address: finalDest },
      });
      const { lat, lng } = geoResFinal.data.results[0].geometry.location;

      const placesRes = await axios.get("http://127.0.0.1:8000/places", {
        params: { lat, lng, radius: 2000 },
      });

      const filtered: Place[] = (placesRes.data.places || []).map((p: any) => ({
        displayName: p.displayName?.text || "Unknown",
        types: p.types,
        rating: p.rating || "N/A",
        budget,
      }));

      setPlaces(filtered);
    } catch (err) {
      console.error(err);
      alert("Error planning trip");
=======
  originTimezone,
  setOriginTimezone,
  destinationTimezones,
  setDestinationTimezones,
  setRoutesByMode,
}) => {
  const [newDest, setNewDest] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusOrigin = () => inputRef.current?.focus();

  const addDestination = () => {
    if (!origin.trim()) return alert("Please enter an origin first."), focusOrigin();
    if (newDest.trim()) {
      setDestinations([...destinations, newDest.trim()]);
      setNewDest("");
    }
  };

  const fetchData = async (url: string, params = {}) =>
    (await axios.get(url, { params })).data;

  const handlePlanTrip = async () => {
    if (!origin.trim()) return alert("Enter an origin"), focusOrigin();
    if (!destinations.length) return alert("Add at least one destination");
    setLoading(true);
    setRoutesByMode({});

    try {
      const all = [origin, ...destinations];
      const coords = (
        await Promise.all(
          all.map(async (a) => {
            const res = await fetchData("http://127.0.0.1:8000/geocode", { address: a });
            return res.results?.[0]?.geometry?.location || null;
          })
        )
      ).filter(Boolean);

      setCoords(coords);
      const [orig, ...destCoords] = coords;
      
      const modesToFetch = ['DRIVE', 'TRANSIT', 'BICYCLE', 'WALK'];
      const routesData: RoutesByMode = {};

      for (const mode of modesToFetch) {
        try {
          
          const routeResult = await fetchData("http://127.0.0.1:8000/multi_route", {
            origins: origin,
            waypoints: destinations.slice(0, -1).join("|"),
            destination: destinations[destinations.length - 1],
            travelMode: mode,
          });

          if (routeResult.routes && routeResult.routes.length > 0) {
            routesData[mode] = routeResult.routes[0];
          }
        } catch (error) {
          
          console.warn(`Could not fetch route for mode ${mode}: `, error);
        }
      }

      setRoutesByMode(routesData);

      const primaryRoute = routesData['DRIVE'] ? [routesData['DRIVE']] : [];
      setRouteLegs(primaryRoute);

      // Nearby attractions for last destination
      const lastDest = destCoords[destCoords.length - 1];

      // Check if lastDest exists before trying to use it
      if (lastDest) {
        const placesRes = await fetchData("http://127.0.0.1:8000/places", {
          lat: lastDest.lat,
          lng: lastDest.lng,
          radius: 2000,
          budget,
        });
        setPlaces(
          (placesRes.places || []).map((p: any) => ({
            displayName: p.displayName?.text || "Unknown",
            rating: p.rating || 0,
            budget,
          }))
        );
      } else {
        setPlaces([]); 
      }

      const allTz = await Promise.all(
        coords.map(async (c) => {
          const res = await fetchData("http://127.0.0.1:8000/timezone", {
            lat: c.lat,
            lng: c.lng,
          });
          return res.timeZoneId || "Unknown";
        })
      );

      setOriginTimezone(allTz[0]);
      setDestinationTimezones(allTz.slice(1));
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
>>>>>>> main
    }
  };

  return (
<<<<<<< HEAD
    <div className="route-panel">
      <h2>Itinera Planner</h2>

      <label htmlFor="origin-input">Origin:</label>
      <input
        id="origin-input"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        placeholder="Enter starting point"
      />

      <label htmlFor="destination-input">Add Destination:</label>
      <div className="add-destination">
        <input
          id="destination-input"
          value={newDestination}
          onChange={(e) => setNewDestination(e.target.value)}
          placeholder="Enter destination"
        />
        <button onClick={addDestination}>Add</button>
      </div>

      {destinations.length > 0 && (
        <div className="destinations-list">
          <h4>Destinations:</h4>
          {destinations.map((d: string, i: number) => (
            <p key={i}>{d}</p>
=======
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md mx-auto border border-gray-100">
      <h2 className="text-2xl font-bold text-blue-400 mb-5">Itinera Planner</h2>

      {/* Origin */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium">Origin</label>
        <input
          ref={inputRef}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Enter starting point"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
        />
        {originTimezone !== "Unknown" && (
          <p className="text-sm text-gray-500 mt-1">
            Local Time: <TimeDisplay tz={originTimezone} />
          </p>
        )}
      </div>

      {/* Destinations */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium">Add Destination</label>
        <div className="flex gap-2">
          <input
            value={newDest}
            onChange={(e) => setNewDest(e.target.value)}
            placeholder="Enter destination"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={addDestination}
            disabled={loading}
            className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-300 disabled:bg-gray-400"
          >
            Add
          </button>
        </div>
      </div>

      {!!destinations.length && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700">Destinations:</h4>
          {destinations.map((d, i) => (
            <p key={i} className="text-gray-600">
              {d}{" "}
              {destinationTimezones[i] && destinationTimezones[i] !== "Unknown" && (
                <small className="ml-2 text-gray-500">
                  (Local: <TimeDisplay tz={destinationTimezones[i]} />)
                </small>
              )}
            </p>
>>>>>>> main
          ))}
        </div>
      )}

<<<<<<< HEAD
      <label htmlFor="budget-select">Budget Preference:</label>
      <select
        id="budget-select"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <button className="plan-btn" onClick={handlePlanTrip}>
        Plan Trip
=======
      {/* Budget */}
      <div className="mb-5">
        <label className="block text-gray-700 font-medium">Budget Preference</label>
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Plan Trip Button */}
      <button
        onClick={handlePlanTrip}
        disabled={loading || !origin || !destinations.length}
        className={`w-full py-2 font-semibold text-white rounded-lg transition ${
          loading || !origin || !destinations.length
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Planning..." : "Plan Trip"}
>>>>>>> main
      </button>
    </div>
  );
};

<<<<<<< HEAD
export default RoutePanel;
=======
export default RoutePanel;
>>>>>>> main
