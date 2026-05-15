import { useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Link, useNavigate } from "react-router";

import AppInput from "~/components/input";
import { AuthShell } from "~/components/auth/auth-shell";
import { resetPassword, changePassword, getStoredUser, storeUser, getRoleHomePath, AuthError } from "~/lib/auth";

export function meta() {
  return [{ title: "Set New Password | Flagship Tracker" }];
}

type Flow = "reset" | "first-login";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [flow, setFlow] = useState<Flow | null>(null);
  const [resetToken, setResetToken] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("reset_token");
    const mcpEmail = sessionStorage.getItem("mcp_email");

    if (token) {
      setFlow("reset");
      setResetToken(token);
    } else if (mcpEmail) {
      setFlow("first-login");
    } else {
      // Nothing in session — send back to login
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!PASSWORD_PATTERN.test(newPassword)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, a digit, and a special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (flow === "reset") {
        await resetPassword(resetToken, newPassword);
        sessionStorage.removeItem("reset_token");
        navigate("/login", { replace: true, state: { passwordReset: true } });

      } else {
        // First-login forced change — user is already authenticated (cookie set on login)
        await changePassword(currentPassword, newPassword);
        sessionStorage.removeItem("mcp_email");

        // Update stored user so mustChangePassword is cleared
        const user = getStoredUser();
        if (user) storeUser({ ...user, mustChangePassword: false });

        navigate(getRoleHomePath(user!.role), { replace: true });
      }
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

  if (!flow) return null;

  return (
    <AuthShell
      title="Set New Password"
      description={
        flow === "first-login"
          ? "This is your first login. Please set a new password to continue."
          : "Enter your new password to complete the reset."
      }
    >
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        {flow === "first-login" && (
          <AppInput
            label="Current (Temporary) Password"
            type="password"
            variant="form"
            placeholder="Your temporary password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        )}

        <AppInput
          label="New Password"
          type="password"
          variant="form"
          placeholder="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <AppInput
          label="Confirm New Password"
          type="password"
          variant="form"
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <p className="text-xs text-neutral-500">
          Must be at least 8 characters with uppercase, lowercase, a number, and a special character.
        </p>

        <Button
          type="submit"
          isPending={loading}
          className="mt-2 h-[36px] w-full rounded-[4px] bg-(--accent) text-sm font-semibold text-white shadow-none hover:opacity-95"
        >
          {({ isPending }) => (
            <>
              {isPending && <Spinner color="current" size="sm" />}
              {isPending ? "Saving..." : "Set New Password"}
            </>
          )}
        </Button>

        {error && <p className="text-center text-sm font-medium text-red-500">{error}</p>}
      </form>

      {flow === "reset" && (
        <p className="mt-5 self-center text-sm text-neutral-700">
          Go back to{" "}
          <Link to="/login" viewTransition className="font-medium text-[color:var(--accent)] transition hover:opacity-80">
            Login
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
