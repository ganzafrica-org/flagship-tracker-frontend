export type TargetScope = "2026" | "programme";

const STORAGE_KEY = "flagship-target-scope";

export const TARGET_SCOPE_OPTIONS: { value: TargetScope; label: string }[] = [
  { value: "2026", label: "Target 2026–2027" },
  { value: "programme", label: "Whole programme" },
];

export function readTargetScope(): TargetScope {
  if (typeof window === "undefined") return "2026";
  return window.sessionStorage.getItem(STORAGE_KEY) === "programme" ? "programme" : "2026";
}

export function writeTargetScope(scope: TargetScope) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, scope);
}

export function targetScopeFromSearch(value: string | null): TargetScope | null {
  if (value === "programme" || value === "2026") return value;
  return null;
}

export function withTargetScope(path: string, scope: TargetScope): string {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = withoutHash.indexOf("?");
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const params = new URLSearchParams(queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "");
  params.set("target", scope);
  return `${pathname}?${params.toString()}${hash}`;
}

export function pickTarget(
  scope: TargetScope,
  target2026: number | null | undefined,
  targetProgramme: number | null | undefined,
): number | null {
  const value = scope === "programme" ? targetProgramme : target2026;
  return value == null ? null : value;
}
