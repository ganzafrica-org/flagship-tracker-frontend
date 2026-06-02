/**
 * Approximate WGS84 centroids for Rwanda's 30 districts, used to plot
 * flagship implementation locations on the map (1.10 / 3.1) when the API
 * provides province/district but not coordinates.
 */
export const RWANDA_DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  // Kigali City
  Nyarugenge: { lat: -1.9536, lng: 30.0606 },
  Gasabo: { lat: -1.9, lng: 30.1 },
  Kicukiro: { lat: -1.99, lng: 30.1 },
  // Northern
  Musanze: { lat: -1.4998, lng: 29.6341 },
  Burera: { lat: -1.47, lng: 29.86 },
  Gakenke: { lat: -1.69, lng: 29.78 },
  Gicumbi: { lat: -1.58, lng: 30.06 },
  Rulindo: { lat: -1.77, lng: 30.06 },
  // Southern
  Huye: { lat: -2.5975, lng: 29.7388 },
  Gisagara: { lat: -2.62, lng: 29.83 },
  Kamonyi: { lat: -2.0, lng: 29.9 },
  Muhanga: { lat: -2.08, lng: 29.75 },
  Nyamagabe: { lat: -2.46, lng: 29.43 },
  Nyanza: { lat: -2.35, lng: 29.75 },
  Nyaruguru: { lat: -2.65, lng: 29.52 },
  Ruhango: { lat: -2.18, lng: 29.78 },
  // Eastern
  Nyagatare: { lat: -1.2958, lng: 30.3249 },
  Bugesera: { lat: -2.21, lng: 30.13 },
  Gatsibo: { lat: -1.58, lng: 30.43 },
  Kayonza: { lat: -1.88, lng: 30.62 },
  Kirehe: { lat: -2.22, lng: 30.71 },
  Ngoma: { lat: -2.16, lng: 30.53 },
  Rwamagana: { lat: -1.95, lng: 30.43 },
  // Western
  Rubavu: { lat: -1.6832, lng: 29.2564 },
  Karongi: { lat: -2.0, lng: 29.38 },
  Ngororero: { lat: -1.86, lng: 29.62 },
  Nyabihu: { lat: -1.65, lng: 29.51 },
  Nyamasheke: { lat: -2.36, lng: 29.14 },
  Rusizi: { lat: -2.48, lng: 28.9 },
  Rutsiro: { lat: -1.93, lng: 29.33 },
};

/** Case-insensitive lookup of a district centroid. */
export function districtCoords(district: string | null | undefined): { lat: number; lng: number } | null {
  if (!district) return null;
  const key = district.trim().toLowerCase();
  for (const [name, coords] of Object.entries(RWANDA_DISTRICT_COORDS)) {
    if (name.toLowerCase() === key) return coords;
  }
  return null;
}
