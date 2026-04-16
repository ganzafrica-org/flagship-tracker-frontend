import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router";

import AppInput from "~/components/input";
import { findDemoUser, getRoleHomePath, getStoredDemoUser, storeDemoUser } from "~/lib/demo-auth";
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
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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
            onChange={(event) => setEmail(event.target.value)}
            containerClassName="w-full"
            inputClassName="h-[34px] rounded-[4px] border-default-200 bg-white px-3 py-1 text-sm placeholder:text-neutral-200 focus:border-[color:var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <AppInput
              type={showPassword ? "text" : "password"}
              variant="form"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              containerClassName="w-full"
              inputClassName="h-[34px] rounded-[4px] border-default-200 bg-white px-3 py-1 pr-10 text-sm placeholder:text-neutral-200 focus:border-[color:var(--accent)]"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-500 transition hover:text-[color:var(--accent)]"
            >
              {showPassword ? <IconEyeOff size={15} stroke={1.8} /> : <IconEye size={15} stroke={1.8} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-2 h-[36px] w-full rounded-[4px] bg-(--accent) text-sm font-semibold text-white shadow-none hover:opacity-95"
        >
          Login
        </Button>

        {errorMessage ? <p className="text-sm font-medium text-red-500">{errorMessage}</p> : null}
      </form>

      <Link to="/login/forgot-password" className="mt-5 self-center text-sm font-medium text-[color:var(--accent)] transition hover:opacity-80">
        Forgot the password?
      </Link>
    </AuthShell>
  );
}
