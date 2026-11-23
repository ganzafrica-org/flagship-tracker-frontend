import { useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Link, useNavigate } from "react-router";

import AppInput from "~/components/input";
import { AuthShell } from "~/components/auth/auth-shell";
import { login, storeUser, storeAccessToken, storeRefreshToken, getRoleHomePath, AuthError, hasValidSession, getStoredUser } from "~/lib/auth";
import AuthLoading from "~/components/auth/auth-loading";

import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login | Flagship Tracker" }];
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signedIn = hasValidSession() && getStoredUser();

  useEffect(() => {
    const user = getStoredUser();
    if (hasValidSession() && user) {
      navigate(getRoleHomePath(user.role), { replace: true });
    }
  }, [navigate]);

  if (signedIn) return <AuthLoading />;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      storeUser(result.user);
      storeAccessToken(result.accessToken);
      if (result.refreshToken) storeRefreshToken(result.refreshToken);

      if (result.user.mustChangePassword) {
        // Store email so change-password page knows who it's for
        sessionStorage.setItem("mcp_email", result.user.email);
        navigate("/login/change-password", { replace: true });
      } else {
        navigate(getRoleHomePath(result.user.role), { replace: true });
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

  return (
    <AuthShell title="Welcome Back" description="Log in to access your dashboard">
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
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

        <AppInput
          label="Password"
          type="password"
          variant="form"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
              {isPending ? "Logging in..." : "Login"}
            </>
          )}
        </Button>

        {error && <p className="text-center text-sm font-medium text-red-500">{error}</p>}
      </form>

      <Link
        to="/login/forgot-password"
        viewTransition
        className="mt-2 self-center text-sm font-medium text-[color:var(--accent)] transition hover:opacity-80"
      >
        Forgot the password?
      </Link>
    </AuthShell>
  );
}
