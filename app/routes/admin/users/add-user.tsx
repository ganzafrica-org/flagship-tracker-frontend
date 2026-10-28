import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageTitleCard } from "~/components/page-title-card";
import AppTextField from "~/components/app-text-field";
import AppSelect from "~/components/app-select";
import AppAlert, { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { redirectLegacyView } from "~/lib/legacy-view-redirect";
import { USER_ROLE_OPTIONS, type CreateUserRequest, type UserRole } from "~/lib/queries/users";

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

  const mutation = useMutation({
    mutationFn: (body: CreateUserRequest) => api.post("/api/users", body),
    onSuccess: () => {
      toast.success("User created — a welcome email is being sent");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("/admin/users");
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
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

  return (
    <div className="space-y-6">
      <PageTitleCard title="Add a New User" />

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
          <Button variant="outline" className="!rounded-3xl" onPress={() => navigate("/admin/users")}>
            Cancel
          </Button>
          <Button variant="primary" className="!rounded-3xl" onPress={handleSubmit} isPending={mutation.isPending}>
            Create User
          </Button>
        </div>
      </Card>
    </div>
  );
}
