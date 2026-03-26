"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Component to recenter map when position changes
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface LeafletMapProps {
  center: [number, number];
  coords: [number, number][];
}

export default function LeafletMap({ center, coords }: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: "300px", width: "100%" }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />

      {/* Route polyline */}
      {coords.length > 1 && (
        <Polyline
          positions={coords}
          pathOptions={{ color: "hsl(262, 83%, 58%)", weight: 4, opacity: 0.85 }}
        />
      )}

      {/* Current position marker */}
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{
          fillColor: "hsl(262, 83%, 58%)",
          fillOpacity: 1,
          color: "white",
          weight: 3,
        }}
      />
    </MapContainer>
  );
}
