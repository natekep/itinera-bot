import React, { useState } from "react";
import MapView from "../components/MapView";
import PlaceSidebar from "../components/PlaceSidebar";
import RoutePanel from "../components/RoutePanel";

export interface RoutesByMode{
  [key: string]: any; 
}

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

  return (
    <div className="flex h-screen w-full">
      {/* LEFT SIDE: Route panel + Sidebar */}
      <div className="flex flex-col w-[28%] bg-gray-50 border-r border-gray-300 overflow-hidden">
        {/* Route panel on top */}
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
          />
        </div>

        {/* Sidebar on bottom */}
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
        <MapView coords={coords} />
      </div>
    </div>
  );
};

export default Iram;
