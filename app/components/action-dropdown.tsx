import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@heroui/react";

const ellipsisIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 8c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2zm0 2c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm0 6c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z" />
  </svg>
);

interface ActionItem {
  label: string;
  onClick: () => void;
  color?: "default" | "danger";
}

interface ActionDropdownProps {
  actions: ActionItem[];
}

export default function ActionDropdown({ actions }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMenuPosition({
        top: rect.bottom + 6,
        left: Math.max(8, rect.right - 160),
      });
    };

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && wrapperRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <Button isIconOnly size="sm" variant="ghost" onPress={() => setIsOpen(!isOpen)} className="h-8 min-w-fit w-8">
        {ellipsisIcon()}
      </Button>

      {isOpen
        ? createPortal(
            <div
              className="fixed z-[9999] w-40 rounded-lg border border-gray-200 bg-white shadow-lg"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="py-1">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                      action.color === "danger" ? "text-red-600 hover:bg-red-50" : ""
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
