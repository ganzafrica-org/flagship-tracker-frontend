import { Button } from "@heroui/react";
import type { ReactNode } from "react";

interface PageTitleCardWithActionProps {
  title: string;
  /** HeroUI primary button label (e.g. "View Flagship Summary"). */
  actionLabel: string;
  onActionPress?: () => void;
  className?: string;
  /** Optional: replace default button (still use HeroUI Button inside your slot). */
  actionSlot?: ReactNode;
}

export function PageTitleCardWithAction({
  title,
  actionLabel,
  onActionPress,
  className,
  actionSlot,
}: PageTitleCardWithActionProps) {
  return (
    <div
      style={{ borderRadius: "8px" }}
      className={`w-full max-w-full min-w-0 rounded-lg overflow-hidden bg-(--surface) border border-(--separator) px-6 py-4 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-(--foreground)">{title}</h1>
        {actionSlot ?? (
          <Button
            variant="primary"
            className="!rounded-xl font-medium shrink-0"
            style={{ borderRadius: "12px" }}
            onPress={onActionPress}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
