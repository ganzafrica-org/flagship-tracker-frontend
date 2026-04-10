export interface ContentTabItem {
  id: string;
  label: string;
}

interface ContentTabProps {
  items: ContentTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function ContentTab({
  items,
  activeId,
  onChange,
  className,
}: ContentTabProps) {
  return (
    <div
      style={{ borderRadius: "8px" }}
      className={`w-full max-w-full min-w-0 rounded-lg overflow-hidden bg-(--surface) border border-(--separator) px-5 ${className ?? ""}`}
    >
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
    </div>
  );
}
