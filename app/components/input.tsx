import { forwardRef, useId } from "react";
import { TextField, Input as HeroInput, Label, FieldError, Description } from "@heroui/react";

type InputState = "default" | "error" | "success";
type InputVariant = "default" | "form";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  errorMessage?: string;
  inputClassName?: string;
  containerClassName?: string;
  state?: InputState;
  variant?: InputVariant;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    errorMessage,
    className,
    inputClassName,
    containerClassName,
    state = "default",
    variant = "default",
    disabled,
    ...props
  },
  ref,
) {
  const hasError = Boolean(errorMessage);

  return (
    <TextField
      id={id}
      isDisabled={disabled}
      isInvalid={hasError}
      className={`flex flex-col w-full overflow-visible ${containerClassName ?? ""}`}
    >
      {label ? (
        <Label className="mb-2 block text-sm font-semibold text-neutral-800">
          {label}
        </Label>
      ) : null}

      <HeroInput
        ref={ref}
        className={`app-input app-input--${variant}${hasError ? " app-input--error" : state !== "default" ? ` app-input--${state}` : ""} ${inputClassName ?? ""} ${className ?? ""}`}
        {...props}
      />

      {errorMessage ? (
        <FieldError className="mt-1 text-xs text-red-500">{errorMessage}</FieldError>
      ) : hint ? (
        <Description className="mt-1 text-xs text-default-500">{hint}</Description>
      ) : null}
    </TextField>
  );
});

Input.displayName = "Input";

export default Input;