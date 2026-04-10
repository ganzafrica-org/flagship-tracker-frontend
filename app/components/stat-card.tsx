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
  /** Main label shown below the stat value. */
  label: string;
  /** Optional inline description shown next to the stat value. */
  statDescription?: string;
  /** Optional class on the root `Card` (e.g. `h-full` for grid layouts). */
  className?: string;
}

export function StatCard({ color, icon, iconBackground, stat, label, statDescription, className }: StatCardProps) {
  const circleBg = iconBackground ?? themeIconSoftBackground(color);

  return (
    <Card
      className={`relative overflow-hidden flex flex-row items-stretch p-0 gap-0 min-h-0 ${className ?? ""}`}
    >
      {/* Left accent line */}
      <div
        className="w-1 shrink-0 rounded-l-sm"
        style={{ backgroundColor: color }}
      />

      {/* Card body */}
      <div className="flex flex-row items-center gap-4 px-5 py-6 w-full">
        {/* Icon circle */}
        <div
          className="flex items-center justify-center rounded-full w-11 h-11 shrink-0"
          style={{ backgroundColor: circleBg }}
        >
          <span className="inline-flex [&_svg]:stroke-current [&_svg]:text-current" style={{ color }}>
            {icon}
          </span>
        </div>

        {/* Stat + label */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-(--foreground) leading-none">
              {stat}
            </span>
            {statDescription && (
              <span className="text-xs text-(--foreground)">{statDescription}</span>
            )}
          </div>
          {label && <span className="text-sm text-(--foreground)">{label}</span>}
        </div>
      </div>
    </Card>
  );
}
