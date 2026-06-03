import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";

import { PageTitleCard } from "~/components/page-title-card";
import { ContentTab } from "~/components/content-tab";
import TableComponent from "~/components/table-component";
import AppAlertDialog from "~/components/app-alert-dialog";
import CooperativeOverview from "~/components/pages/cooperatives/cooperative-overview";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { cooperativesQueryOptions, type CooperativeSummary } from "~/lib/queries/cooperatives";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "list", label: "List" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface CooperativesPageProps {
  role: "me" | "senior";
}

export default function CooperativesPage({ role }: CooperativesPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<CooperativeSummary[]>([]);
  const [toDelete, setToDelete] = useState<CooperativeSummary | null>(null);

  const { data, isLoading, isError, error, isFetching } = useQuery(cooperativesQueryOptions({ cursor }));

  const all = useMemo(() => {
    if (!data) return accumulated;
    const merged = new Map<number, CooperativeSummary>();
    for (const c of accumulated) merged.set(c.cooperativeId, c);
    for (const c of data.content) merged.set(c.cooperativeId, c);
    return Array.from(merged.values());
  }, [data, accumulated]);

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

  const addPath = role === "me" ? "/me/cooperatives/add-cooperative" : undefined;

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title="Cooperatives"
        actionLabel={addPath ? "Add Cooperative" : undefined}
        onActionPress={addPath ? () => navigate(addPath) : undefined}
      />

      <ContentTab
        items={[...TABS]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      {activeTab === "overview" ? (
        <CooperativeOverview />
      ) : (
        <>
          {isError ? (
            <p className="text-sm text-(--danger)">
              {error instanceof ApiError ? error.message : "Failed to load cooperatives"}
            </p>
          ) : null}

          <TableComponent
            tableSectionTitle="List of Cooperatives"
            loading={isLoading}
            emptyMessage="No cooperatives yet"
            rows={rows}
            searchKeys={["cooperativeName", "cooperativeCode", "groupType", "district"]}
            filterByTab={() => true}
            columns={[
              { key: "cooperativeName", label: "Cooperative Name" },
              { key: "cooperativeCode", label: "Code" },
              { key: "groupType", label: "Group Type" },
              { key: "registrationStatus", label: "Registration Status" },
              { key: "primaryValueChain", label: "Primary Value Chain" },
              { key: "totalMembers", label: "Total Members" },
              { key: "district", label: "District" },
              { key: "action", label: "Action" },
            ]}
            minTableWidthClassName="min-w-[1100px]"
            actions={(row) => {
              if (role === "senior") return [];
              return [
                {
                  label: "Update",
                  onClick: () => navigate(`/me/cooperatives/add-cooperative?editId=${String(row.id)}`),
                },
                {
                  label: "Delete",
                  onClick: () => setToDelete(all.find((c) => c.cooperativeId === row.id) ?? null),
                  color: "danger" as const,
                },
              ];
            }}
          />

          {data?.hasNext ? (
            <div className="flex justify-center">
              <Button variant="outline" className="!rounded-3xl" onPress={loadMore} isPending={isFetching}>
                Load more
              </Button>
            </div>
          ) : null}

          {role === "me" ? (
            <AppAlertDialog
              isOpen={toDelete !== null}
              onOpenChange={(open) => !open && setToDelete(null)}
              title="Delete cooperative?"
              description={
                toDelete
                  ? `This will permanently delete "${toDelete.cooperativeName}" and all related records. This action cannot be undone.`
                  : ""
              }
              confirmLabel="Delete"
              isPending={deleteMutation.isPending}
              onConfirm={() => toDelete && deleteMutation.mutate(toDelete.cooperativeId)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
