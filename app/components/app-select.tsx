import { FieldError, Label, ListBox, Select } from "@heroui/react";

export interface AppSelectOption {
  label: string;
  value: string;
  /** Shorter text shown in the closed trigger; list items still use `label`. */
  displayLabel?: string;
}

export const NO_DATA_OPTIONS: AppSelectOption[] = [{ label: "No data", value: "" }];

function resolveSelectionKey(key: "all" | Set<string | number> | string | number | null): string {
  if (key == null) return "";
  if (key === "all") return "all";
  if (key instanceof Set) {
    const first = Array.from(key)[0];
    return first == null ? "" : String(first);
  }
  return String(key);
}

function toSelectId(name: string, value: string) {
  return `${name}:${value}`;
}

function fromSelectId(name: string, id: string) {
  const prefix = `${name}:`;
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

interface AppSelectProps {
  name: string;
  label: string;
  placeholder?: string;
  options: AppSelectOption[];
  selectedKey: string;
  onSelectionChange: (value: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  description?: string;
  errorMessage?: string;
  /** Keeps wide option lists aligned with the trigger instead of centering into the sidebar. */
  popoverPlacement?: "bottom" | "bottom start" | "bottom end";
}

export default function AppSelect({
  name,
  label,
  placeholder = "Select an option",
  options,
  selectedKey,
  onSelectionChange,
  isRequired = false,
  isDisabled = false,
  className = "w-full min-w-0",
  description,
  errorMessage,
  popoverPlacement = "bottom start",
}: AppSelectProps) {
  const normalizedKey = selectedKey || "all";
  const selectedSelectId = toSelectId(name, normalizedKey);

  const selectedOption =
    options.find((item) => item.value === normalizedKey) ??
    options.find(
      (item) =>
        normalizedKey &&
        normalizedKey !== "all" &&
        item.value.localeCompare(normalizedKey, undefined, { sensitivity: "accent" }) === 0,
    );

  const triggerText = selectedOption?.displayLabel ?? selectedOption?.label ?? placeholder;

  return (
    <Select
      name={name}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={className}
      placeholder={placeholder}
      selectedKey={selectedSelectId}
      onSelectionChange={(key) =>
        onSelectionChange(fromSelectId(name, resolveSelectionKey(key)))
      }
    >
      <Label>{label}</Label>
      <Select.Trigger className="min-w-0 w-full">
        <span className="min-w-0 flex-1 truncate text-left text-sm" title={selectedOption?.label}>
          {triggerText}
        </span>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover placement={popoverPlacement} containerPadding={24}>
        <ListBox>
          {options.map((item) => (
            <ListBox.Item
              key={toSelectId(name, item.value)}
              id={toSelectId(name, item.value)}
              textValue={item.label}
            >
              {item.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      {description ? (
        <p className="mt-1 text-xs text-(--foreground-500)">{description}</p>
      ) : null}
      <FieldError>{errorMessage}</FieldError>
    </Select>
  );
}
