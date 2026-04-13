import type { ReactNode } from "react";

export interface ContentTabItem {
  id: string;
  label: string;
}

interface ContentTabProps {
  items: ContentTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  endSlot?: ReactNode;
}

export function ContentTab({
  items,
  activeId,
  onChange,
  className,
  endSlot,
}: ContentTabProps) {
  return (
    <div
      style={{ borderRadius: "8px" }}
      className={`w-full max-w-full min-w-0 rounded-lg overflow-hidden bg-(--surface) border border-(--separator) px-5 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 overflow-x-auto">
          {items.map((item) => {
            const isActive = item.id === activeId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`text-base py-4 border-b-[3px] transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-(--accent) border-(--accent) font-medium"
                    : "text-(--foreground) border-transparent hover:text-(--accent)"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {endSlot ? <div className="shrink-0">{endSlot}</div> : null}
      </div>
    </div>
  );
}
