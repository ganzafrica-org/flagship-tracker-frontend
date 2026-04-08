import { Card } from "@heroui/react";
import type { ReactNode } from "react";

interface StatCardProps {
  /** Accent color applied to the left border line and the icon. Used at ~13% opacity for the icon background circle. */
  color: string;
  /** Tabler icon component rendered inside the circle. */
  icon: ReactNode;
  /** Primary statistic value displayed prominently. */
  stat: string | number;
  /** Main label shown below the stat value. */
  label: string;
  /** Optional inline description shown next to the stat value. */
  statDescription?: string;
}

export function StatCard({ color, icon, stat, label, statDescription }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden flex flex-row items-stretch p-0 gap-0">
      {/* Left accent line */}
      <div
        className="w-1 shrink-0 rounded-l-sm"
        style={{ backgroundColor: color }}
      />

      {/* Card body */}
      <div className="flex flex-row items-center gap-4 px-5 py-4 w-full">
        {/* Icon circle */}
        <div
          className="flex items-center justify-center rounded-full w-11 h-11 shrink-0"
          style={{ backgroundColor: color + "22" }}
        >
          <span style={{ color }}>{icon}</span>
        </div>

        {/* Stat + label */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-(--foreground) leading-none">
              {stat}
            </span>
            {statDescription && (
              <span className="text-xs text-(--muted)">{statDescription}</span>
            )}
          </div>
          <span className="text-sm text-(--muted)">{label}</span>
        </div>
      </div>
    </Card>
  );
}
