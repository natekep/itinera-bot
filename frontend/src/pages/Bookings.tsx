import React, { useState } from "react";
import axios from "axios";
import MapView from "../components/MapView";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Bookings() {
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [departureDate, setDepartureDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");

  // GeoCode func
  const handleSearch = async () => {
    if (!departure || !destination) return;
    try {
      const geo = await axios.get(`${BACKEND_URL}/geocode`, {
        params: { address: departure },
      });

      const departureLoc = geo.data?.results?.[0]?.geometry?.location;
      if (!departureLoc) return alert("Could not geocode departure city.");

      const geo2 = await axios.get(`${BACKEND_URL}/geocode`, {
        params: { address: destination },
      });

      const destinationLoc = geo2.data?.results?.[0]?.geometry?.location;
      if (!destinationLoc) return alert("Could not geocode destination city.");

      setCoords([
        { lat: departureLoc.lat, lng: departureLoc.lng },
        { lat: destinationLoc.lat, lng: destinationLoc.lng },
      ]);

      const hotelRes = await axios.get(`${BACKEND_URL}/places/hotels`, {
        params: { lat: destinationLoc.lat, lng: destinationLoc.lng },
      });

      const formattedHotels =
        hotelRes.data.places?.map((h: any) => ({
          name: h.displayName?.text || "Hotel",
          address: h.formattedAddress || "",
          rating: h.rating || "N/A",
          location: {
            latitude: h.location?.latitude || null,
            longitude: h.location?.longitude || null,
          },
          price: Math.floor(Math.random() * 200) + 80,
        })) || [];

      setHotels(formattedHotels);

      const departureAirportRes = await axios.get(
        `${BACKEND_URL}/places/airports`,
        {
          params: { lat: departureLoc.lat, lng: departureLoc.lng },
        }
      );
      const departureAirport = departureAirportRes.data.data[0].iata_code;

      const destinationAirportRes = await axios.get(
        `${BACKEND_URL}/places/airports`,
        {
          params: { lat: destinationLoc.lat, lng: destinationLoc.lng },
        }
      );
      const destinationAirport = destinationAirportRes.data.data[0].iata_code;

      const flightRes = await axios.get(`${BACKEND_URL}/flights/search`, {
        params: {
          origin: departureAirport,
          destination: destinationAirport,
          departure_date: departureDate,
          return_date: returnDate,
        },
      });

      setFlights(flightRes.data.data.offers);
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
          <input
            type="text"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            placeholder="Enter City"
            className="w-full mt-1 p-2 border rounded-lg focus:ring 
              focus:ring-blue-200"
          />
        </div>

        {/* Destination Loc*/}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium">
            Destination Location
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter City"
            className="w-full mt-1 p-2 border rounded-lg focus:ring 
              focus:ring-blue-200"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium">
            Departure Date
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            placeholder="Enter City"
            className="w-full mt-1 p-2 border rounded-lg focus:ring 
              focus:ring-blue-200"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium">Return Date</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            placeholder="Enter City"
            className="w-full mt-1 p-2 border rounded-lg focus:ring 
              focus:ring-blue-200"
          />
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="mt-4 w-full bg-blue-600 text-white p-3 
          rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          disabled={!departure}
        >
          Search Options
        </button>
      </div>

      {/* Right Panel: Map+flights+hotels */}
      <div className="flex-1 p-6 space-y-6">
        {/* Map sect */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Map</h2>
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
              <p className="text-gray-500">Flight results:</p>
            ) : (
              flights.map((offer, i) => {
                const outboundSlice = offer.slices?.[0];
                const returnSlice = offer.slices?.[1];
                const outboundSeg = outboundSlice?.segments?.[0];
                const returnSeg = returnSlice?.segments?.[0];

                const price = offer.total_amount;
                const currency = offer.total_currency;
                const emissionsKg = offer.total_emissions_kg;

                const changeAllowed =
                  offer.conditions?.change_before_departure?.allowed;
                const changePenalty =
                  offer.conditions?.change_before_departure?.penalty_amount;
                const paymentBy =
                  offer.payment_requirements?.payment_required_by;

                return (
                  <div
                    key={i}
                    className="mb-3 border rounded-lg p-3 text-sm flex flex-col gap-2"
                  >
                    {/* Header: airline + price */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={offer.owner.logo_symbol_url}
                          alt={offer.owner.name}
                          className="w-7 h-7"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {offer.owner.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {outboundSlice?.fare_brand_name || "Economy"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-blue-700">
                          {currency} {price}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Base {offer.base_currency} {offer.base_amount} + tax{" "}
                          {offer.tax_currency} {offer.tax_amount}
                        </div>
                      </div>
                    </div>

                    {/* Outbound & return summary */}
                    <div className="space-y-2 bg-gray-50 rounded-md p-2">
                      {outboundSeg && (
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="text-xs uppercase text-gray-500">
                              Outbound
                            </div>
                            <div className="font-medium text-gray-800">
                              {outboundSeg.origin?.iata_code} →{" "}
                              {outboundSeg.destination?.iata_code}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {new Date(
                                outboundSeg.departing_at
                              ).toLocaleString()}{" "}
                              ·{" "}
                              {outboundSlice?.duration
                                ?.replace("PT", "")
                                .toLowerCase()}
                            </div>
                          </div>
                          <div className="text-right text-[11px] text-gray-500">
                            Flight {outboundSeg.marketing_carrier_flight_number}
                          </div>
                        </div>
                      )}

                      {returnSeg && (
                        <div className="flex justify-between items-start gap-2 border-t border-dashed border-gray-200 pt-2">
                          <div>
                            <div className="text-xs uppercase text-gray-500">
                              Return
                            </div>
                            <div className="font-medium text-gray-800">
                              {returnSeg.origin?.iata_code} →{" "}
                              {returnSeg.destination?.iata_code}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {new Date(
                                returnSeg.departing_at
                              ).toLocaleString()}{" "}
                              ·{" "}
                              {returnSlice?.duration
                                ?.replace("PT", "")
                                .toLowerCase()}
                            </div>
                          </div>
                          <div className="text-right text-[11px] text-gray-500">
                            Flight {returnSeg.marketing_carrier_flight_number}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta: baggage / emissions / rules */}
                    <div className="flex justify-between items-center text-[11px] text-gray-600">
                      <div className="flex flex-col">
                        <span>Emissions: {emissionsKg} kg CO₂</span>
                        <span>
                          Cabin:{" "}
                          {outboundSlice?.segments?.[0]?.passengers?.[0]
                            ?.cabin_class_marketing_name || "Economy"}
                        </span>
                      </div>
                      <div className="text-right flex flex-col">
                        <span>
                          Change:{" "}
                          {changeAllowed
                            ? `allowed (fee ${changePenalty})`
                            : "not allowed"}
                        </span>
                        {paymentBy && (
                          <span>
                            Pay by {new Date(paymentBy).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* hotels */}
          <div className="bg-white rounded-l p-4 shadow h-[45vh] overflow-auto col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Nearby Hotels:
            </h3>
            {hotels.length === 0 ? (
              <p className="text-gray-500">Hotel results:</p>
            ) : (
              <div className="space-y-3">
                {hotels.map((h, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-3 text-sm flex flex-col gap-2"
                  >
                    {/* Header: hotel name + price */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {h.name}
                        </div>
                        <div className="text-[11px] text-gray-500">Hotel</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-blue-700">
                          ${h.price}/night
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Rating: {h.rating}
                        </div>
                      </div>
                    </div>

                    {/* Details: address & meta */}
                    <div className="bg-gray-50 rounded-md p-2 flex flex-col gap-1">
                      <div className="text-[11px] text-gray-600">
                        {h.address}
                      </div>
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
