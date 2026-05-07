import { FieldError, Label, ListBox, Select } from "@heroui/react";

export interface AppSelectOption {
  label: string;
  value: string;
}

export const NO_DATA_OPTIONS: AppSelectOption[] = [{ label: "No data", value: "" }];

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
  className = "w-full",
  description,
  errorMessage,
}: AppSelectProps) {
  return (
    <Select
      name={name}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={className}
      placeholder={placeholder}
      selectedKey={selectedKey || null}
      onSelectionChange={(key) => onSelectionChange((key as string) ?? "")}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((item) => (
            <ListBox.Item key={item.value} id={item.value} textValue={item.label}>
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
