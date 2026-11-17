import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";
import { IconUpload } from "@tabler/icons-react";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppModal from "~/components/app-modal";
import AppTextField from "~/components/app-text-field";
import AppSelect from "~/components/app-select";
import AppAlert, { toast } from "~/components/app-alert";
import RecordDetailsDialog from "~/components/record-details-dialog";
import { ApiError } from "~/lib/api";
import { getStoredUser } from "~/lib/auth";
import { useUserRecord } from "~/lib/record-details";
import { useRecordDialog } from "~/lib/use-record-dialog";
import {
  usersListQueryOptions,
  importUsersCsv,
  updateUser,
  deleteUser,
  resetUserPassword,
  USER_ROLE_OPTIONS,
  type CreatedUserResponse,
  type ImportResult,
  type User,
  type UserRole,
} from "~/lib/queries/users";

function apiMessage(err: unknown, fallback: string) {
  if (!(err instanceof ApiError)) return fallback;
  try {
    const body = JSON.parse(err.message) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* The body is already plain text. */
  }
  return err.message || fallback;
}

function ImportUsersModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (f: File) => importUsersCsv(f),
    onSuccess: (res) => {
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Imported ${res.created} user(s), skipped ${res.skipped}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Import failed"),
  });

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
      title="Import Users from CSV"
      footer={
        <>
          <Button variant="outline" slot="close" className="!rounded-3xl">
            Close
          </Button>
          <Button
            variant="primary"
            className="!rounded-3xl"
            isDisabled={!file}
            isPending={mutation.isPending}
            onPress={() => file && mutation.mutate(file)}
          >
            Upload
          </Button>
        </>
      }
    >
      <p className="text-sm text-(--foreground-600)">
        CSV header must be: <code className="font-mono">email,fullName,role</code>. Role
        values: ADMIN, SENIOR, MONITORING_OFFICER. A temporary password is generated for each new user and shown here. No email is sent.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setResult(null);
          setError(null);
        }}
        className="block w-full text-sm file:mr-4 file:rounded-3xl file:border-0 file:bg-(--accent) file:px-4 file:py-2 file:text-white"
      />

      {error ? <AppAlert status="danger" message={error} /> : null}

      {result ? (
        <div className="space-y-3">
          <AppAlert
            status={result.errors.length > 0 ? "warning" : "success"}
            title={`Created ${result.created}, skipped ${result.skipped}`}
            message={result.errors.length > 0 ? result.errors : "All rows processed successfully."}
          />
          {(result.credentials ?? []).length > 0 ? (
            <div className="max-h-64 overflow-auto rounded-lg border border-(--border)">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-(--muted)">
                    <th className="px-3 py-2 font-medium">Username</th>
                    <th className="px-3 py-2 font-medium">Temporary password</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.credentials ?? []).map((row) => (
                    <tr key={row.username} className="border-t border-(--border)">
                      <td className="px-3 py-2">{row.username}</td>
                      <td className="px-3 py-2 font-mono">{row.temporaryPassword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </AppModal>
  );
}

function UpdateUserModal({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("true");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setActive(user.active ? "true" : "false");
    setError(null);
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      updateUser(user!.id, {
        email: email.trim(),
        fullName: fullName.trim(),
        role: role as UserRole,
        active: active === "true",
      }),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err) => setError(apiMessage(err, "Could not update this user")),
  });

  return (
    <AppModal
      isOpen={user !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Update user"
      footer={
        <>
          <Button variant="outline" slot="close" className="!rounded-3xl">
            Cancel
          </Button>
          <Button
            variant="primary"
            className="!rounded-3xl"
            isPending={mutation.isPending}
            onPress={() => {
              if (!fullName.trim() || !email.trim() || !role) {
                setError("Name, email, and role are required");
                return;
              }
              setError(null);
              mutation.mutate();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      {error ? <AppAlert status="danger" message={error} /> : null}
      <AppTextField name="fullName" label="Full Name" value={fullName} onChange={setFullName} isRequired />
      <AppTextField name="email" label="Email" type="email" value={email} onChange={setEmail} isRequired />
      <AppSelect
        name="role"
        label="Role"
        options={USER_ROLE_OPTIONS}
        selectedKey={role}
        onSelectionChange={setRole}
        isRequired
      />
      <AppSelect
        name="status"
        label="Status"
        options={[
          { label: "Active", value: "true" },
          { label: "Inactive", value: "false" },
        ]}
        selectedKey={active}
        onSelectionChange={setActive}
      />
    </AppModal>
  );
}

function ResetPasswordModal({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<CreatedUserResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () => resetUserPassword(user!.id),
    onSuccess: (created) => {
      setIssued(created);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setError(apiMessage(err, "Could not reset this password")),
  });

  function close() {
    setError(null);
    setIssued(null);
    onClose();
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success("Copied");
  }

  return (
    <AppModal
      isOpen={user !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={issued ? "Temporary password" : "Reset password"}
      footer={
        issued ? (
          <>
            <Button variant="outline" className="!rounded-3xl" onPress={() => void copyValue(`${issued.username}\n${issued.temporaryPassword}`)}>
              Copy both
            </Button>
            <Button variant="primary" slot="close" className="!rounded-3xl">
              Done
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" slot="close" className="!rounded-3xl">
              Cancel
            </Button>
            <Button
              variant="primary"
              className="!rounded-3xl"
              isPending={mutation.isPending}
              onPress={() => mutation.mutate()}
            >
              Reset password
            </Button>
          </>
        )
      }
    >
      {issued ? (
        <div className="space-y-3">
          <p className="text-sm text-(--foreground)">
            Give these to <strong>{issued.fullName}</strong>. Their old password no longer works. They must choose a new one the next time they sign in.
          </p>
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
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-(--foreground)">
            Reset the password for <strong>{user?.fullName}</strong> ({user?.email})? Their current password will stop working, and you will receive a temporary password to give them.
          </p>
          {error ? <AppAlert status="danger" message={error} /> : null}
        </div>
      )}
    </AppModal>
  );
}

function DeleteUserModal({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteUser(user!.id),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err) => setError(apiMessage(err, "Could not delete this user")),
  });

  return (
    <AppModal
      isOpen={user !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onClose();
        }
      }}
      title="Delete user"
      footer={
        <>
          <Button variant="outline" slot="close" className="!rounded-3xl">
            Cancel
          </Button>
          <Button
            variant="outline"
            className="!rounded-3xl text-(--danger) border-(--danger)"
            isPending={mutation.isPending}
            onPress={() => mutation.mutate()}
          >
            Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-(--foreground)">
        Delete <strong>{user?.fullName}</strong> ({user?.email})? They will no longer be able to sign in.
      </p>
      {error ? <AppAlert status="danger" message={error} /> : null}
    </AppModal>
  );
}

export default function UsersManagementPage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading, isError, error } = useQuery(usersListQueryOptions);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [removing, setRemoving] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const view = useRecordDialog();
  const record = useUserRecord(view.id);
  const currentUserId = getStoredUser()?.id;

  const rows = useMemo(
    () =>
      users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        status: u.active ? "Active" : "Inactive",
      })),
    [users],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title="User Management"
        actionSlot={
          <div className="flex gap-3">
            <Button variant="outline" className="!rounded-3xl" onPress={() => setImportOpen(true)}>
              <IconUpload size={16} /> Import CSV
            </Button>
            <Button variant="primary" className="!rounded-3xl" onPress={() => navigate("/admin/users/add-user")}>
              Add A New User
            </Button>
          </div>
        }
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load users"}
        </p>
      ) : null}

      <TableComponent
        tableSectionTitle="Users"
        loading={isLoading}
        emptyMessage="No users yet"
        rows={rows}
        searchKeys={["fullName", "email", "role"]}
        statusColumnKey="status"
        statusColorMap={{ Active: "success", Inactive: "default" }}
        columns={[
          { key: "id", label: "#", width: "60px" },
          { key: "fullName", label: "Full Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status", width: "110px" },
          { key: "action", label: "Action", width: "80px" },
        ]}
        minTableWidthClassName="min-w-[800px]"
        filterByTab={() => true}
        actions={(row) => {
          const person = users.find((user) => user.id === Number(row.id));
          const items: { label: string; onClick: () => void; color?: "danger" }[] = [
            { label: "View Details", onClick: () => view.open(Number(row.id)) },
            { label: "Update", onClick: () => person && setEditing(person) },
            { label: "Reset password", onClick: () => person && setResetting(person) },
          ];
          if (currentUserId !== Number(row.id)) {
            items.push({
              label: "Delete",
              color: "danger",
              onClick: () => person && setRemoving(person),
            });
          }
          return items;
        }}
      />

      <RecordDetailsDialog
        testId="user-details"
        isOpen={view.id !== null}
        onClose={view.close}
        fallbackTitle="User Details"
        {...record}
      />

      <UpdateUserModal user={editing} onClose={() => setEditing(null)} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
      <DeleteUserModal user={removing} onClose={() => setRemoving(null)} />
      <ImportUsersModal isOpen={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
