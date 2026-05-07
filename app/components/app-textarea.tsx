import { FieldError, Label, TextArea, TextField } from "@heroui/react";

interface AppTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  rows?: number;
  description?: string;
  errorMessage?: string;
}

export default function AppTextarea({
  name,
  label,
  placeholder,
  value,
  onChange,
  isRequired = false,
  isDisabled = false,
  className = "w-full",
  rows = 4,
  description,
  errorMessage,
}: AppTextareaProps) {
  return (
    <TextField
      name={name}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={className}
      value={value ?? ""}
      onChange={onChange}
    >
      <Label>{label}</Label>
      <TextArea placeholder={placeholder} rows={rows} />
      {description ? (
        <p className="mt-1 text-xs text-(--foreground-500)">{description}</p>
      ) : null}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  );
}
