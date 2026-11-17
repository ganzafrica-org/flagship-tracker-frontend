import { Link } from "react-router";

import { AuthShell } from "~/components/auth/auth-shell";

export function meta() {
  return [{ title: "Forgot Password | Flagship Tracker" }];
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot the Password"
      description="Ask an administrator to reset your password. They will give you a temporary password, and you will choose a new one the next time you sign in."
    >
      <p className="mt-8 self-center text-sm text-neutral-700">
        Go back to{" "}
        <Link to="/login" viewTransition className="font-medium text-[color:var(--accent)] transition hover:opacity-80">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
