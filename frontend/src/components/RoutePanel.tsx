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
    }
  };

  return (
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
          ))}
        </div>
      )}

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
      </button>
    </div>
  );
};

export default RoutePanel;
