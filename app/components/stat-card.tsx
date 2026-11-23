import { Card } from "@heroui/react";
import type { ReactNode } from "react";

function progressTone(value: number): { bar: string; chip: string; text: string } {
  if (value <= 0) {
    return { bar: "var(--muted)", chip: "transparent", text: "var(--muted)" };
  }
  if (value < 25) {
    return { bar: "var(--warning)", chip: "color-mix(in oklab, var(--warning) 16%, transparent)", text: "var(--warning)" };
  }
  if (value < 75) {
    return { bar: "var(--accent)", chip: "color-mix(in oklab, var(--accent) 14%, transparent)", text: "var(--accent)" };
  }
  return { bar: "var(--success)", chip: "color-mix(in oklab, var(--success) 16%, transparent)", text: "var(--success)" };
}

function ProgressLine({ text, percent, value }: { text: string; percent: string; value: number }) {
  const tone = progressTone(value);
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-1">
      <div className="mb-1 h-1 overflow-hidden rounded-full bg-(--default)">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: tone.bar }} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-[11px] leading-tight text-(--muted)">{text}</span>
        <span
          className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none"
          style={{
            color: tone.text,
            backgroundColor: tone.chip,
            borderColor: value <= 0 ? "var(--separator)" : "transparent",
          }}
        >
          {percent}
        </span>
      </div>
    </div>
  );
}

import { themeIconSoftBackground } from "~/lib/theme-icon-bg";

interface StatCardProps {
  /** Accent for the left bar and icon glyph (e.g. `var(--warning)`). */
  color: string;
  /** Pastel circle behind the icon; prefer explicit `var(--*-icon-bg)` so it always matches the accent hue. */
  iconBackground?: string;
  /** Tabler icon component rendered inside the circle. */
  icon: ReactNode;
  /** Primary statistic value displayed prominently. */
  stat: string | number;
  /** Unit shown much smaller than the number, e.g. "RWF" or "hectares". */
  unit?: string;
  /** Main label shown below the stat value. */
  label: string;
  /** Optional inline description shown next to the stat value. */
  statDescription?: string;
  /** Optional class on the root `Card` (e.g. `h-full` for grid layouts). */
  className?: string;
  /** Optional size classes for the number. Defaults to `text-2xl`. */
  statClassName?: string;
  /** Place the label under the icon and number so the full name can sit on one line. */
  labelOnOwnLine?: boolean;
  /** Less vertical padding, for dense rows such as the dashboard summary. */
  compact?: boolean;
  /** Target line, a bar, and a percent chip. The chip and bar follow how much of the target is reached. */
  progress?: { text: string; percent: string; value: number };
}

export function StatCard({ color, icon, iconBackground, stat, unit, label, statDescription, className, statClassName, labelOnOwnLine = false, compact = false, progress }: StatCardProps) {
  const circleBg = iconBackground ?? themeIconSoftBackground(color);

  return (
    <Card
      className={`@container relative flex min-h-0 flex-row items-stretch gap-0 overflow-hidden p-0 ${className ?? ""}`}
    >
      {/* Left accent line */}
      <div
        className="w-1 shrink-0 rounded-l-sm"
        style={{ backgroundColor: color }}
      />

      {/* Card body */}
      <div className={`flex w-full ${compact ? "px-4 py-1.5" : progress ? "px-4 py-4" : "px-5 py-5"} ${labelOnOwnLine ? "flex-col justify-center gap-1.5" : "flex-row items-center gap-4"}`}>
        <div className="flex min-w-0 flex-row items-center gap-4">
          <div
            className={`flex shrink-0 items-center justify-center rounded-full ${compact ? "h-9 w-9" : "h-11 w-11"}`}
            style={{ backgroundColor: circleBg }}
          >
            <span className="inline-flex [&_svg]:stroke-current [&_svg]:text-current" style={{ color }}>
              {icon}
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className={`font-bold leading-none text-(--foreground) ${statClassName ?? "text-2xl"}`}>
                {stat}
              </span>
              {unit ? (
                <span className="shrink-0 text-[10px] font-normal leading-none text-(--muted)">{unit}</span>
              ) : null}
              {statDescription && (
                <span className="text-xs text-(--foreground)">{statDescription}</span>
              )}
            </div>
            {label && !labelOnOwnLine ? <span className="text-sm text-(--foreground)">{label}</span> : null}
          </div>
        </div>
        {label && labelOnOwnLine ? (
          <span className="min-w-0 pl-[3.75rem] text-[10px] leading-tight text-(--foreground)">{label}</span>
        ) : null}
        {progress ? (
          <ProgressLine text={progress.text} percent={progress.percent} value={progress.value} />
        ) : null}
      </div>
    </Card>
  );
}
