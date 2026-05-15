import { useEffect, useState } from "react";
import { Button, InputOTP, Label, REGEXP_ONLY_DIGITS, Spinner } from "@heroui/react";
import { Link, useNavigate } from "react-router";

import { AuthShell } from "~/components/auth/auth-shell";
import { verifyCode, resendCode, AuthError } from "~/lib/auth";

export function meta() {
  return [{ title: "Verify Code | Flagship Tracker" }];
}

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("reset_email");
    if (!stored) {
      navigate("/login/forgot-password", { replace: true });
      return;
    }
    setEmail(stored);
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyCode(email, code);
      // Store the short-lived reset token for the change-password page
      sessionStorage.setItem("reset_token", result.resetToken);
      sessionStorage.removeItem("reset_email");
      navigate("/login/change-password", { viewTransition: true });
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendMessage("");
    setError("");
    setResendLoading(true);

    try {
      await resendCode(email);
      setResendMessage("A new code has been sent to your email.");
      setCode("");
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthShell
      title="Enter Verification Code"
      description={email ? `We sent a 6-digit code to ${email}` : "Enter the code sent to your email"}
    >
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col items-center gap-2">
          <Label className="text-sm font-semibold text-neutral-800">
            Enter The Code <span className="text-red-500">*</span>
          </Label>
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            pattern={REGEXP_ONLY_DIGITS}
            isInvalid={Boolean(error)}
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
        </div>

        <Button
          type="submit"
          isPending={loading}
          className="mt-2 h-[36px] w-full rounded-[4px] bg-(--accent) text-sm font-semibold text-white shadow-none hover:opacity-95"
        >
          {({ isPending }) => (
            <>
              {isPending && <Spinner color="current" size="sm" />}
              {isPending ? "Verifying..." : "Verify Code"}
            </>
          )}
        </Button>

        {error && <p className="text-center text-sm font-medium text-red-500">{error}</p>}
        {resendMessage && <p className="text-center text-sm font-medium text-green-600">{resendMessage}</p>}
      </form>

      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-sm text-neutral-600">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="font-medium text-[color:var(--accent)] transition hover:opacity-80 disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend code"}
          </button>
        </p>

        <p className="text-sm text-neutral-700">
          Go back to{" "}
          <Link to="/login" viewTransition className="font-medium text-[color:var(--accent)] transition hover:opacity-80">
            Login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
