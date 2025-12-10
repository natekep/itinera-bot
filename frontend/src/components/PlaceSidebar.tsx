import React from "react";

type RoutesByMode = {
  [mode: string]: any;
};

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
  destinations: string[];
  routes: Route[];
  places: Place[];
  destinationTimezones?: string[];
  routesByMode: RoutesByMode;
}

const formatDuration = (durationString: string): string => {
  if (!durationString) return "N/A";
  const totalSec = parseInt(durationString.replace("s", ""), 10);
  if (isNaN(totalSec)) return "N/A";

  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);

  let result = "";
  if (hrs > 0) result += `${hrs} hr`;
  if (min > 0) result += `${min} min`;

  return result.trim() || "0 min";
};

const PlaceSidebar: React.FC<PlaceSidebarProps> = ({
  origin,
  destinations,
  routes,
  places,
  routesByMode,
}) => {
  return (
    <div className="bg-gray-50 p-5 rounded-lg shadow-md border border-gray-200 h-full overflow-y-auto font-inter">
      <div className="mb-4">
        <h3 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3 text-gray-800">
          Trip Summary
        </h3>

        <p className="text-bg text-gray-700 mb-3">
          <strong>Route:</strong> {origin} → {destinations.join(" → ")}
        </p>

        {Object.keys(routesByMode).length > 0 && (
          <div className="mt-4 mb-4">
            <h4 className="text-md font-semibold text-gray-700 mb-2">
              Travel Options (Total):
            </h4>
            <div className="space-y-2">
              {Object.entries(routesByMode).map(([mode, routeData]) => {
                if (!routeData || !routeData.legs) return null;

                const totalDistanceMeters = routeData.legs.reduce(
                  (sum: number, leg: any) => sum + (leg.distanceMeters || 0),
                  0
                );
                const totalDuration = routeData.duration;

                return (
                  <div
                    key={mode}
                    className="text-sm text-grey-600 bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm"
                  >
                    <strong className="capitalize">
                      {mode.toLowerCase()}:
                    </strong>
                    <span className="ml-2 font-medium">
                      {formatDuration(totalDuration)}
                    </span>
                    <span className="text-gray-500">
                      {" "}
                      ({(totalDistanceMeters / 1000).toFixed(1)} km)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Route Legs */}
        {routes.length > 0 && routes[0]?.legs && (
          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-700 mb-2">
              Route Legs:
            </h4>
            {routes[0].legs.map((leg, idx) => (
              <div
                key={idx}
                className="text-sm text-gray-600 bg-white border border-gray-200 rounded-md px-3 py-2 mb-2 shadow-sm"
              >
                <strong>Leg {idx + 1}:</strong>{" "}
                {(leg.distanceMeters || 0) / 1000} km, {leg.duration || "N/A"}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nearby Attractions */}
      {places.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-3">
            Nearby Attractions
          </h4>
          <ul className="space-y-2">
            {places.slice(0, 5).map((p, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm"
              >
                <strong>{p.displayName || "Unnamed Place"}</strong> (
                {p.rating ?? "N/A"} ★)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlaceSidebar;
