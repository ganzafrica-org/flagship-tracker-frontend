import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { IconHomeFilled, IconLayoutGrid, IconTable } from "@tabler/icons-react";
import { Button, Spinner } from "@heroui/react";

import FlagshipsList, { FlagshipStatusBadge, FunderAvatars, type FlagshipCardItem } from "~/components/pages/flagships/flagships-list";
import { TableExportMenu } from "~/components/export-menu";
import { ContentTab } from "~/components/content-tab";
import { ExcelImportButton, notifySpreadsheetImport } from "~/components/excel-import-button";
import { PageTitleCard } from "~/components/page-title-card";
import { importFlagshipsFromSheet } from "~/lib/entity-imports";
import TableComponent from "~/components/table-component";
import DraftsTabContent from "~/components/offline-drafts/drafts-tab-content";
import { TargetScopeFilter } from "~/components/target-scope-filter";
import { readTargetScope, withTargetScope, writeTargetScope, type TargetScope } from "~/lib/target-scope";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import { flagshipSummaryQueryOptions } from "~/lib/queries/visualizations";
import { buildFlagshipsExportData } from "~/lib/flagship-details";
import {
  buildFlagshipTableRows,
  deleteFlagship,
  filterFlagshipsByStatusTab,
  flagshipQueryOptions,
  flagshipsQueryOptions,
  mapFlagshipCard,
  FLAGSHIP_STATUS_TAB_ITEMS,
  type FlagshipStatusTab,
  type FundingContribution,
} from "~/lib/queries/flagships";

const FLAGSHIP_TABLE_COLUMNS = [
  { key: "id", label: "#" },
  { key: "projectName", label: "Flagship Name" },
  { key: "valueChain", label: "Value Chain" },
  { key: "totalBudget", label: "Total Budget" },
  { key: "jobsCreated", label: "Jobs Created" },
  { key: "funders", label: "Funders" },
  { key: "status", label: "Status", width: "130px" },
  { key: "action", label: "Action" },
] as const;

export interface FlagshipsIndexPageProps {
  title: string;
  /** Base path without trailing slash, e.g. `/me/flagships` */
  basePath: string;
  addFlagshipPath?: string;
  actionLabel?: string;
  /** M&E only: adds a "Draft" tab showing locally-saved offline flagship submissions. */
  showDraftTab?: boolean;
}

type FlagshipViewTab = FlagshipStatusTab | "draft";

