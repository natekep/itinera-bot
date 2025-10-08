import React, { useState, useEffect } from "react";
import MapView from "../components/MapView";
import "../styles/mapview.css";

const Maps: React.FC = () => {
  const [origin, setOrigin] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 1️⃣ Load Google Maps API first
  useEffect(() => {
    if (window.google) return; // already loaded

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      console.log("Google Maps API loaded");
      getCurrentLocation();
    };
  }, []);

  // 2️⃣ Get current location and reverse geocode
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      if (!window.google || !window.google.maps) return;

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          let currentName = "Current Location";
          if (status === "OK" && results && results[0]) {
            currentName = results[0].formatted_address;
          }
          setOrigin(currentName);
          setCoords([{ lat: latitude, lng: longitude, name: currentName }]);
        }
      );
    });
  };

  // 3️⃣ Add destination
  const addDestination = (place: string) => {
    if (!window.google || !window.google.maps) {
      alert("Google Maps not loaded yet");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: place },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          setCoords((prev) => [
            ...prev,
            { lat: loc.lat(), lng: loc.lng(), name: results[0].formatted_address },
          ]);
          setDestinations((prev) => [...prev, results[0].formatted_address]);
        } else {
          alert(`Failed to find "${place}"`);
        }
      }
    );
  };

  return (
    <div className="maps-container">
      <div className="maps-left">
        {coords.length > 0 && <MapView coords={coords} apiKey={apiKey} />}
      </div>

      <div className="maps-right">
        <h2>Trip Info</h2>
        {origin && <p>Origin: <b>{origin}</b></p>}

        <h3>Add Destination</h3>
        <DestinationInput addDestination={addDestination} />

        <h3>Destinations</h3>
        <ul>
          {destinations.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Maps;

const DestinationInput: React.FC<{ addDestination: (place: string) => void }> = ({ addDestination }) => {
  const [input, setInput] = useState("");

  return (
    <div>
      <input
        type="text"
        placeholder="Enter destination"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        onClick={() => {
          if (input.trim() !== "") {
            addDestination(input.trim());
            setInput("");
          }
        }}
      >
        Add
      </button>
    </div>
  );
};
