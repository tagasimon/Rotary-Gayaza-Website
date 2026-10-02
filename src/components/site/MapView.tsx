"use client";
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapPoint = { kind: "club" | "project" | "event"; title: string; subtitle?: string; href?: string; lat: number; lng: number };

const COLORS = { club: "#17458F", project: "#2F6B3B", event: "#F7A81B" };

/**
 * MapLibre map. Tiles default to OpenStreetMap raster tiles; set NEXT_PUBLIC_MAP_STYLE_URL to a
 * self-hosted or provider style (e.g. OpenFreeMap / MapTiler / Protomaps) for production traffic.
 * Only points with real coordinates are shown — we never invent locations.
 */
export function MapView({ points, height = 420 }: { points: MapPoint[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ref.current || points.length === 0) return;
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !ref.current) return;
        const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
        const m = new maplibre.Map({
          container: ref.current,
          style: styleUrl || {
            version: 8,
            sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
            layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.6, "raster-contrast": -0.05 } }],
          },
          center: [points[0].lng, points[0].lat],
          zoom: 13,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        map = m;
        m.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        const bounds = new maplibre.LngLatBounds();
        for (const p of points) {
          const el = document.createElement("div");
          el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${COLORS[p.kind]};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)`;
          const html = `<strong style="font-family:var(--font-display);font-size:16px">${escapeHtml(p.title)}</strong>${p.subtitle ? `<br/><span style="color:#5b6475">${escapeHtml(p.subtitle)}</span>` : ""}${p.href ? `<br/><a href="${p.href}" style="color:#17458F;font-weight:600">View →</a>` : ""}`;
          new maplibre.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(new maplibre.Popup({ offset: 14 }).setHTML(html)).addTo(m);
          bounds.extend([p.lng, p.lat]);
        }
        if (points.length > 1) m.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      } catch {
        setFailed(true);
      }
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [points]);

  if (points.length === 0) return null;
  const first = points[0];
  return (
    <div className="relative overflow-hidden rounded-sm border border-line bg-paper-2" style={{ height }}>
      <div ref={ref} className="absolute inset-0" role="region" aria-label="Map of club locations" />
      {failed && (
        <a className="absolute inset-0 grid place-items-center text-sm font-semibold text-royal underline" href={`https://www.openstreetmap.org/?mlat=${first.lat}&mlon=${first.lng}#map=16/${first.lat}/${first.lng}`} target="_blank" rel="noopener noreferrer">Open map ↗</a>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
