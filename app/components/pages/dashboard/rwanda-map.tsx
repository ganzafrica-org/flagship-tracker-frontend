import { useEffect, useRef } from "react";

import { flagshipLocations } from "~/data/dummy-senior-dashboard";
import { districtCoords } from "~/data/rwanda-districts";

const MARKER_COLORS = ["var(--accent)", "var(--warning)", "var(--forest)", "var(--danger)"];

export interface MapLocation {
  name: string;
  district: string | null;
  province?: string | null;
}

interface RwandaMapProps {
  /** Locations to plot. When omitted, the dummy dataset is used. */
  locations?: MapLocation[];
}

/** Resolve marker points from props (geocoded by district) or fall back to dummy. */
function resolvePoints(locations?: MapLocation[]) {
  if (!locations || locations.length === 0) {
    return flagshipLocations.map((l) => ({ name: l.name, district: l.district, lat: l.lat, lng: l.lng, color: l.color }));
  }
  const points: { name: string; district: string; lat: number; lng: number; color: string }[] = [];
  locations.forEach((loc, i) => {
    const coords = districtCoords(loc.district);
    if (!coords) return;
    points.push({
      name: loc.name,
      district: loc.district ?? "",
      lat: coords.lat,
      lng: coords.lng,
      color: MARKER_COLORS[i % MARKER_COLORS.length],
    });
  });
  // If none of the API districts could be geocoded, keep the dummy markers.
  return points.length > 0
    ? points
    : flagshipLocations.map((l) => ({ name: l.name, district: l.district, lat: l.lat, lng: l.lng, color: l.color }));
}

export default function RwandaMap({ locations }: RwandaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: import("leaflet").Map | null = null;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [-1.9403, 29.8739],
        zoom: 8,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
      }).addTo(map);

      for (const loc of resolvePoints(locations)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22s14-12.67 14-22C28 6.27 21.73 0 14 0z" fill="${loc.color}"/><circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/></svg>`;
        const icon = L.divIcon({
          html: svg,
          className: "",
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -36],
        });
        L.marker([loc.lat, loc.lng], { icon })
          .bindPopup(`<span style="font-weight:600">${loc.name}</span><br/>${loc.district} District`)
          .addTo(map);
      }

      mapRef.current = map;
    }

    initMap();

    return () => {
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, [locations]);

  return <div ref={containerRef} className="h-[380px] w-full rounded-xl overflow-hidden" />;
}
