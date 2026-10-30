import { Cells, Districts, Provinces, Sectors, Villages } from "rwanda";

/** Province → district → sector → cell → village lookups from the `rwanda` package, as the location selector uses them. */

function toList(values: unknown): string[] {
  return Array.isArray(values) ? values.filter((v): v is string => typeof v === "string") : [];
}

function safe(lookup: () => unknown): string[] {
  try {
    return toList(lookup());
  } catch {
    return [];
  }
}

export function listProvinces(): string[] {
  return safe(() => Provinces());
}

export function listDistricts(province: string): string[] {
  return safe(() => Districts({ provinces: province }));
}

/** The package's Sectors() returns the sectors of every district in the province; keep this district's only. */
export function listSectors(province: string, district: string): string[] {
  const unique = [...new Set(safe(() => Sectors({ province, district })))];
  return unique
    .filter((sector) => {
      try {
        return Array.isArray(Cells({ province, district, sector }));
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.localeCompare(b));
}

export function listCells(province: string, district: string, sector: string): string[] {
  return safe(() => Cells({ province, district, sector }));
}

export function listVillages(province: string, district: string, sector: string, cell: string): string[] {
  return safe(() => Villages({ province, district, sector, cell }));
}

/** Case-insensitive match returning the package's spelling, or undefined. */
export function matchName(options: string[], value: string): string | undefined {
  const wanted = value.trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === wanted);
}
