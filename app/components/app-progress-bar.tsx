import { ProgressBar } from "@heroui/react";

type ProgressColor = "accent" | "success" | "warning" | "danger";

interface AppProgressBarProps {
  /** 0–100 percentage. */
  value: number;
  color?: ProgressColor;
  /** Show the "NN%" label inline above the bar. */
  showLabel?: boolean;
  label?: string;
  className?: string;
}

/** Thin wrapper over HeroUI's ProgressBar for a consistent progress UI. */
export default function AppProgressBar({
  value,
  color = "accent",
  showLabel = false,
  label = "Progress",
  className = "",
}: AppProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <ProgressBar value={clamped} color={color} className={className} aria-label={label}>
      {showLabel ? (
        <div className="mb-1 flex items-center justify-between text-[12px] text-(--muted)">
          <span>{label}</span>
          <ProgressBar.Output className="font-medium text-(--foreground)" />
        </div>
      ) : null}
      <ProgressBar.Track className="h-2 rounded-full bg-(--default)">
        <ProgressBar.Fill className="h-full rounded-full" />
      </ProgressBar.Track>
    </ProgressBar>
  );
}
