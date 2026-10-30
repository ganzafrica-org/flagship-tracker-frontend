import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppAlertDialog from "~/components/app-alert-dialog";
import RecordDetailsDialog from "~/components/record-details-dialog";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { useUrlState } from "~/lib/use-url-state";
import { useRecordDialog } from "~/lib/use-record-dialog";
import { useCooperativeRecord } from "~/lib/record-details";
import { cooperativesListQueryOptions, cooperativeToTableRow, COOPERATIVE_LIST_COLUMNS, COOPERATIVE_LIST_SEARCH_KEYS, COOPERATIVE_SEARCH_PLACEHOLDER, DEFAULT_COOPERATIVE_TYPE, cooperativeTypeNames, EMPTY_COOPERATIVE_FILTERS, cooperativeMatchesFilters, type CooperativeSummary } from "~/lib/queries/cooperatives";
import { buildCooperativesExportData } from "~/lib/cooperative-details";

export default function CooperativesManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: all = [], isLoading, isError, error } = useQuery(cooperativesListQueryOptions);

  const [toDelete, setToDelete] = useState<CooperativeSummary | null>(null);
  const [searchParams] = useSearchParams();
  const view = useRecordDialog();
  const record = useCooperativeRecord(view.id);

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

  const [typeParam] = useUrlState("type");
  const filteredCooperatives = useMemo(
    () => all.filter((c) => cooperativeMatchesFilters(c, { ...EMPTY_COOPERATIVE_FILTERS, group: typeParam })),
    [all, typeParam],
  );
  const rows = useMemo(() => filteredCooperatives.map(cooperativeToTableRow), [filteredCooperatives]);

  if (!typeParam) {
    // Keep any other params (e.g. ?view=) when defaulting the type.
    const next = new URLSearchParams(searchParams);
    next.set("type", DEFAULT_COOPERATIVE_TYPE);
    return <Navigate to={`?${next.toString()}`} replace />;
  }
  const names = cooperativeTypeNames(typeParam);

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title={names.plural}
        actionLabel={`Add ${names.singular}`}
        onActionPress={() => navigate(`/admin/cooperatives/add?type=${typeParam}`)}
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load cooperatives"}
        </p>
      ) : null}

      <TableComponent
        tableSectionTitle={`List of ${names.plural}`}
        exportConfig={{
          title: `List of ${names.plural}`,
          fileBase: names.plural.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          getExportData: () => buildCooperativesExportData(queryClient, filteredCooperatives),
        }}
        loading={isLoading}
        emptyMessage={`No ${names.plural.toLowerCase()} yet`}
        rows={rows}
        searchPlaceholder={COOPERATIVE_SEARCH_PLACEHOLDER}
        searchKeys={[...COOPERATIVE_LIST_SEARCH_KEYS]}
        columns={[...COOPERATIVE_LIST_COLUMNS]}
        minTableWidthClassName="min-w-[1000px]"
        filterByTab={() => true}
        actions={(row) => [
          { label: "View Details", onClick: () => view.open(row.id) },
          { label: "Update", onClick: () => navigate(`/admin/cooperatives/add?editId=${row.id}`) },
          { label: "Delete", onClick: () => setToDelete(all.find((c) => c.cooperativeId === row.id) ?? null), color: "danger" },
        ]}
      />

      <RecordDetailsDialog
        testId="cooperative-details"
        isOpen={view.id !== null}
        onClose={view.close}
        fallbackTitle={`${names.singular} Details`}
        onEdit={view.id === null ? undefined : () => navigate(`/admin/cooperatives/add?editId=${view.id}`)}
        {...record}
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
