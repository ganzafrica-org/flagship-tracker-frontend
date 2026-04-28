import { useState } from "react";
import { Button } from "@heroui/react";
import { Link, useNavigate } from "react-router";

import AppInput from "~/components/input";
import { requestPasswordReset } from "~/lib/demo-password-reset";

import { AuthShell } from "~/components/auth/auth-shell";

export function meta() {
  return [{ title: "Forgot Password | Flagship Tracker" }];
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submittedFor, setSubmittedFor] = useState<string | null>(null);

  return (
    <AuthShell
      title="Forgot the Password"
      description="Please enter your email so we can send you a code to verify"
    >
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const { email: normalizedEmail } = requestPasswordReset(email);
          setSubmittedFor(normalizedEmail);
          navigate("/login/verify-code");
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            Email <span className="text-red-500">*</span>
          </label>
          <AppInput
            type="email"
            variant="form"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            containerClassName="w-full"
            inputClassName="h-[34px] rounded-[4px] border-default-200 bg-white px-3 py-1 text-sm placeholder:text-neutral-200 focus:border-[color:var(--accent)]"
          />
        </div>

        <Button
          type="submit"
          className="mt-2 h-[36px] w-full rounded-[4px] bg-(--accent) text-sm font-semibold text-white shadow-none hover:opacity-95"
        >
          Submit
        </Button>
      </form>

      {submittedFor ? (
        <p className="mt-4 text-sm text-neutral-600">
          Demo: code sent to <span className="font-semibold">{submittedFor}</span>. Use <span className="font-semibold">123456</span>.
        </p>
      ) : null}

      <p className="mt-5 self-center text-sm text-neutral-700">
        Go back to{" "}
        <Link to="/login" className="font-medium text-[color:var(--accent)] transition hover:opacity-80">
          Login?
        </Link>
      </p>
    </AuthShell>
  );
}
