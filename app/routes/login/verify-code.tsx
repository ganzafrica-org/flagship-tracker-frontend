import { useEffect, useMemo, useState } from "react";
import { Button, InputOTP, Label, REGEXP_ONLY_DIGITS } from "@heroui/react";
import { Link, useNavigate } from "react-router";

import { AuthShell } from "~/components/auth/auth-shell";
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

  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
        <div className="flex flex-col items-center gap-2">
          <Label className="text-sm font-semibold text-neutral-800">
            Enter The Code <span className="text-red-500">*</span>
          </Label>
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            pattern={REGEXP_ONLY_DIGITS}
            isInvalid={Boolean(errorMessage)}
          >
            <InputOTP.Group>
              <InputOTP.Slot index={0} />
              <InputOTP.Slot index={1} />
              <InputOTP.Slot index={2} />
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              <InputOTP.Slot index={3} />
              <InputOTP.Slot index={4} />
              <InputOTP.Slot index={5} />
            </InputOTP.Group>
          </InputOTP>
          <p className="text-xs text-neutral-500">Demo code: 123456</p>
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
        <Link to="/login" viewTransition className="font-medium text-[color:var(--accent)] transition hover:opacity-80">
          Login?
        </Link>
      </p>
    </AuthShell>
  );
}
