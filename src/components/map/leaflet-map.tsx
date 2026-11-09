"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
export type MapPoint = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  href?: string;
};
export default function LeafletMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView(
      [12.371, -1.52],
      12,
    );
    L.tileLayer(
      process.env.NEXT_PUBLIC_MAP_TILE_URL ||
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    )
      .on("tileerror", () => setError(true))
      .addTo(map);
    const bounds: L.LatLngExpression[] = [];
    for (const point of points) {
      if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude))
        continue;
      const position: L.LatLngExpression = [point.latitude, point.longitude];
      bounds.push(position);
      const body = document.createElement("div"),
        name = document.createElement("strong");
      name.textContent = point.title;
      body.appendChild(name);
      if (point.href) {
        const link = document.createElement("a");
        link.href = point.href;
        link.textContent = "Voir le bien";
        link.className = "map-property-link";
        body.appendChild(link);
      }
      L.marker(position, {
        title: point.title,
        alt: point.title,
        icon: L.divIcon({
          className: "barka-map-pin",
          html: '<span aria-hidden="true">⌂</span>',
          iconSize: [38, 44],
          iconAnchor: [19, 44],
        }),
      })
        .bindPopup(body)
        .addTo(map);
    }
    if (bounds.length)
      map.fitBounds(L.latLngBounds(bounds), { padding: [45, 45], maxZoom: 14 });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [points]);
  return (
    <div className="property-map-wrap">
      <div
        ref={ref}
        className="property-map"
        role="region"
        aria-label="Carte des biens immobiliers"
      />
      {error && (
        <p role="status" className="map-tile-error">
          Le fond de carte est momentanément indisponible. Les annonces restent
          consultables dans la liste.
        </p>
      )}
    </div>
  );
}
