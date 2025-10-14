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
  destinations: string; // This is the single final destination address string
  routes: Route[];
  places: Place[];

}

const PlaceSidebar: React.FC<PlaceSidebarProps> = ({
  origin,
  destinations,
  routes,
  places,
}) => {
  const finalDest = destinations || "N/A"; 

  return (
    <div className="sidebar">
      {/* *********************** */}
      {/* SECTION 1: ROUTE & ATTRIBUTE SUMMARY */}
      {/* *********************** */}
      <div className="summary-section">
        <h3>Trip Summary</h3>

         <p className="summary-detail">
           <strong>From:</strong> {origin || "N/A"}
         </p>
         <p className="summary-detail">
           <strong>To:</strong> {finalDest} 
          </p>

          {routes.length > 0 && routes[0]?.legs && (
            <div className="route-details">
              <h4>Route Legs:</h4>
              {routes[0].legs.map((leg, idx) => (
                <div key={idx} className="route-leg">
                  <p>
                    <strong>Leg {idx + 1}:</strong> {(leg.distanceMeters || 0) / 1000} km, {leg.duration || "N/A"}
                  </p>
            </div>
            ))}
         </div>
        )}
        

      {places.length > 0 && (
        <div className="attractions-list">
          <h4>Nearby Attractions:</h4>
          <ul>
            {places.slice(0, 5).map((p, i) => (
              <li key={i}>
                <strong>{p.displayName || "Unnamed Place"}</strong> ({p.rating ?? "N/A"} ★) 
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  

    
    </div>
  );
};

export default PlaceSidebar;