import React, { useEffect, useRef } from "react";
import "../styles/mapview.css";

interface MapViewProps {
  coords: { lat: number; lng: number }[];
}

const MapView: React.FC<MapViewProps> = ({ coords }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<InstanceType<typeof window.google.maps.Map> | null>(null);
  const routePath = useRef<InstanceType<typeof window.google.maps.Polyline> | null>(null);
  const markers = useRef<InstanceType<typeof window.google.maps.Marker>[]>([]);


  useEffect(() => {
    if (!mapRef.current) return;

    const g = window.google;
if (!g || !g.maps) return;

const map = new g.maps.Map(mapRef.current!, {
  center: { lat: 37.7749, lng: -122.4194 },
  zoom: 6,
});
mapInstance.current = map;
  }, []);
  useEffect(() => {
    const g = window.google;
    if (!g || !g.maps || !mapInstance.current) return;

    const map = mapInstance.current;

    // Clear previous route and markers
    routePath.current?.setMap(null);
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];

    // Add markers
    coords.forEach((c, i) => {
      const marker = new g.maps.Marker({
        position: c,
        map,
        label: String.fromCharCode(65 + i), // A, B, C...
      });
      markers.current.push(marker);
    });

    // Draw polyline if more than 1 point
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

    // Fit map to bounds
    const bounds = new g.maps.LatLngBounds();
    coords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds);
  }, [coords]);

  return <div ref={mapRef} className="map-container" />;
};

export default MapView;
