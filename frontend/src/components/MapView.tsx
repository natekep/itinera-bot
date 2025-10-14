import React, { useEffect, useRef } from "react";
import "../styles/mapview.css";

interface MapViewProps {
  coords: { lat: number; lng: number; name: string }[];
  apiKey: string;
}

const MapView: React.FC<MapViewProps> = ({ coords, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("API Key:", apiKey);

    const initMap = () => {
      if (!mapRef.current || coords.length === 0) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: coords[0],
        zoom: 10,
      });

      const bounds = new window.google.maps.LatLngBounds();

      coords.forEach((point) => {
        new window.google.maps.Marker({
          position: point,
          map,
          title: point.name,
        });
        bounds.extend(point);
      });

      if (coords.length > 1) {
        new window.google.maps.Polyline({
          path: coords,
          geodesic: true,
          strokeColor: "#4285F4",
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map,
        });
      }

      map.fitBounds(bounds);
    };

    // ✅ Only load the script once
    if (!window.google || !window.google.maps) {
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com/maps/api/js"]`
      );
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener("load", initMap);
      }
    } else {
      initMap();
    }
  }, [coords, apiKey]);

  return <div ref={mapRef} className="map-container" />;
};

export default MapView;
