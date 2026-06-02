import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppAlertDialog from "~/components/app-alert-dialog";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { agenciesQueryOptions, type Agency } from "~/lib/queries/lookups";

export default function AgenciesManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery(agenciesQueryOptions());

  const [toDelete, setToDelete] = useState<Agency | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/lookups/implementing-agencies/${id}`),
    onSuccess: () => {
      toast.success("Agency deleted");
      queryClient.invalidateQueries({ queryKey: ["implementing-agencies"] });
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete agency"),
  });

  const rows = useMemo(
    () =>
      data.map((a) => ({
        id: a.id,
        agencyName: a.agencyName,
        agencyType: a.agencyType,
        status: a.active ? "Active" : "Inactive",
      })),
    [data],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title="Implementing Agencies"
        actionSlot={
          <div className="flex gap-3">
            <Button variant="outline" className="!rounded-3xl" onPress={() => navigate("/admin/agencies/types")}>
              Manage Types
            </Button>
            <Button variant="primary" className="!rounded-3xl" onPress={() => navigate("/admin/agencies/add")}>
              Add Agency
            </Button>
          </div>
        }
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load agencies"}
        </p>
      ) : null}

      <TableComponent
        tableSectionTitle={isLoading ? "Loading…" : "Implementing Agencies"}
        rows={rows}
        searchKeys={["agencyName", "agencyType"]}
        statusColumnKey="status"
        statusColorMap={{ Active: "success", Inactive: "default" }}
        columns={[
          { key: "id", label: "#", width: "60px" },
          { key: "agencyName", label: "Agency Name" },
          { key: "agencyType", label: "Type" },
          { key: "status", label: "Status", width: "110px" },
          { key: "action", label: "Action", width: "80px" },
        ]}
        minTableWidthClassName="min-w-[700px]"
        filterByTab={() => true}
        actions={(row) => [
          { label: "View Details", onClick: () => navigate(`/admin/agencies/add?editId=${row.id}&mode=view`) },
          { label: "Update", onClick: () => navigate(`/admin/agencies/add?editId=${row.id}`) },
          { label: "Delete", onClick: () => setToDelete(data.find((a) => a.id === row.id) ?? null), color: "danger" },
        ]}
      />

      <AppAlertDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete agency?"
        description={toDelete ? `This will permanently delete "${toDelete.agencyName}". This action cannot be undone.` : ""}
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />
    </div>
  );
}
