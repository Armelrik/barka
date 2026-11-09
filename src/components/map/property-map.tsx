"use client";
import dynamic from "next/dynamic";
import type { MapPoint } from "./leaflet-map";
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="property-map map-loading" role="status">
      Chargement de la carte…
    </div>
  ),
});
export function PropertyMap({ points }: { points: MapPoint[] }) {
  return <LeafletMap points={points} />;
}
