import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";
import { IconUpload } from "@tabler/icons-react";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppModal from "~/components/app-modal";
import AppAlert, { toast } from "~/components/app-alert";
import { ApiError } from "~/lib/api";
import {
  usersQueryOptions,
  importUsersCsv,
  type ImportResult,
} from "~/lib/queries/users";

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
        CSV header must be: <code className="font-mono">email,password,fullName,role</code>. Role
        values: ADMIN, SENIOR, MONITORING_OFFICER.
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
        <AppAlert
          status={result.errors.length > 0 ? "warning" : "success"}
          title={`Created ${result.created}, skipped ${result.skipped}`}
          message={result.errors.length > 0 ? result.errors : "All rows processed successfully."}
        />
      ) : null}
    </AppModal>
  );
}

export default function UsersManagementPage() {
  const navigate = useNavigate();
  const { data: page, isLoading, isError, error } = useQuery(usersQueryOptions());
  const [importOpen, setImportOpen] = useState(false);

  const rows = useMemo(
    () =>
      (page?.content ?? []).map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        status: u.active ? "Active" : "Inactive",
      })),
    [page],
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
        actions={(row) => [
          {
            label: "View Details",
            onClick: () => navigate(`/admin/users/add-user?editId=${row.id}&mode=view`),
          },
        ]}
      />

      <ImportUsersModal isOpen={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
