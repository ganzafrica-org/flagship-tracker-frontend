import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router";

import AppInput from "~/components/input";
import { DEMO_USERS, findDemoUser, getRoleHomePath, getStoredDemoUser, storeDemoUser } from "~/lib/demo-auth";
import { AuthShell } from "~/components/auth/auth-shell";

import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login | Flagship Tracker" }];
}

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedUser = getStoredDemoUser();
    if (storedUser) {
      navigate(getRoleHomePath(storedUser.role), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const user = findDemoUser(email, password);
    if (!user) {
      setErrorMessage("Invalid email or password. Use one of the demo accounts.");
      return;
    }

    storeDemoUser(user);
    setErrorMessage("");
    navigate(getRoleHomePath(user.role));
  };

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
          onChange={(event) => setEmail(event.target.value)}
        />

        <div className="relative">
          <AppInput
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="form"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            inputClassName="pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute bottom-0 right-0 flex h-[34px] w-10 items-center justify-center text-neutral-500 transition hover:text-[color:var(--accent)]"
          >
            {showPassword ? <IconEyeOff size={15} stroke={1.8} /> : <IconEye size={15} stroke={1.8} />}
          </button>
        </div>

        <Button
          type="submit"
          className="mt-2 h-[36px] w-full rounded-[4px] bg-(--accent) text-sm font-semibold text-white shadow-none hover:opacity-95"
        >
          Login
        </Button>

        {errorMessage ? <p className="text-sm font-medium text-red-500">{errorMessage}</p> : null}
      </form>

      <div className="mt-3 rounded-[6px] border border-default-200 bg-neutral-50 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Demo accounts</p>
        <div className="grid grid-cols-3 gap-1">
          {DEMO_USERS.map((user) => (
            <button
              key={user.email}
              type="button"
              onClick={() => { setEmail(user.email); setPassword(user.password); }}
              className="flex flex-col rounded-[4px] px-2 py-1.5 text-left text-[11px] transition hover:bg-(--accent) hover:text-white"
            >
              <span className="font-medium">{user.name}</span>
              <span className="opacity-75">{user.role === "me" ? "M & E" : user.role === "admin" ? "Admin" : "Senior Official"}</span>
            </button>
          ))}
        </div>
      </div>

      <Link to="/login/forgot-password" viewTransition className="mt-3 self-center text-sm font-medium text-[color:var(--accent)] transition hover:opacity-80">
        Forgot the password?
      </Link>
    </AuthShell>
  );
}