export default function FlagshipsIndexPage({
  title,
  basePath,
  addFlagshipPath,
  actionLabel = "Add Flagship",
}: FlagshipsIndexPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FlagshipViewTab>("all");
  const tabItems = FLAGSHIP_STATUS_TAB_ITEMS;
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [targetScope, setTargetScope] = useState<TargetScope>(() => readTargetScope());
  const [listError, setListError] = useState<string | null>(null);

  const { data: flagships = [], isLoading, isError, error } = useQuery(flagshipsQueryOptions);
  // Card figures come from mv_flagship_summary; funders still come from the flagship list.
  const { data: summaryRows = [], isLoading: summaryLoading } = useQuery(flagshipSummaryQueryOptions);

  const deleteMutation = useMutation({
    mutationFn: deleteFlagship,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: flagshipsQueryOptions.queryKey });
      setListError(null);
    },
    onError: (err: Error) => {
      setListError(
        err instanceof ApiError ? formatApiErrorMessage(err.message) : err.message || "Failed to delete flagship",
      );
    },
  });

  const filteredFlagships = useMemo(
    () =>
      [...filterFlagshipsByStatusTab(flagships, activeTab === "draft" ? "all" : activeTab)].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      ),
    [activeTab, flagships],
  );

  const summaryById = useMemo(() => new Map(summaryRows.map((r) => [r.flagshipId, r])), [summaryRows]);

  const flagshipCards: FlagshipCardItem[] = useMemo(
    () =>
      filteredFlagships.map((item, index) => ({
        ...mapFlagshipCard(item, index, summaryById.get(item.flagshipId), targetScope),
        icon: <IconHomeFilled size={18} />,
      })),
    [filteredFlagships, summaryById, targetScope],
  );

  const flagshipRows = useMemo(
    () => buildFlagshipTableRows(filteredFlagships, summaryById, targetScope),
    [filteredFlagships, summaryById, targetScope],
  );

  function changeTargetScope(next: TargetScope) {
    writeTargetScope(next);
    setTargetScope(next);
  }

  function handleDelete(row: { flagshipId: number; projectName: string }) {
    const confirmed = window.confirm(
      `Delete flagship "${row.projectName}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    deleteMutation.mutate(row.flagshipId);
  }

  const tableActions = (row: { id: number; flagshipId: number; projectName: string }) => [
    {
      label: "View Details",
      onClick: () => navigate(withTargetScope(`${basePath}/${row.flagshipId}`, targetScope), { viewTransition: true }),
    },
    ...(addFlagshipPath
      ? [
          {
            label: "Update",
            onClick: () =>
              navigate(
                `${addFlagshipPath}?editId=${encodeURIComponent(String(row.flagshipId))}&returnTo=${encodeURIComponent(basePath)}`,
                { viewTransition: true },
              ),
          },
          {
            label: "Delete",
            onClick: () => handleDelete(row),
            color: "danger" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title={title}
        actionSlot={
          addFlagshipPath ? (
            <div className="flex gap-3">
              <ExcelImportButton
                variant="outline"
                onImport={async (rows) => {
                  const outcome = await importFlagshipsFromSheet(rows);
                  void queryClient.invalidateQueries({ queryKey: flagshipsQueryOptions.queryKey });
                  setListError(outcome.errors.length ? outcome.errors.slice(0, 6).join(" ") : null);
                  notifySpreadsheetImport(outcome, outcome.created === 1 ? "flagship" : "flagships");
                }}
              />
              <Button
                variant="primary"
                className="!rounded-3xl font-medium"
                onPress={() => navigate(addFlagshipPath, { viewTransition: true })}
              >
                {actionLabel}
              </Button>
            </div>
          ) : undefined
        }
      />
      <ContentTab
        items={tabItems}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as FlagshipViewTab)}
        endSlot={
          activeTab === "draft" ? null : (
          <div className="flex items-center gap-2">
            <TargetScopeFilter value={targetScope} onChange={changeTargetScope} />
            {viewMode === "cards" ? (
              <TableExportMenu
                isDisabled={flagshipRows.length === 0}
                getOptions={() => ({
                  title: "List of Flagships",
                  fileBase: "flagships",
                  ...buildFlagshipsExportData(filteredFlagships),
                })}
              />
            ) : null}
          <Button
            isIconOnly
            variant={viewMode === "table" ? "primary" : "outline"}
            aria-label={viewMode === "table" ? "Switch to card view" : "Switch to table view"}
            onPress={() => setViewMode((prev) => (prev === "cards" ? "table" : "cards"))}
          >
            {viewMode === "table" ? <IconLayoutGrid size={18} /> : <IconTable size={18} />}
          </Button>
          </div>
          )
        }
      />
      {listError ? (
        <p className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
          {listError}
        </p>
      ) : null}
      {activeTab === "draft" ? (
        <DraftsTabContent entityType="flagship" editPath={addFlagshipPath ?? "/me/flagships/add-flagship"} />
      ) : isLoading || summaryLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <p className="text-sm text-danger py-8 text-center">
          {error instanceof Error ? error.message : "Failed to load flagships."}
        </p>
      ) : viewMode === "cards" ? (
        <FlagshipsList
          items={flagshipCards}
          className="w-full"
          onPrefetch={(item) => {
            void queryClient.prefetchQuery(flagshipQueryOptions(item.id));
          }}
          onViewMore={(item) => navigate(withTargetScope(`${basePath}/${item.id}`, targetScope), { viewTransition: true })}
        />
      ) : (
        <TableComponent
          tableSectionTitle="List of Flagships"
          tableAriaLabel="Flagships table"
          rows={flagshipRows as unknown as Record<string, unknown>[] & { id: number }[]}
          loading={isLoading}
          emptyMessage="No flagships yet"
          searchPlaceholder="Search by project, code, cluster, value chain, status…"
          searchKeys={["projectName", "valueChain", "code", "cluster", "status"]}
          columns={[...FLAGSHIP_TABLE_COLUMNS]}
          minTableWidthClassName="min-w-[1100px]"
          filterByTab={() => true}
          actions={tableActions as never}
          exportConfig={{
            title: "List of Flagships",
            fileBase: "flagships",
            getExportData: () => Promise.resolve(buildFlagshipsExportData(filteredFlagships)),
          }}
          cellRenderers={{
            funders: (row) => (
              <FunderAvatars funders={(row.funderContributions as FundingContribution[]) ?? []} />
            ),
            status: (row) => <FlagshipStatusBadge status={String(row.status ?? "")} />,
          }}
        />
      )}
    </div>
  );
}
