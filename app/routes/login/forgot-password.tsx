import { useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Link, useNavigate } from "react-router";

import AppInput from "~/components/input";
import { AuthShell } from "~/components/auth/auth-shell";
import { forgotPassword, AuthError } from "~/lib/auth";

export function meta() {
  return [{ title: "Forgot Password | Flagship Tracker" }];
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPassword(email);
      // Store email so verify-code page knows which address received the code
      sessionStorage.setItem("reset_email", email.trim().toLowerCase());
      navigate("/login/verify-code", { viewTransition: true });
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

  return (
    <AuthShell
      title="Forgot the Password"
      description="Enter your email and we'll send you a 6-digit code to reset your password"
    >
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <AppInput
          label="Email"
          type="email"
          variant="form"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button
          type="submit"
          isPending={loading}
          className="mt-2 h-[36px] w-full rounded-[4px] bg-(--accent) text-sm font-semibold text-white shadow-none hover:opacity-95"
        >
          {({ isPending }) => (
            <>
              {isPending && <Spinner color="current" size="sm" />}
              {isPending ? "Sending..." : "Send Code"}
            </>
          )}
        </Button>

        {error && <p className="text-center text-sm font-medium text-red-500">{error}</p>}
      </form>

      <p className="mt-5 self-center text-sm text-neutral-700">
        Go back to{" "}
        <Link to="/login" viewTransition className="font-medium text-[color:var(--accent)] transition hover:opacity-80">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
