// src/components/PlaceSidebar.tsx
import React from "react";
import "../styles/sidebar.css";

interface Place {
  displayName?: string;
  types?: string[];
  rating?: string | number;
  budget?: string;
}

interface Leg {
  distanceMeters?: number;
  duration?: string;
}

interface Route {
  legs?: Leg[];
}

interface PlaceSidebarProps {
  origin: string;
  destinations: string;
  routes: Route[];
  places: Place[];
}

const PlaceSidebar: React.FC<PlaceSidebarProps> = ({
  origin,
  destinations,
  routes,
  places,
}) => {
  const finalDest = destinations[destinations.length - 1] || "";

  return (
    <div className="sidebar">
      <h3>Trip Summary</h3>

      <p>
        <strong>From:</strong> {origin || "N/A"}
      </p>
      <p>
        <strong>To:</strong> {finalDest || "N/A"}
      </p>

      {routes.length > 0 && (
        <div>
          <h4>Route Details:</h4>
          {routes.map((route, i) => (
            <div key={i}>
              {route.legs?.map((leg, idx) => (
                <p key={idx}>
                  Leg {idx + 1}: {(leg.distanceMeters || 0) / 1000} km,{" "}
                  {leg.duration || "N/A"}
                </p>
              )) || <p>No legs available</p>}
            </div>
          ))}
        </div>
      )}

      {places.length > 0 && (
        <div>
          <h4>Nearby Attractions:</h4>
          <ul>
            {places.map((p, i) => (
              <li key={i}>
                {p.displayName || "Unnamed Place"} —{" "}
                {p.types?.join(", ") || "Unknown"} — Rating: {p.rating ?? "N/A"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlaceSidebar;
