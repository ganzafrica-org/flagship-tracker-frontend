import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppAlertDialog from "~/components/app-alert-dialog";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { cooperativesQueryOptions, type CooperativeSummary } from "~/lib/queries/cooperatives";

export default function CooperativesManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Accumulate cursor-paginated results so the table shows everything loaded so far.
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<CooperativeSummary[]>([]);

  const { data, isLoading, isError, error, isFetching } = useQuery(cooperativesQueryOptions({ cursor }));

  // Merge new page into the accumulated list (dedupe by id).
  const all = useMemo(() => {
    if (!data) return accumulated;
    const merged = new Map<number, CooperativeSummary>();
    for (const c of accumulated) merged.set(c.cooperativeId, c);
    for (const c of data.content) merged.set(c.cooperativeId, c);
    return Array.from(merged.values());
  }, [data, accumulated]);

  const [toDelete, setToDelete] = useState<CooperativeSummary | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/cooperatives/${id}`),
    onSuccess: (_res, id) => {
      toast.success("Cooperative deleted");
      setAccumulated((prev) => prev.filter((c) => c.cooperativeId !== id));
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete cooperative"),
  });

  function loadMore() {
    if (data?.content) setAccumulated(all);
    if (data?.nextCursor) setCursor(data.nextCursor);
  }

  const rows = useMemo(
    () =>
      all.map((c) => ({
        id: c.cooperativeId,
        cooperativeName: c.cooperativeName,
        cooperativeCode: c.cooperativeCode ?? "—",
        groupType: c.groupType,
        registrationStatus: c.registrationStatus ?? "—",
        primaryValueChain: c.primaryValueChain ?? "—",
        totalMembers: c.totalMembers ?? 0,
        district: c.district ?? "—",
      })),
    [all],
  );

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
        searchKeys={["cooperativeName", "cooperativeCode", "primaryValueChain", "district"]}
        columns={[
          { key: "cooperativeName", label: "Name" },
          { key: "cooperativeCode", label: "Code", width: "110px" },
          { key: "groupType", label: "Group Type" },
          { key: "registrationStatus", label: "Registration" },
          { key: "primaryValueChain", label: "Value Chain" },
          { key: "totalMembers", label: "Members", width: "90px" },
          { key: "district", label: "District" },
          { key: "action", label: "Action", width: "80px" },
        ]}
        minTableWidthClassName="min-w-[1000px]"
        filterByTab={() => true}
        actions={(row) => [
          { label: "View Details", onClick: () => navigate(`/admin/cooperatives/add?editId=${row.id}&mode=view`) },
          { label: "Update", onClick: () => navigate(`/admin/cooperatives/add?editId=${row.id}`) },
          { label: "Delete", onClick: () => setToDelete(all.find((c) => c.cooperativeId === row.id) ?? null), color: "danger" },
        ]}
      />

      {data?.hasNext ? (
        <div className="flex justify-center">
          <Button variant="outline" className="!rounded-3xl" onPress={loadMore} isPending={isFetching}>
            Load more
          </Button>
        </div>
      ) : null}

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
