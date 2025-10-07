// src/pages/Maps.tsx
import React, { useState } from "react";
import MapView from "../components/MapView";
import PlaceSidebar from "../components/PlaceSidebar";
import RoutePanel from "../components/RoutePanel";
import "../styles/mapview.css";
import "../styles/sidebar.css";
import "../styles/maps.css";

const Maps: React.FC = () => {
  const [origin, setOrigin] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [budget, setBudget] = useState("medium");

  return (
    <div className="maps-container">
      {/* Left panel: route form and sidebar */}
      <div className="maps-left">
        <RoutePanel
          origin={origin}
          setOrigin={setOrigin}
          destinations={destinations}
          setDestinations={setDestinations}
          setPlaces={setPlaces}
          setRouteLegs={setRoutes}
          setCoords={setCoords}   {/* 🔹 pass setCoords here */}
          budget={budget}
          setBudget={setBudget}
        />

        <PlaceSidebar
          origin={origin}
          destination={destinations[destinations.length - 1] || ""}  {/* 🔹 pass last destination */}
          routes={routes}
          places={places}
        />
      </div>

      {/* Right panel: map */}
      <div className="maps-right">
        <MapView coords={coords} />
      </div>
    </div>
  );
};

export default Maps;
