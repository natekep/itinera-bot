import React, { useEffect, useRef } from "react";

interface MapViewProps {
  coords: { lat: number; lng: number }[];
  places?: { name: string; location: { latitude: number; longitude: number } }[];
}

const MapView: React.FC<MapViewProps> = ({ coords, places = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const routePath = useRef<google.maps.Polyline | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    const g = window.google;
    if (!g || !g.maps) return;

    const map = new g.maps.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 },
      zoom: 4,
    });
    mapInstance.current = map;
  }, []);

  // Draw route and markers
  useEffect(() => {
    const g = window.google;
    if (!g || !g.maps || !mapInstance.current) return;
    const map = mapInstance.current;

    // 🧹 Clear previous
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    if (routePath.current) {
      routePath.current.setMap(null);
      routePath.current = null;
    }

    // 🛣️ Draw main route (only between origin → destination)
    if (coords.length >= 2) {
      const routeCoords = [coords[0], coords[coords.length - 1]]; // only start and end
      const polyline = new g.maps.Polyline({
        path: routeCoords,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
      polyline.setMap(map);
      routePath.current = polyline;
    }

    // 📍 Add route markers (A = origin, B = destination)
    coords.forEach((c, i) => {
      if (i === 0 || i === coords.length - 1) {
        const marker = new g.maps.Marker({
          position: c,
          map,
          label: i === 0 ? "A" : "B",
        });
        markers.current.push(marker);
      }
    });

    // 🏞️ Add nearby places as green markers
    places.forEach((p) => {
      const loc = p.location;
      if (!loc?.latitude || !loc?.longitude) return;

      const marker = new g.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
        },
        title: p.name,
      });

      const infoWindow = new g.maps.InfoWindow({
        content: `<strong>${p.name}</strong>`,
      });
      marker.addListener("click", () => infoWindow.open(map, marker));
      markers.current.push(marker);
    });

    // 🎯 Fit map to show everything clearly
    const bounds = new g.maps.LatLngBounds();
    coords.forEach((c) => bounds.extend(c));
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }

    // 🔍 Smooth zoom to destination area if places exist
    if (places.length > 0 && coords.length > 0) {
      const last = coords[coords.length - 1];
      setTimeout(() => {
        map.setCenter(last);
        map.setZoom(13);
      }, 400);
    }
  }, [coords, places]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg shadow-md border border-gray-200"
    />
  );
};

export default MapView;
