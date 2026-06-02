import { useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router";

import AppInput from "~/components/input";
import { AuthShell } from "~/components/auth/auth-shell";
import { login, storeUser, storeAccessToken, getRoleHomePath, AuthError, hasValidSession, getStoredUser } from "~/lib/auth";

import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login | Flagship Tracker" }];
}

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (hasValidSession() && user) {
      navigate(getRoleHomePath(user.role), { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      storeUser(result.user);
      storeAccessToken(result.accessToken);

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
      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
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

        <div className="relative">
          <AppInput
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="form"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputClassName="pr-10"
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute bottom-0 right-0 flex h-[34px] w-10 items-center justify-center text-neutral-500 transition hover:text-[color:var(--accent)]"
          >
            {showPassword ? <IconEyeOff size={15} stroke={1.8} /> : <IconEye size={15} stroke={1.8} />}
          </button>
        </div>

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
        className="mt-3 self-center text-sm font-medium text-[color:var(--accent)] transition hover:opacity-80"
      >
        Forgot the password?
      </Link>
    </AuthShell>
  );
}
