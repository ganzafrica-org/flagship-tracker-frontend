import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { Link, useNavigate } from "react-router";

import { AuthShell } from "~/components/auth/auth-shell";
import AppInput from "~/components/input";
import {
  getLatestPasswordReset,
  markPasswordResetVerified,
  verifyPasswordResetCode,
} from "~/lib/demo-password-reset";

export function meta() {
  return [{ title: "Verify Code | Flagship Tracker" }];
}

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const record = useMemo(() => getLatestPasswordReset(), []);

  const [codeDigits, setCodeDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [errorMessage, setErrorMessage] = useState("");

  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const code = codeDigits.join("");

  useEffect(() => {
    if (!record) {
      setErrorMessage("Please request a reset code first.");
    }
  }, [record]);

  return (
    <AuthShell
      title="Forgot the Password"
      description={
        record?.email
          ? `Please enter the code that you received from email ${record.email}`
          : "Please enter the code that you received from email"
      }
    >
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setErrorMessage("");

          if (code.length !== 6) {
            setErrorMessage("Enter the 6-digit code.");
            return;
          }

          if (!record?.email || !verifyPasswordResetCode(record.email, code)) {
            setErrorMessage("Invalid code. For demo, use 123456.");
            return;
          }

          markPasswordResetVerified(record.email);
          navigate("/login/change-password");
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            Enter The Code <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {codeDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  refs.current[idx] = el;
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const nextDigit = e.target.value.replace(/\D/g, "").slice(-1);
                  setCodeDigits((prev) => {
                    const next = [...prev];
                    next[idx] = nextDigit;
                    return next;
                  });
                  if (nextDigit && idx < 5) {
                    refs.current[idx + 1]?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
                    refs.current[idx - 1]?.focus();
                  }
                }}
                className="h-[34px] w-10 rounded-[4px] border border-default-200 bg-white text-center text-sm text-(--foreground) outline-none transition-colors focus:border-[color:var(--accent)]"
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">Demo code: 123456</p>
        </div>

        <Button
          type="submit"
          className="mt-2 h-[36px] w-full rounded-[4px] bg-(--accent) text-sm font-semibold text-white shadow-none hover:opacity-95"
        >
          Submit
        </Button>

        {errorMessage ? <p className="text-sm font-medium text-red-500">{errorMessage}</p> : null}
      </form>

      <p className="mt-5 self-center text-sm text-neutral-700">
        Go back to{" "}
        <Link to="/login" className="font-medium text-[color:var(--accent)] transition hover:opacity-80">
          Login?
        </Link>
      </p>
    </AuthShell>
  );
}

