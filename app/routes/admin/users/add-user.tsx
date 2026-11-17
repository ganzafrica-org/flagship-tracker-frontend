import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { IconLoader2 } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageTitleCard } from "~/components/page-title-card";
import AppTextField from "~/components/app-text-field";
import AppSelect from "~/components/app-select";
import AppAlert, { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { redirectLegacyView } from "~/lib/legacy-view-redirect";
import { USER_ROLE_OPTIONS, type CreatedUserResponse, type CreateUserRequest, type UserRole } from "~/lib/queries/users";

// Viewing a user is a dialog on the users list now; old `?editId=N` links land there.
export function clientLoader({ request }: { request: Request }) {
  return redirectLegacyView(request, "/admin/users", { always: true });
}

export function meta() {
  return [{ title: "Add User | Admin" }];
}

interface FormState {
  email: string;
  fullName: string;
  role: string;
}

const EMPTY: FormState = { email: "", fullName: "", role: "" };

export default function AdminAddUserPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [issued, setIssued] = useState<CreatedUserResponse | null>(null);

  const mutation = useMutation({
    mutationFn: (body: CreateUserRequest) => api.post<CreatedUserResponse>("/api/users", body),
    onSuccess: (created) => {
      setIssued(created);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setApiError(message);
      toast.error(message);
    },
  });

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.role) next.role = "Role is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setApiError(null);
    if (!validate()) return;
    mutation.mutate({
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      role: form.role as UserRole,
    });
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success("Copied");
  }

  return (
    <div className="space-y-6">
      <PageTitleCard title="Add a New User" />

      {issued ? (
        <Card className="max-w-2xl space-y-4 p-6">
          <AppAlert
            status="success"
            title="User created"
            message="No email was sent. Copy the username and temporary password and give them to this person. They must change the password the first time they log in."
          />
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-(--field-tile) px-3.5 py-2.5">
              <dt className="text-[11px] text-(--field-tile-label)">Username</dt>
              <dd className="mt-0.5 text-sm font-medium">{issued.username}</dd>
            </div>
            <div className="rounded-lg bg-(--field-tile) px-3.5 py-2.5">
              <dt className="text-[11px] text-(--field-tile-label)">Temporary password</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium">{issued.temporaryPassword}</dd>
            </div>
          </dl>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="!rounded-3xl" onPress={() => void copyValue(`${issued.username}\n${issued.temporaryPassword}`)}>
              Copy both
            </Button>
            <Button variant="primary" className="!rounded-3xl" onPress={() => navigate("/admin/users")}>
              Done
            </Button>
          </div>
        </Card>
      ) : null}

      {!issued ? (
      <Card className="space-y-4 p-6 max-w-2xl">
        {apiError ? <AppAlert status="danger" message={apiError} /> : null}

        <AppTextField
          name="fullName"
          label="Full Name"
          placeholder="Full name"
          value={form.fullName}
          onChange={(v) => {
            setForm((f) => ({ ...f, fullName: v }));
            setErrors((e) => ({ ...e, fullName: undefined }));
          }}
          isRequired
          errorMessage={errors.fullName}
        />

        <AppTextField
          name="email"
          label="Email"
          type="email"
          placeholder="user@example.com"
          value={form.email}
          onChange={(v) => {
            setForm((f) => ({ ...f, email: v }));
            setErrors((e) => ({ ...e, email: undefined }));
          }}
          isRequired
          errorMessage={errors.email}
        />

        <AppSelect
          name="role"
          label="Role"
          placeholder="Select a role"
          options={USER_ROLE_OPTIONS}
          selectedKey={form.role}
          onSelectionChange={(v) => {
            setForm((f) => ({ ...f, role: v }));
            setErrors((e) => ({ ...e, role: undefined }));
          }}
          isRequired
          errorMessage={errors.role}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" className="!rounded-3xl" onPress={() => navigate("/admin/users")} isDisabled={mutation.isPending}>
            Cancel
          </Button>
          <Button variant="primary" className="!rounded-3xl" onPress={handleSubmit} isPending={mutation.isPending}>
            {({ isPending }) => (
              <span className="inline-flex items-center gap-2">
                {isPending ? <IconLoader2 size={16} className="animate-spin" /> : null}
                {isPending ? "Creating user…" : "Create User"}
              </span>
            )}
          </Button>
        </div>
      </Card>
      ) : null}
    </div>
  );
}
