import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { Link, useNavigate } from "react-router";

import AppInput from "~/components/input";
import { clearPasswordResetVerified, getVerifiedResetEmail } from "~/lib/demo-password-reset";
import { setPasswordOverride } from "~/lib/demo-auth";

import { AuthShell } from "~/components/auth/auth-shell";

export function meta() {
  return [{ title: "Reset Password | Flagship Tracker" }];
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const verifiedEmail = useMemo(() => getVerifiedResetEmail(), []);
  const [email] = useState(verifiedEmail ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!verifiedEmail) {
      setErrorMessage("Please verify the reset code first.");
    }
  }, [verifiedEmail]);

  return (
    <AuthShell title="Change The Password" description="Enter your new password and confirm it to continue">
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setErrorMessage("");
          setSuccessMessage("");

          if (!email.trim()) {
            setErrorMessage("Email is required.");
            return;
          }

          if (!newPassword) {
            setErrorMessage("New password is required.");
            return;
          }

          if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
          }

          setPasswordOverride(email, newPassword);
          clearPasswordResetVerified();
          setSuccessMessage("Password reset successfully. You can now log in.");
          setTimeout(() => navigate("/login"), 700);
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            New Password <span className="text-red-500">*</span>
          </label>
          <AppInput
            type="password"
            variant="form"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            containerClassName="w-full"
            inputClassName="h-[34px] rounded-[4px] border-default-200 bg-white px-3 py-1 text-sm placeholder:text-neutral-200 focus:border-[color:var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-800">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <AppInput
            type="password"
            variant="form"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            containerClassName="w-full"
            inputClassName="h-[34px] rounded-[4px] border-default-200 bg-white px-3 py-1 text-sm placeholder:text-neutral-200 focus:border-[color:var(--accent)]"
          />
        </div>

        <Button
          type="submit"
          className="mt-2 h-[36px] w-full rounded-[4px] bg-(--accent) text-sm font-semibold text-white shadow-none hover:opacity-95"
        >
          Change The Password
        </Button>

        {errorMessage ? <p className="text-sm font-medium text-red-500">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm font-medium text-green-600">{successMessage}</p> : null}
      </form>

      <p className="mt-5 self-center text-sm text-neutral-700">
        Go back to{" "}
        <Link to="/login" className="font-medium text-[color:var(--accent)] transition hover:opacity-80">
          Login?
        </Link>
      </p>
    </AuthShell>
  );
}
