"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = { kind: "club" | "project" | "event"; title: string; subtitle?: string; href?: string; lat: number; lng: number };

const COLORS = { club: "#17458F", project: "#0067C8", event: "#F7A81B" };

/**
 * Open-source map: Leaflet + OpenStreetMap tiles. No API key, no WebGL, no web workers.
 * Set NEXT_PUBLIC_MAP_TILE_URL to use another tile server (e.g. a self-hosted one).
 * Only points with real coordinates are shown. We never invent locations.
 */
export function MapView({ points, height = 420 }: { points: MapPoint[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || points.length === 0) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !ref.current) return;
        map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true })
          .setView([points[0].lat, points[0].lng], 15);
        L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        }).addTo(map);
        const latlngs: [number, number][] = [];
        for (const p of points) {
          const html = `<strong style="font-size:15px">${esc(p.title)}</strong>${p.subtitle ? `<br/><span style="color:#5b6784">${esc(p.subtitle)}</span>` : ""}`
            + `<br/><a href="https://www.openstreetmap.org/directions?to=${p.lat}%2C${p.lng}" target="_blank" rel="noopener" style="color:#17458F;font-weight:700">Directions ↗</a>`
            + (p.href ? ` · <a href="${esc(p.href)}" style="color:#17458F;font-weight:700">Details →</a>` : "");
          L.circleMarker([p.lat, p.lng], { radius: 10, color: "#fff", weight: 3, fillColor: COLORS[p.kind], fillOpacity: 1 })
            .bindPopup(html).addTo(map);
          latlngs.push([p.lat, p.lng]);
        }
        if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [50, 50], maxZoom: 15 });
        // the container may have been laid out after init (reveal animations, tabs)
        setTimeout(() => map?.invalidateSize(), 300);
      } catch {
        setFailed(true);
      }
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [points]);

  if (points.length === 0) return null;
  const first = points[0];
  const osm = `https://www.openstreetmap.org/?mlat=${first.lat}&mlon=${first.lng}#map=17/${first.lat}/${first.lng}`;
  return (
    <div>
      <div className="relative z-0 overflow-hidden rounded-xl border border-royal/15 bg-mist" style={{ height }}>
        <div ref={ref} className="absolute inset-0" role="region" aria-label="Map" />
        {failed && (
          <a className="absolute inset-0 grid place-items-center text-sm font-bold text-royal underline" href={osm} target="_blank" rel="noopener noreferrer">Open the map ↗</a>
        )}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted">
        <a href={osm} target="_blank" rel="noopener noreferrer" className="font-semibold text-royal hover:underline">Open in OpenStreetMap ↗</a>
        <a href={`https://www.openstreetmap.org/directions?to=${first.lat}%2C${first.lng}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-royal hover:underline">Get directions ↗</a>
      </p>
    </div>
  );
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
