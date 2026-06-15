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
import { cooperativesListQueryOptions, cooperativeToTableRow, COOPERATIVE_LIST_COLUMNS, COOPERATIVE_LIST_SEARCH_KEYS, type CooperativeSummary } from "~/lib/queries/cooperatives";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "list", label: "Cooperative list" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface CooperativesPageProps {
  role: "me" | "senior";
}

function cooperativeFormPath(role: CooperativesPageProps["role"], cooperativeId: number, mode?: "view" | "edit") {
  const base = role === "me" ? "/me/cooperatives/add-cooperative" : "/me/cooperatives/add-cooperative";
  const returnTo = role === "me" ? "/me/cooperatives" : "/senior/cooperatives";
  const params = new URLSearchParams({
    editId: String(cooperativeId),
    returnTo,
  });
  if (mode === "view") params.set("mode", "view");
  return `${base}?${params.toString()}`;
}

export default function CooperativesPage({ role }: CooperativesPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [toDelete, setToDelete] = useState<CooperativeSummary | null>(null);

  const { data: all = [], isLoading, isError, error } = useQuery({
    ...cooperativesListQueryOptions,
    enabled: activeTab === "list",
  });

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
            searchPlaceholder="Search by name, code, value chain, location…"
            searchKeys={[...COOPERATIVE_LIST_SEARCH_KEYS]}
            filterByTab={() => true}
            columns={[...COOPERATIVE_LIST_COLUMNS]}
            minTableWidthClassName="min-w-[1100px]"
            actions={(row) => {
              if (role === "senior") {
                return [
                  {
                    label: "View Details",
                    onClick: () => navigate(cooperativeFormPath(role, row.id, "view")),
                  },
                ];
              }
              return [
                {
                  label: "View Details",
                  onClick: () => navigate(cooperativeFormPath(role, row.id, "view")),
                },
                {
                  label: "Update",
                  onClick: () => navigate(cooperativeFormPath(role, row.id, "edit")),
                },
                {
                  label: "Delete",
                  onClick: () => setToDelete(all.find((c) => c.cooperativeId === row.id) ?? null),
                  color: "danger" as const,
                },
              ];
            }}
          />

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
