import React, { useEffect, useRef } from "react";

interface MapViewProps {
  coords: { lat: number; lng: number }[];
  markerLabels: string[];
}

const MapView: React.FC<MapViewProps> = ({ coords, markerLabels }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<agoogle.maps.Marker[]>([]);
  const polyline = useRef<google.maps.Polyline | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 }, // USA center
      zoom: 4,
      mapId: "DEMO_MAP_ID"
    });
  }, []);

  // Update markers + route whenever coords or placeIds change
  useEffect(() => {
    if (!mapInstance.current || !window.google?.maps) return;

    const g = window.google.maps;

    // Clear old markers
    markers.current.forEach((m) => m.map = null as any);
    markers.current = [];

    // Clear old route line
    if (polyline.current) {
      polyline.current.setMap(null);
      polyline.current = null;
    }

    if (coords.length === 0) {
      // nothing to show, just keep default center
      return;
    }

    const bounds = new g.LatLngBounds();
    coords.forEach((c, i) => {
      const marker = new google.maps.Marker({
        map: mapInstance.current!,
        position: c,
        title: markerLabels[i],
      });
      markers.current.push(marker);
      bounds.extend(c);
    });

    if (coords.length > 1) {
      polyline.current = new g.Polyline({
        path: coords,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map: mapInstance.current
      });
    }
    mapInstance.current.fitBounds(bounds);
    }, [coords, markerLabels]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg shadow border border-gray-200"
    />
  );
};

export default MapView;
