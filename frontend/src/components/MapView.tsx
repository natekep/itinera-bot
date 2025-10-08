import React, { useEffect, useRef } from "react";

interface MapViewProps {
  coords: { lat: number; lng: number; name: string }[];
  apiKey: string;
}

const MapView: React.FC<MapViewProps> = ({ coords, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || coords.length === 0) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: coords[0],
        zoom: 10,
      });

      const bounds = new window.google.maps.LatLngBounds();

      coords.forEach((point, index) => {
        new window.google.maps.Marker({
          position: point,
          map,
          title: point.name, // ✅ show name as marker title
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

    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, [coords, apiKey]);

  return <div ref={mapRef} className="map-container" />;
};

export default MapView;
