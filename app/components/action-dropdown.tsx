import { useRef } from "react";
import type React from "react";
import { Button, Dropdown, Label } from "@heroui/react";
import { IconDots } from "@tabler/icons-react";

export interface ActionItem {
  label: string;
  onClick: () => void;
  color?: "default" | "danger";
  icon?: React.ReactNode;
}

interface ActionDropdownProps {
  actions: ActionItem[];
}

// The row button whose menu last ran an action. A dialog opened from that menu hands focus
// back to it on close, since the menu item that opened the dialog no longer exists.
let lastActionTrigger: HTMLElement | null = null;

export function restoreActionFocus() {
  const el = lastActionTrigger;
  lastActionTrigger = null;
  if (el?.isConnected) requestAnimationFrame(() => el.focus());
}

export default function ActionDropdown({ actions }: ActionDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <Dropdown>
      <Button ref={triggerRef} isIconOnly size="sm" variant="ghost" aria-label="Actions">
        <IconDots size={16} />
      </Button>
      <Dropdown.Popover className="min-w-max">
        <Dropdown.Menu
          onAction={(key) => {
            lastActionTrigger = triggerRef.current;
            actions.find((a) => a.label === key)?.onClick();
          }}
        >
          {actions.map((action) => (
            <Dropdown.Item
              key={action.label}
              id={action.label}
              textValue={action.label}
              variant={action.color === "danger" ? "danger" : undefined}
            >
              {action.icon ? <span className={`shrink-0 ${action.color === "danger" ? "text-danger" : ""}`}>{action.icon}</span> : null}
              <Label>{action.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
