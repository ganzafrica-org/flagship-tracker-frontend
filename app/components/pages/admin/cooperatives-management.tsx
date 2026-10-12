import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppAlertDialog from "~/components/app-alert-dialog";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { cooperativesListQueryOptions, cooperativeToTableRow, COOPERATIVE_LIST_COLUMNS, COOPERATIVE_LIST_SEARCH_KEYS, type CooperativeSummary } from "~/lib/queries/cooperatives";

export default function CooperativesManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: all = [], isLoading, isError, error } = useQuery(cooperativesListQueryOptions);

  const [toDelete, setToDelete] = useState<CooperativeSummary | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/cooperatives/${id}`),
    onSuccess: (_res, id) => {
      toast.success("Cooperative deleted");
      queryClient.setQueryData(
        cooperativesListQueryOptions.queryKey,
        (prev: CooperativeSummary[] | undefined) =>
          (prev ?? []).filter((c) => c.cooperativeId !== id),
      );
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete cooperative"),
  });

  const rows = useMemo(() => all.map(cooperativeToTableRow), [all]);

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title="Cooperatives"
        actionLabel="Add Cooperative"
        onActionPress={() => navigate("/admin/cooperatives/add")}
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load cooperatives"}
        </p>
      ) : null}

      <TableComponent
        tableSectionTitle="Cooperatives"
        loading={isLoading}
        emptyMessage="No cooperatives yet"
        rows={rows}
        searchPlaceholder="Search by name, code, value chain, location…"
        searchKeys={[...COOPERATIVE_LIST_SEARCH_KEYS]}
        columns={[...COOPERATIVE_LIST_COLUMNS]}
        minTableWidthClassName="min-w-[1000px]"
        filterByTab={() => true}
        actions={(row) => [
          { label: "View Details", onClick: () => navigate(`/admin/cooperatives/add?editId=${row.id}&mode=view`) },
          { label: "Update", onClick: () => navigate(`/admin/cooperatives/add?editId=${row.id}`) },
          { label: "Delete", onClick: () => setToDelete(all.find((c) => c.cooperativeId === row.id) ?? null), color: "danger" },
        ]}
      />

      <AppAlertDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete cooperative?"
        description={toDelete ? `This will permanently delete "${toDelete.cooperativeName}" and all related records. This action cannot be undone.` : ""}
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.cooperativeId)}
      />
    </div>
  );
}
