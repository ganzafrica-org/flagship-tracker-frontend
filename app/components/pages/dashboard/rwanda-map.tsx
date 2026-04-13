import { useEffect, useRef } from "react";

import { flagshipLocations } from "~/data/dummy-senior-dashboard";

export default function RwandaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: ReturnType<typeof import("leaflet")["default"]["map"]> | null = null;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      // dynamic import of react-leaflet not needed — use plain leaflet here
      if (!containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [-1.9403, 29.8739],
        zoom: 8,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      for (const loc of flagshipLocations) {
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
  }, []);

  return <div ref={containerRef} className="h-[380px] w-full rounded-xl overflow-hidden" />;
}
