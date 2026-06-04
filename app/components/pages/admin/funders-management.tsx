import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppAlertDialog from "~/components/app-alert-dialog";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { fundersQueryOptions, type Funder } from "~/lib/queries/lookups";

interface FundersManagementProps {
  basePath?: string;
  readOnly?: boolean;
}

export default function FundersManagement({
  basePath = "/admin",
  readOnly = false,
}: FundersManagementProps = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery(fundersQueryOptions());

  const [toDelete, setToDelete] = useState<Funder | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/lookups/funders/${id}`),
    onSuccess: () => {
      toast.success("Funder deleted");
      queryClient.invalidateQueries({ queryKey: ["funders"] });
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete funder"),
  });

  const rows = useMemo(
    () =>
      data.map((f) => ({
        id: f.id,
        funderName: f.funderName,
        funderType: f.funderType,
        status: f.active ? "Active" : "Inactive",
      })),
    [data],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title="Funders"
        actionSlot={
          readOnly ? undefined : (
            <div className="flex gap-3">
              <Button variant="outline" className="!rounded-3xl" onPress={() => navigate(`${basePath}/funders/types`)}>
                Manage Types
              </Button>
              <Button variant="primary" className="!rounded-3xl" onPress={() => navigate(`${basePath}/funders/add`)}>
                Add Funder
              </Button>
            </div>
          )
        }
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load funders"}
        </p>
      ) : null}

      <TableComponent
        tableSectionTitle="Funders"
        loading={isLoading}
        emptyMessage="No funders yet"
        rows={rows}
        searchKeys={["funderName", "funderType"]}
        statusColumnKey="status"
        statusColorMap={{ Active: "success", Inactive: "default" }}
        columns={[
          { key: "id", label: "#", width: "60px" },
          { key: "funderName", label: "Funder Name" },
          { key: "funderType", label: "Type" },
          { key: "status", label: "Status", width: "110px" },
          { key: "action", label: "Action", width: "80px" },
        ]}
        minTableWidthClassName="min-w-[700px]"
        filterByTab={() => true}
        actions={(row) =>
          readOnly
            ? [{ label: "View Details", onClick: () => navigate(`${basePath}/funders/add?editId=${row.id}&mode=view`) }]
            : [
                { label: "View Details", onClick: () => navigate(`${basePath}/funders/add?editId=${row.id}&mode=view`) },
                { label: "Update", onClick: () => navigate(`${basePath}/funders/add?editId=${row.id}`) },
                { label: "Delete", onClick: () => setToDelete(data.find((f) => f.id === row.id) ?? null), color: "danger" },
              ]
        }
      />

      <AppAlertDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete funder?"
        description={toDelete ? `This will permanently delete "${toDelete.funderName}". This action cannot be undone.` : ""}
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />
    </div>
  );
}
