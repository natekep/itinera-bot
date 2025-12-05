import React, { useState, useEffect } from "react";
import axios from "axios";
import MapView from "../components/MapView";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Bookings() {
  const { itinerary_id } = useParams();
  const [ loading, setLoading ] = useState(true);
  const [ itinerary, setItinerary] = useState<any>(null);
  const [ activities, setActivities ] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [travelTimes, setTravelTimes] = useState<string[]>([]);

  const GOOGLE_KEY = import.meta.env.VITE_MAP_CLIENT_KEY;

  // Load itinerary from Supabase
  const loadItinerary = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("itineraries")
      .select(`
        id,
        title,
        destination,
        start_date,
        end_date,
        num_guests,
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
      `)
      .eq("id", itinerary_id)
      .single();

    if (error) {
      console.error("Error loading itinerary: ", error);
      setLoading(false);
      return;
    }
    setItinerary(data);

    const flatActivities = data.itinerary_days.flatMap((day: any) => day.activities);
    setActivities(flatActivities);
    //setLoading(false);
  //};

    // Extract lat/lng
    const points = flatActivities
      .filter((a: any) => a.latitude && a.longitude)
      .map((a: any) => ({
      lat: a.latitude,
      lng: a.longitude,
      }));

    setCoords(points);
    setLoading(false);
  };

  // Getting coordinates from google place id
  /*const getCoordsFromPlaceId = async (placeId: string) => {
    try {
      const res = await axios.get(
        "https://maps.googleapis.com/maps/api/place/details/json",
        {
          params: {
            place_id: placeId,
            key: GOOGLE_KEY,
            fields: "geometry",
          },
        }
      );

      return res.data.result?.geometry?.location || null;
    } catch (err: any) {
      console.error("Place Details Error:", err.response?.data || err);
      return null;
    }
  };

  // load coordinates
  const loadCoordinates = async () => {
    const results: { lat: number; lng: number }[] = [];

    for (const a of activities) {
      if (!a.place_id) continue;

      const loc = await getCoordsFromPlaceId(a.place_id);
      if (loc) results.push({ lat: loc.lat, lng: loc.lng });
    }
    setCoords(results);
  };
*/

  // google route matrix api
  // google route matrix api — now returning DISTANCE instead of TRAVEL TIME
  const getTravelTimes = async () => {
    if (activities.length < 2) return;

    const distances: string[] = [];

    for (let i = 0; i < activities.length - 1; i++) {
      const origin = activities[i];
      const dest = activities[i + 1];

      if (!origin.latitude || !dest.latitude) {
        distances.push("N/A");
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
            travelMode: "DRIVE",
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_KEY,
              "X-Goog-FieldMask":
                "originIndex,destinationIndex,distanceMeters",
            },
          }
        );

        const entry = res.data[0];
        let text = "N/A";

        if (entry?.distanceMeters !== undefined) {
          const km = entry.distanceMeters / 1000;
          text = `${km.toFixed(1)} km`;
        }

        distances.push(text);
      } catch (err: any) {
        console.error("Distance API error:", err.response?.data || err);
        distances.push("N/A");
      }
    }

    setTravelTimes(distances);
  };


  // GeoCode func
  /*
  const geocodeActivities = async () => {
    if (!activities.length) return;
    const results: { lat: number, lng: number } [] = [];

    for( let act of activities) {
      if ( !act.location_name) continue;
      try {
        const geo = await axios.get(`${BACKEND_URL}/geocode`, {
        params: { address: act.location_name },
        });

        const loc = geo.data.results?.[0]?.geometry?.location ?? null;
        if ( loc ) {
          results.push({ lat: loc.lat, lng: loc.lng });
          }
      } catch (err) {
        console.error("Geocode error: ", err);
      }
    }

    setCoords(results);
  };
*/
  useEffect(() => {
    loadItinerary();
  }, [itinerary_id]);

  /*useEffect(() => {
    // geocodeActivities();
    if ( activities.length) loadCoordinates();
  }, [activities]);
*/
  useEffect(() => {
    if ( activities.length > 1) getTravelTimes();
  }, [ activities]);


  const letter = (i: number) => {
    let s = "";
    while (i >= 0) {
      s = String.fromCharCode((i % 26) + 65) + s;
      i = Math.floor(i / 26) - 1;
    }
    return s;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-grey-600">
        Loading itinerary . . .
      </div>
    );
  } 

  if( !itinerary ) {
    return (
    <div className="flex items-center justify-center h-screen text-grey-600">
        Itinerary not found.
      </div>
    );
  }

  const flat = itinerary.itinerary_days.flatMap((d: any) => d.activities);

  const indexMap = new Map();
  flat.forEach((a: any, i: number) => indexMap.set(a.id, i));

  return (
    <div className="flex flex-row min-h-screen bg-gray-50">
      {/* Left panel: Trip Summary */}
      <div className="w-[30%] bg-white border-r border-gray-300 p-6 overflow-y-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          {itinerary.title}
        </h1>

        <p className="text-grey-600 text-sm mb-6">
          {itinerary.destination} <br />
          {itinerary.start_date} → {itinerary.end_date}
        </p>

        {itinerary.itinerary_days.map((day: any) => (
          <div key={day.id} className="mb=6">
            <h2 className="font-semibold text-grey-800">
              Day {day.day_number} - {day.date}
            </h2>
            <ul className="mt-2 ml-2 space-y-2">
              {day.activities.map((act: any) => {
                const idx = indexMap.get(act.id);
                return (
                  <li key={act.id} className="flex gap-2 text-sm">
                    <span className="font-bold text-blue-600">
                      {letter(idx)}.
                    </span>
                    <div>
                      <strong>{act.name}</strong>
                      <p className="text-gray-500">{act.description?.slice(0, 60)}...</p>

                      {idx < travelTimes.length && (
                        <p className="text-xs text-gray-500 mt-1">
                          Distance to next stop:{" "}
                          <strong>{travelTimes[idx]}</strong>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Right Panel: Map */}
      <div className="flex-1 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Map</h2>
        <div className="w-full h-[40vh] rounded-lg overflow-hidden shadow">
            <MapView coords={coords} 
              markerLabels={flat.map((_, i) => letter(i))}
            /> 
            {/* or: <MapView coords={coords} places={[]} /> */}
        </div>
      </div>
    </div>
  );
}
