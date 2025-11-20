import React, { useState } from "react";
import axios from "axios"
import MapView from "../components/MapView";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Bookings() {
  const [departure, setDeparture] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [activites, setActivites] = useState<string[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [nearestAirport, setNearestAirport] = useState<any | null>(null);

  // GeoCode func
  const handleSearch = async () => {
    if (!departure) return;
    try {
      const geo = await axios.get(`${BACKEND_URL}/geocode`, {
        params: { address: departure }
      });

      const loc = geo.data?.results?.[0]?.geometry?.location;
      if (!loc) return alert("Could not geocode city.");

      setCoords([{ lat: loc.lat, lng: loc.lng }]);

      const hotelRes = await axios.get(`${BACKEND_URL}/places/hotels`, {
        params: { lat: loc.lat, lng: loc.lng }
      });
      const formattedHotels =
        hotelRes.data.places?.map((h: any) => ({
          name: h.displayName?.text || "Hotel",
          address: h.formattedAddress || "",
          rating: h.rating || "N/A",
          location: {
            latitude: h.location?.latitude || null,
            longitude: h.location?.longitude || null
           },
          price: Math.floor(Math.random() * 200) + 80, // Fake price for UI
        })) || [];

      setHotels(formattedHotels);

      const airportRes = await axios.get(`${BACKEND_URL}/places/airports`, {
        params: { lat: loc.lat, lng: loc.lng }
      });
      setNearestAirport(airportRes.data.places?.[0] || null);

      const airport = airportRes.data.places?.[0];
      setNearestAirport(airport);

      const flightRes = await axios.get(`${BACKEND_URL}/flights/search`, {
        params: {
          origin_lat: loc.lat,
          origin_lng: loc.lng,
          dest_lat: loc.lat,  
          dest_lng: loc.lng
        }
      });

      setFlights([flightRes.data]);

    } catch (err) {
      console.error(err);
    }
  };



  return (
    <div className="flex flex-row min-h-screen bg-gray-50">

      {/* Left panel: Booking options */}
      <div className="w-[30%] bg-white border-r border-gray-300 p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Booking Options 
        </h1>

        {/* Depart Loc*/}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium">
            Departure Location
          </label>
          <input type="text" value={departure} onChange={(e) => setDeparture(e.target.value)} 
              placeholder="Enter City" className="w-full mt-1 p-2 border rounded-lg focus:ring 
              focus:ring-blue-200" />
        </div>



        {/* Search button */}
        <button onClick={handleSearch} className="mt-4 w-full bg-blue-600 text-white p-3 
          rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"  disabled={!departure}>
            Search Options
        </button>
      </div>

      {/* Right Panel: Map+flights+hotels */}
      <div className="flex-1 p-6 space-y-6">
        {/* Map sect */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Map
          </h2>
          <div className="w-full h-[40vh] rounded-lg overflow-hidden shadow">
            <MapView coords={coords} places={hotels} />
          </div>
        </div>

      {/* Flight + hotels */}
      <div className="grid grid-cols-3 gap-6">
        {/* Flights */}
        <div className="bg-white rounded-lg p-4 shadow h-[45vh] overflow-auto col-span-1">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            Available Flights
          </h3>
          {flights.length === 0 ? ( 
            <p className="text-gray-500">
              Flight results: 
            </p>
          ):( flights.map((f,i) => (
            <div key={i} className="p-2 border-b">
              <strong>{f.name || "Flight Option"}</strong> - ${f.price}
            </div>
            ))
          )}
        </div>
        {/* hotels */}
        <div className="bg-white rounded-l p-4 shadow h-[45vh] overflow-auto col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Nearby Hotels:
          </h3>
          {hotels.length === 0 ? (
            <p className="text-gray-500"> 
              Hotel results:
            </p>
          ) : (
            <div className="space-y-4">
              {hotels.map((h, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-4 items-center border-b pb-3"
                >
                  {/* Column 1: Hotel name + address */}
                  <div>
                    <div className="font-semibold text-gray-900">{h.name}</div>
                    <div className="text-gray-600 text-sm">{h.address}</div>
                  </div>
                  {/* Column 2: Price */}
                  <div className="text-blue-700 font-semibold text-sm">
                    ${h.price}/night
                  </div>
                  {/* Column 3: Rating */}
                  <div className="text-yellow-700 font-medium text-sm">
                    ⭐ {h.rating}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
    
   
