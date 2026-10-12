export const RWANDA_PROVINCES = ["East", "Kigali", "North", "South", "West"] as const;

/** Static Rwanda districts so filters work without relying on the rwanda npm package at runtime. */
export const RWANDA_DISTRICTS_BY_PROVINCE: Record<(typeof RWANDA_PROVINCES)[number], string[]> = {
  East: ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
  Kigali: ["Gasabo", "Kicukiro", "Nyarugenge"],
  North: ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  South: ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
  West: ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"],
};

function normalizeLocation(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Map common province spellings to one key so filters match stored individual rows. */
export function provinceKey(value: string | null | undefined): string {
  const normalized = normalizeLocation(value);
  const aliases: Record<string, string> = {
    east: "east",
    eastern: "east",
    "eastern province": "east",
    north: "north",
    northern: "north",
    "northern province": "north",
    south: "south",
    southern: "south",
    "southern province": "south",
    west: "west",
    western: "west",
    "western province": "west",
    kigali: "kigali",
    "kigali city": "kigali",
    "city of kigali": "kigali",
  };
  return aliases[normalized] ?? normalized;
}

/** Resolve any province spelling to the canonical Rwanda province name. */
export function canonicalProvince(value: string | null | undefined): string | null {
  if (!value || value === "all") return null;
  const key = provinceKey(value);
  const match = RWANDA_PROVINCES.find((province) => provinceKey(province) === key);
  return match ?? value.trim();
}

export function listRwandaProvinces(): string[] {
  return [...RWANDA_PROVINCES];
}

export function listRwandaDistricts(province: string | null | undefined): string[] {
  const canonical = canonicalProvince(province);
  if (!canonical) return [];
  return [...(RWANDA_DISTRICTS_BY_PROVINCE[canonical as (typeof RWANDA_PROVINCES)[number]] ?? [])];
}

export function listAllRwandaDistricts(): string[] {
  const merged = RWANDA_PROVINCES.flatMap((province) => RWANDA_DISTRICTS_BY_PROVINCE[province]);
  return [...new Set(merged)].sort((a, b) => a.localeCompare(b));
}

export function provinceMatches(stored: string | null | undefined, selected: string): boolean {
  if (!selected || selected === "all") return true;
  if (!stored?.trim()) return false;
  return provinceKey(stored) === provinceKey(selected);
}

export function districtMatches(stored: string | null | undefined, selected: string): boolean {
  if (!selected || selected === "all") return true;
  if (!stored?.trim()) return false;
  return normalizeLocation(stored) === normalizeLocation(selected);
}

export function inferProvinceForDistrict(district: string): string | null {
  if (!district || district === "all") return null;
  for (const province of RWANDA_PROVINCES) {
    const districts = RWANDA_DISTRICTS_BY_PROVINCE[province];
    if (districts.some((entry) => districtMatches(entry, district))) {
      return province;
    }
  }
  return null;
}
