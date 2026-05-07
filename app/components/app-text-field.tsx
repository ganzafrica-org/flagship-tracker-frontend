import { FieldError, Input, Label, TextField } from "@heroui/react";

type AppTextFieldType = "text" | "email" | "tel" | "url" | "search" | "password" | "number" | "date";

interface AppTextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: AppTextFieldType;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  inputMode?: "text" | "decimal" | "numeric" | "email" | "tel" | "url" | "search" | "none";
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  errorMessage?: string;
  autoComplete?: string;
}

export default function AppTextField({
  name,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  isRequired = false,
  isDisabled = false,
  className = "w-full",
  inputMode,
  min,
  max,
  step,
  description,
  errorMessage,
  autoComplete,
}: AppTextFieldProps) {
  return (
    <TextField
      name={name}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={className}
      value={value ?? ""}
      onChange={onChange}
      type={type as never}
    >
      <Label>{label}</Label>
      <Input
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
      />
      {description ? (
        <p className="mt-1 text-xs text-(--foreground-500)">{description}</p>
      ) : null}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  );
}
