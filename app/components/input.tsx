"use client";

import { forwardRef, useId } from "react";

type InputState = "default" | "error" | "success";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  errorMessage?: string;
  inputClassName?: string;
  containerClassName?: string;
  state?: InputState;
}

const stateClassMap: Record<InputState, string> = {
  default: "border-default-300 focus:border-default-500",
  error: "border-red-400 focus:border-red-500",
  success: "border-green-400 focus:border-green-500",
};

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
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasError = Boolean(errorMessage);
  const activeState: InputState = hasError ? "error" : state;

  return (
    <div className={`w-full ${containerClassName ?? ""}`}>
      {label ? (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-(--foreground)">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        ref={ref}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hint || errorMessage ? `${inputId}-message` : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-(--foreground) outline-none transition-colors ${
          stateClassMap[activeState]
        } ${disabled ? "cursor-not-allowed opacity-60" : ""} ${inputClassName ?? ""} ${className ?? ""}`}
        {...props}
      />

      {hint || errorMessage ? (
        <p id={`${inputId}-message`} className={`mt-1 text-xs ${hasError ? "text-red-500" : "text-default-500"}`}>
          {errorMessage ?? hint}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";

export default Input;