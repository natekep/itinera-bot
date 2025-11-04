// frontend/src/pages/Hongjie.tsx

import React, { useState } from "react";
import { supabase } from "../supabaseClient";

interface HotelOffer {
  hotel_code: number;
  name: string;
  rates: {
    rateKey: string;
    net: number;
    sellingRate?: number;
  }[];
}

interface BookingResult {
  booking_id: string;
  status: string;
  confirmation: any;
}

export default function Hongjie() {
  // Form state
  const [destination, setDestination] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Search results
  const [offers, setOffers] = useState<HotelOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Booking form
  const [selectedOffer, setSelectedOffer] = useState<HotelOffer | null>(null);
  const [selectedRateKey, setSelectedRateKey] = useState<string>("");
  const [holderName, setHolderName] = useState("");
  const [holderEmail, setHolderEmail] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // Flight search state
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [depart, setDepart] = useState("");
  const [flightOffers, setFlightOffers] = useState<any[]>([]);
  const [flightError, setFlightError] = useState<string>("");

  // Perform search
  const searchHotels = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const resp = await fetch("/api/hotels/searchHotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          checkin,
          checkout,
          adults,
          children,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Search API failed: ${txt}`);
      }
      const data = await resp.json();
      setOffers(data.offers || []);
    } catch (err: any) {
      console.error("search error", err);
      setErrorMsg(err.message || "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger booking for selected rate
  const bookHotel = async () => {
    if (!selectedOffer) {
      setErrorMsg("No offer selected");
      return;
    }
    if (!selectedRateKey) {
      setErrorMsg("No rate selected");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      const resp = await fetch("/api/hotels/bookHotel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_code: selectedOffer.hotel_code,
          rateKey: selectedRateKey,
          checkin,
          checkout,
          holder_name: holderName,
          holder_email: holderEmail,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Booking API failed: ${txt}`);
      }
      const data = await resp.json();
      setBookingResult(data);

      // Save booking to Supabase under the current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) {
        console.warn("Could not get current user for saving booking:", userErr.message);
      } else if (user) {
        const insertPayload = {
          user_id: user.id,
          booking_id: data.booking_id,
          status: data.status,
          hotel_code: selectedOffer.hotel_code,
          rate_key: selectedRateKey,
          checkin,
          checkout,
          holder_name: holderName,
          holder_email: holderEmail,
          confirmation: data.confirmation,
          created_at: new Date().toISOString(),
        } as any;
        const { error: dbErr } = await supabase.from("hotel").insert(insertPayload);
        if (dbErr) {
          console.warn("Failed to save booking to Supabase:", dbErr.message);
        }
      }
    } catch (err: any) {
      console.error("booking error", err);
      setErrorMsg(err.message || "Booking failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Flight API exploration
  const searchFlights = async () => {
    setIsLoading(true);
    setFlightError("");
    setFlightOffers([]);
    try {
      const params = new URLSearchParams({
        origin: origin.trim().toUpperCase(),
        destination: dest.trim().toUpperCase(),
        departureDate: depart,
        adults: String(adults || 1),
      });
      const resp = await fetch(`/api/flights/search?${params.toString()}`);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt);
      }
      const data = await resp.json();
      setFlightOffers(data.offers || []);
    } catch (e: any) {
      setFlightError(e?.message || "Flight search failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Hongjie — Hotel Search & Booking</h2>

      <div style={{ marginBottom: 20 }}>
        <h3>Search Hotels</h3>
        <label>
          Destination:
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </label>
        <br />
        <label>
          Check-in:
          <input
            type="date"
            value={checkin}
            onChange={(e) => setCheckin(e.target.value)}
          />
        </label>
        <br />
        <label>
          Check-out:
          <input
            type="date"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
          />
        </label>
        <br />
        <label>
          Adults:
          <input
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(parseInt(e.target.value))}
          />
        </label>
        <br />
        <label>
          Children:
          <input
            type="number"
            min={0}
            value={children}
            onChange={(e) => setChildren(parseInt(e.target.value))}
          />
        </label>
        <br />
        <button onClick={searchHotels} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search Hotels"}
        </button>
      </div>

      {errorMsg && <div style={{ color: "red" }}>{errorMsg}</div>}

      <div>
        <h3>Search Results</h3>
        {offers.length === 0 && <div>No offers yet</div>}
        {offers.map((o) => (
          <div
            key={o.hotel_code}
            style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}
          >
            <h4>{o.name}</h4>
            <p>Hotel code: {o.hotel_code}</p>
            <div>
              Rates:
              <ul>
                {o.rates.map((r) => (
                  <li key={r.rateKey}>
                    <label>
                      <input
                        type="radio"
                        name={`rate-${o.hotel_code}`}
                        value={r.rateKey}
                        onChange={() => {
                          setSelectedOffer(o);
                          setSelectedRateKey(r.rateKey);
                        }}
                      />
                      RateKey: {r.rateKey}, net: {r.net}
                      {r.sellingRate !== undefined && `, sell: ${r.sellingRate}`}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {selectedOffer && (
        <div style={{ marginTop: 30 }}>
          <h3>Booking Form</h3>
          <p>
            Booking hotel <strong>{selectedOffer.name}</strong> with rateKey{" "}
            <strong>{selectedRateKey}</strong>
          </p>
          <label>
            Holder Name:
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
            />
          </label>
          <br />
          <label>
            Holder Email:
            <input
              type="email"
              value={holderEmail}
              onChange={(e) => setHolderEmail(e.target.value)}
            />
          </label>
          <br />
          <button onClick={bookHotel} disabled={isLoading}>
            {isLoading ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      )}

      {bookingResult && (
        <div style={{ marginTop: 30, border: "1px solid green", padding: 10 }}>
          <h3>Booking Result</h3>
          <p>Booking ID: {bookingResult.booking_id}</p>
          <p>Status: {bookingResult.status}</p>
          <details>
            <summary>Full confirmation</summary>
            <pre>{JSON.stringify(bookingResult.confirmation, null, 2)}</pre>
          </details>
        </div>
      )}

      <hr style={{ margin: "40px 0" }} />
      <h2>Flight API (Amadeus) — Exploration</h2>
      <div style={{ marginBottom: 20 }}>
        <label>
          Origin (IATA):
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="SFO" />
        </label>
        <br />
        <label>
          Destination (IATA):
          <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="LAX" />
        </label>
        <br />
        <label>
          Departure Date:
          <input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} />
        </label>
        <br />
        <button onClick={searchFlights} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search Flights"}
        </button>
        {flightError && <div style={{ color: "red" }}>{flightError}</div>}
      </div>
      <div>
        {flightOffers.length === 0 && <div>No flight offers</div>}
        {flightOffers.map((f) => (
          <div key={f.id} style={{ border: "1px solid #ddd", margin: 8, padding: 8 }}>
            <div>Offer ID: {f.id}</div>
            <div>Price: {f.price}</div>
            <div>
              Itineraries:
              <ul>
                {f.itineraries?.map((it: any, idx: number) => (
                  <li key={idx}>
                    {it.from} → {it.to} | duration {it.duration} | stops {it.stops}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}