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

export default function ActionDropdown({ actions }: ActionDropdownProps) {
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Actions">
        <IconDots size={16} />
      </Button>
      <Dropdown.Popover className="min-w-max">
        <Dropdown.Menu onAction={(key) => actions.find((a) => a.label === key)?.onClick()}>
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
