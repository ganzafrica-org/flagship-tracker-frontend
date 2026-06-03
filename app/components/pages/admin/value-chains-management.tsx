import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppAlertDialog from "~/components/app-alert-dialog";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { valueChainsQueryOptions, type ValueChain } from "~/lib/queries/lookups";

interface ValueChainsManagementProps {
  basePath?: string;
  readOnly?: boolean;
}

export default function ValueChainsManagement({
  basePath = "/admin",
  readOnly = false,
}: ValueChainsManagementProps = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery(valueChainsQueryOptions());

  const [toDelete, setToDelete] = useState<ValueChain | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/lookups/value-chains/${id}`),
    onSuccess: () => {
      toast.success("Value chain deleted");
      queryClient.invalidateQueries({ queryKey: ["value-chains"] });
      setToDelete(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete value chain");
    },
  });

  const rows = useMemo(
    () =>
      data.map((vc) => ({
        id: vc.id,
        cluster: vc.cluster,
        valueChain: vc.valueChain,
        status: vc.active ? "Active" : "Inactive",
      })),
    [data],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title="Value Chains"
        actionLabel={readOnly ? undefined : "Add Value Chain"}
        onActionPress={readOnly ? undefined : () => navigate(`${basePath}/value-chains/add`)}
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load value chains"}
        </p>
      ) : null}

      <TableComponent
        tableSectionTitle="Value Chains"
        loading={isLoading}
        emptyMessage="No value chains yet"
        rows={rows}
        searchKeys={["cluster", "valueChain"]}
        statusColumnKey="status"
        statusColorMap={{ Active: "success", Inactive: "default" }}
        columns={[
          { key: "id", label: "#", width: "60px" },
          { key: "cluster", label: "Cluster" },
          { key: "valueChain", label: "Value Chain" },
          { key: "status", label: "Status", width: "110px" },
          { key: "action", label: "Action", width: "80px" },
        ]}
        minTableWidthClassName="min-w-[700px]"
        filterByTab={() => true}
        actions={(row) =>
          readOnly
            ? [
                {
                  label: "View Details",
                  onClick: () => navigate(`${basePath}/value-chains/add?editId=${row.id}&mode=view`),
                },
              ]
            : [
                {
                  label: "View Details",
                  onClick: () => navigate(`${basePath}/value-chains/add?editId=${row.id}&mode=view`),
                },
                {
                  label: "Update",
                  onClick: () => navigate(`${basePath}/value-chains/add?editId=${row.id}`),
                },
                {
                  label: "Delete",
                  onClick: () => setToDelete(data.find((v) => v.id === row.id) ?? null),
                  color: "danger",
                },
              ]
        }
      />

      <AppAlertDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete value chain?"
        description={
          toDelete
            ? `This will permanently delete "${toDelete.valueChain}" (${toDelete.cluster}). This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />
    </div>
  );
}
