// src/components/RoutePanel.tsx
import React, { useState, useRef, useEffect} from "react";
import axios from "axios";
import "../styles/routepanel.css";

const TimeDisplay: React.FC<{ timezoneId: string }> = ({ timezoneId }) => {
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        if (timezoneId && timezoneId !== 'Unknown') {
            const updateTime = () => {
              try {
                setCurrentTime(
                    new Date().toLocaleTimeString('en-US', {
                        timeZone: timezoneId,
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                );
              } catch (e) {
                setCurrentTime('Time format error');
              }
            };

            updateTime(); // Initial time set
            const timerId = setInterval(updateTime, 1000);

            return () => clearInterval(timerId);
        } else {
            setCurrentTime('Timezone Unknown');
        }
    }, [timezoneId]);

    return <span>{currentTime}</span>;
};

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
  
  originTimezone: string;
  destinationTimezone: string;
  setOriginTimezone: (timezone: string) => void;
  setDestinationTimezone: (timezone: string) => void;
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
  originTimezone,
  destinationTimezone,
  setOriginTimezone,
  setDestinationTimezone,
}) => {
  const [newDestination, setNewDestination] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state

  const originInputRef = useRef<HTMLInputElement>(null);
    const focusOrigin = () => {
      originInputRef.current?.focus();
    }
  const addDestination = () => {
    if (origin.trim() ==="") {
      alert("Please enter an origin. ");
      focusOrigin();
      return;
    }
    if (newDestination.trim() !== "") {
      setDestinations([...destinations, newDestination.trim()]);
      setNewDestination("");
    }
  };

  
  const handlePlanTrip = async () => {
    const trimmedOrigin = origin.trim();

    // 1. Validation: Origin and Destination checks
    if (!trimmedOrigin) {
        alert("Please enter an Origin (starting point).");
        focusOrigin();
        return;
    }
    if (destinations.length === 0) {
        return alert("Please add at least one Destination.");
    }

    setLoading(true);

    try {
        const waypoints = destinations.slice(0, -1).join("|");
        const finalDest = destinations[destinations.length - 1];

        // 2. Geocode all points
        let resolvedCoords: { lat: number; lng: number }[] = [];
        try {
            const allPoints = [trimmedOrigin, ...destinations];
            const coordsPromises = allPoints.map(async (addr) => {
                const geoRes = await axios.get("http://127.0.0.1:8000/geocode", {
                    params: { address: addr },
                });
                const loc = geoRes.data.results?.[0]?.geometry?.location;
                return loc ? { lat: loc.lat, lng: loc.lng } : null;
            });
            resolvedCoords = (await Promise.all(coordsPromises)).filter(Boolean) as { lat: number; lng: number }[];
            setCoords(resolvedCoords);
        } catch (err) {
            console.error("DEBUG: Geocoding failed.", err);
            throw new Error("Geocoding failed. Check backend /geocode endpoint.");
        }

        if (resolvedCoords.length < 2) {
            throw new Error("Could not resolve coordinates for both Origin and Final Destination.");
        }
        
        const originCoord = resolvedCoords[0]; 
        const finalCoord = resolvedCoords[resolvedCoords.length - 1]; 
        const { lat, lng } = finalCoord; 
        
        // 3. Get route data
        try {
            const res = await axios.get("http://127.0.0.1:8000/multi_route", {
                params: { origins: trimmedOrigin, waypoints, destination: finalDest },
            });
            const routeData = res.data.routes || [];
            setRouteLegs(routeData);
        } catch (err) {
            console.error("DEBUG: Routing failed.", err);
            throw new Error("Routing failed. Check backend /multi_route endpoint.");
        }

        // 4. Get nearby places
        let filteredPlaces: Place[] = [];
        try {
            const placesRes = await axios.get("http://127.0.0.1:8000/places", {
                params: { lat, lng, radius: 2000, budget },
            });

            filteredPlaces = (placesRes.data.places || []).map((p: any) => ({
                displayName: p.displayName?.text || "Unknown",
                types: p.types,
                rating: p.rating || 0,
                budget,
            }));
            setPlaces(filteredPlaces);
        } catch (err) {
            console.error("DEBUG: Places failed.", err);
            throw new Error("Places API failed. Check backend /places endpoint.");
        }


        // 5. Fetch Timezones (Resilient Block)
        let destinationTimezoneId = 'Unknown';
        try {
            // Origin Timezone
            const originTimezoneRes = await axios.get("http://127.0.0.1:8000/timezone", {
                params: { lat: originCoord.lat, lng: originCoord.lng },
            });
            const originTimezoneId = originTimezoneRes.data.timeZoneId || 'Unknown';
            setOriginTimezone(originTimezoneId);

            // Destination Timezone
            const destinationTimezoneRes = await axios.get("http://127.0.0.1:8000/timezone", {
                params: { lat: finalCoord.lat, lng: finalCoord.lng },
            });
            destinationTimezoneId = destinationTimezoneRes.data.timeZoneId || 'Unknown';
            setDestinationTimezone(destinationTimezoneId);
            
        } catch (error) {
            console.warn("WARN: Timezone API call failed. Time display will be 'Unknown'.", error);
            setOriginTimezone('Unknown');
            setDestinationTimezone('Unknown');
          }

    

    } catch (err) {
        // This catch block will now show a more descriptive message.
        console.error("FATAL ERROR PLANNING TRIP:", err);
        const errorMessage = (err as Error).message || "An unknown error occurred.";
        alert(`Error planning trip: ${errorMessage}`);
    } finally {
        setLoading(false);
    }
};
  return (
    <div className="route-panel">
      <strong>Itinera Planner</strong>
      
      <div className="form-group">
        <br></br>
        <h4> Origin: </h4>
        <input
            id="origin-input"
            ref={originInputRef}
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Enter starting point"
          />
          {originTimezone && originTimezone !== 'Unknown' && (<small>Local Time: <TimeDisplay timezoneId={originTimezone} /></small>
        )}
       </div>
      <br></br>
      <div className="form-group">
        <label htmlFor="destination-input">Add Destination:</label>
        <div className="add-destination">
          <input
            id="destination-input"
            value={newDestination}
            onChange={(e) => setNewDestination(e.target.value)}
            placeholder="Enter destination"
          />
          <button onClick={addDestination} disabled={loading}>Add</button>
        </div>
        <br></br>
      </div>

      {destinations.length > 0 && (
        <div className="destinations-list">
          <h4>Destinations:</h4>
          {destinations.map((d: string, i: number) => (
            <p key={i}>
              {d}
              {i === destinations.length - 1 && destinationTimezone && 
              destinationTimezone !== 'Unknown' && (<small> (Local Time: 
                <TimeDisplay timezoneId={destinationTimezone} />)</small>
              )}
            </p>
        ))}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="budget-select">Budget Preference:</label>
        <select
          id="budget-select"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          disabled={loading} // Disable during loading
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button 
            className="plan-btn" 
            onClick={handlePlanTrip}
            disabled={loading || !origin || destinations.length === 0} // Disable button while loading
        >
        {loading ? 'Planning...' : 'Plan Trip'}
      </button>
    </div>
  );
};

export default RoutePanel;