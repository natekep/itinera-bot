import React, { useEffect, useRef, useState } from "react";

interface MapViewProps {
  coords: { lat: number; lng: number }[];
}

const MapView: React.FC<MapViewProps> = ({ coords }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<InstanceType<typeof window.google.maps.Map> | null>(null);
  const routePath = useRef<InstanceType<typeof window.google.maps.Polyline> | null>(null);
  const markers = useRef<InstanceType<typeof window.google.maps.Marker>[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      const g = window.google;
      if (!g || !g.maps) return;

      if (!mapInstance.current && mapRef.current) {
        const map = new g.maps.Map(mapRef.current, {
          center: { lat: 39.8283, lng: -98.5795 }, // center of US
          zoom: 4,
        });
        mapInstance.current = map;
        setIsMapLoaded(true);
      }
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      window.addEventListener("google-maps-loaded", initMap);
    }

    return () => {
      window.removeEventListener("google-maps-loaded", initMap);
    };
  }, []);

  // Update markers & polyline
  useEffect(() => {
    const g = window.google;
    if (!g || !g.maps || !mapInstance.current || !isMapLoaded) return;

    const map = mapInstance.current;

    // Clear previous overlays
    routePath.current?.setMap(null);
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];

    // Add new markers
    coords.forEach((c, i) => {
      const marker = new g.maps.Marker({
        position: c,
        map,
        label: String.fromCharCode(65 + i),
      });
      markers.current.push(marker);
    });

    // Draw route line
    if (coords.length > 1) {
      const polyline = new g.maps.Polyline({
        path: coords,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
      polyline.setMap(map);
      routePath.current = polyline;
    }

    const bounds = new g.maps.LatLngBounds();
    coords.forEach((c) => bounds.extend(c));
    if (!bounds.isEmpty()) map.fitBounds(bounds);
  }, [coords]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg shadow-md border border-gray-200"
    />
  );
};

export default MapView;
