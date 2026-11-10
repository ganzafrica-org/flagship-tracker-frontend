import { Card } from "@heroui/react";
import type { ReactNode } from "react";

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
}

export function StatCard({ color, icon, iconBackground, stat, unit, label, statDescription, className, statClassName, labelOnOwnLine = false }: StatCardProps) {
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
      <div className={`flex w-full px-5 py-5 ${labelOnOwnLine ? "flex-col justify-center gap-1.5" : "flex-row items-center gap-4"}`}>
        <div className="flex min-w-0 flex-row items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
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
          <span className="whitespace-nowrap pl-[3.75rem] text-[10px] leading-none text-(--foreground)">{label}</span>
        ) : null}
      </div>
    </Card>
  );
}
