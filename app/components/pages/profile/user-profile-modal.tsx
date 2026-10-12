import { useEffect, useState } from "react";
import { Avatar, Button, Modal } from "@heroui/react";
import { IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AppTextField from "~/components/app-text-field";
import AppAlert, { toast } from "~/components/app-alert";
import { ApiError } from "~/lib/api";
import { AuthError, changePassword, getStoredUser, storeUser } from "~/lib/auth";
import { profileQueryOptions, updateProfile } from "~/lib/queries/profile";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SENIOR: "Senior Official",
  MONITORING_OFFICER: "Monitoring Officer",
};

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

interface UserProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function UserProfileModal({ isOpen, onOpenChange }: UserProfileModalProps) {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    ...profileQueryOptions,
    enabled: isOpen,
  });

  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
    }
  }, [profile]);

  useEffect(() => {
    if (!isOpen) {
      setFullNameError(undefined);
      setSubmitError(null);
      setPasswordError(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = fullName.trim();
      const wantsPasswordChange =
        currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

      if (wantsPasswordChange) {
        if (!PASSWORD_PATTERN.test(newPassword)) {
          throw new Error(
            "Password must be at least 8 characters and include uppercase, lowercase, a digit, and a special character.",
          );
        }
        if (newPassword !== confirmPassword) {
          throw new Error("New passwords do not match.");
        }
        if (!currentPassword) {
          throw new Error("Enter your current password to change it.");
        }
        await changePassword(currentPassword, newPassword);
      }

      if (profile && trimmedName !== profile.fullName) {
        return updateProfile({ fullName: trimmedName });
      }

      return profile ?? refetch().then((result) => result.data!);
    },
    onSuccess: (updated) => {
      if (updated) {
        const stored = getStoredUser();
        if (stored) {
          storeUser({
            ...stored,
            fullName: updated.fullName,
            mustChangePassword: updated.mustChangePassword,
          });
        }
      }
      void queryClient.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
      toast.success("Profile saved");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      const message = err instanceof ApiError || err instanceof AuthError
        ? err.message
        : err.message || "Failed to save profile.";
      if (message.toLowerCase().includes("password")) {
        setPasswordError(message);
      } else {
        setSubmitError(message);
      }
    },
  });

  function handleClose() {
    onOpenChange(false);
  }

  function handleSave() {
    setSubmitError(null);
    setPasswordError(null);

    if (!fullName.trim()) {
      setFullNameError("Full name is required");
      return;
    }

    saveMutation.mutate();
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <div className="flex items-center justify-between bg-(--accent) px-5 py-4 text-(--accent-foreground)">
            <h2 className="text-lg font-bold tracking-tight">My Profile</h2>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
              aria-label="Close profile"
            >
              <IconX size={18} />
            </button>
          </div>

          <Modal.Body className="overflow-y-auto px-5 py-5 space-y-5">
            {isLoading ? (
              <p className="text-sm text-(--muted-foreground) py-8 text-center">Loading profile...</p>
            ) : isError || !profile ? (
              <p className="text-sm text-(--danger) py-8 text-center">
                {error instanceof Error ? error.message : "Failed to load profile."}
              </p>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 pb-2">
                  <Avatar size="lg" className="h-20 w-20">
                    <Avatar.Fallback className="text-lg font-semibold bg-(--muted) text-(--foreground)">
                      {initialsFromName(profile.fullName)}
                    </Avatar.Fallback>
                  </Avatar>
                  <p className="text-base font-semibold text-(--foreground)">{profile.fullName}</p>
                  <p className="text-sm text-(--muted-foreground)">{ROLE_LABELS[profile.role] ?? profile.role}</p>
                </div>

                {submitError ? <AppAlert status="danger" message={submitError} /> : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <AppTextField
                    name="fullName"
                    label="Full Name"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(value) => {
                      setFullName(value);
                      setFullNameError(undefined);
                    }}
                    isRequired
                    errorMessage={fullNameError}
                  />
                  <AppTextField
                    name="email"
                    label="Email"
                    value={profile.email}
                    onChange={() => {}}
                    isDisabled
                  />
                  <AppTextField
                    name="role"
                    label="Role"
                    value={ROLE_LABELS[profile.role] ?? profile.role}
                    onChange={() => {}}
                    isDisabled
                    className="sm:col-span-2"
                  />
                </div>

                <div className="border-t border-(--separator) pt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-(--accent) uppercase tracking-wide">
                      Change Password
                    </h3>
                    <p className="text-xs text-(--muted-foreground) mt-1">
                      Leave blank if you only want to update your name.
                    </p>
                  </div>

                  {passwordError ? <AppAlert status="danger" message={passwordError} /> : null}

                  <AppTextField
                    name="currentPassword"
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AppTextField
                      name="newPassword"
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={setNewPassword}
                    />
                    <AppTextField
                      name="confirmPassword"
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                    />
                  </div>
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer className="flex justify-end gap-3 border-t border-(--separator) px-5 py-4">
            <Button
              variant="outline"
              className="!rounded-3xl border-(--border) text-(--foreground) bg-(--surface)"
              onPress={handleClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              className="!rounded-3xl"
              onPress={handleSave}
              isPending={saveMutation.isPending}
              isDisabled={isLoading || isError || !profile}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
