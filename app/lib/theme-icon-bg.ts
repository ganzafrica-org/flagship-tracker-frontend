/**
 * Maps theme accent CSS variables to their pastel icon-circle backgrounds (see app.css `*-icon-bg`).
 */
export function themeIconSoftBackground(accent: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(accent)) {
    return `${accent}22`;
  }
  const map: Record<string, string> = {
    "var(--accent)": "var(--accent-icon-bg)",
    "var(--warning)": "var(--warning-icon-bg)",
    "var(--forest)": "var(--forest-icon-bg)",
    "var(--danger)": "var(--danger-icon-bg)",
    "var(--success)": "var(--forest-icon-bg)",
  };
  return map[accent] ?? `color-mix(in oklch, ${accent} 32%, white)`;
}

/** Pastel fill for flagship cards (same hue family as the progress bar). */
export function themeCardSoftBackground(accent: string): string {
  if (accent === "var(--muted)") {
    return "color-mix(in oklch, var(--muted) 12%, var(--surface))";
  }
  return themeIconSoftBackground(accent);
}
