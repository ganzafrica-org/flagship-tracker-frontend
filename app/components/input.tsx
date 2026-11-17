import { forwardRef, useState } from "react";
import { TextField, Input as HeroInput, Label, FieldError, Description } from "@heroui/react";

import { PasswordVisibilityButton } from "~/components/password-visibility";

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
    type,
    ...props
  },
  ref,
) {
  const hasError = Boolean(errorMessage);
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

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

      <div className="relative">
        <HeroInput
          ref={ref}
          type={isPassword && visible ? "text" : type}
          className={`app-input app-input--${variant}${hasError ? " app-input--error" : state !== "default" ? ` app-input--${state}` : ""} ${isPassword ? "pr-10" : ""} ${inputClassName ?? ""} ${className ?? ""}`}
          {...props}
        />
        {isPassword ? (
          <PasswordVisibilityButton visible={visible} onToggle={() => setVisible((value) => !value)} />
        ) : null}
      </div>

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