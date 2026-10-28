import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { IconHomeFilled, IconLayoutGrid, IconTable } from "@tabler/icons-react";
import { Button, Spinner } from "@heroui/react";

import FlagshipsList, { FlagshipStatusBadge, FunderAvatars, type FlagshipCardItem } from "~/components/pages/flagships/flagships-list";
import { TableExportMenu } from "~/components/export-menu";
import { ContentTab } from "~/components/content-tab";
import { PageTitleCard } from "~/components/page-title-card";
import TableComponent from "~/components/table-component";
import DraftsTabContent from "~/components/offline-drafts/drafts-tab-content";
import { useDraftCount } from "~/lib/offline-drafts/use-drafts";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import { flagshipSummaryQueryOptions } from "~/lib/queries/visualizations";
import { buildFlagshipsExportData } from "~/lib/flagship-details";
import {
  buildFlagshipTableRows,
  deleteFlagship,
  filterFlagshipsByStatusTab,
  flagshipsQueryOptions,
  mapFlagshipCard,
  FLAGSHIP_STATUS_TAB_ITEMS,
  type FlagshipStatusTab,
  type FundingContribution,
} from "~/lib/queries/flagships";

const FLAGSHIP_TABLE_COLUMNS = [
  { key: "valueChain", label: "Value Chain" },
  { key: "id", label: "#" },
  { key: "projectName", label: "Project Name" },
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
  showDraftTab = false,
}: FlagshipsIndexPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FlagshipViewTab>("all");
  const draftCount = useDraftCount(showDraftTab ? "flagship" : undefined);
  const tabItems = showDraftTab
    ? [...FLAGSHIP_STATUS_TAB_ITEMS, { id: "draft" as const, label: draftCount ? `Draft (${draftCount})` : "Draft" }]
    : FLAGSHIP_STATUS_TAB_ITEMS;
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
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
        ...mapFlagshipCard(item, index, summaryById.get(item.flagshipId)),
        icon: <IconHomeFilled size={18} />,
      })),
    [filteredFlagships, summaryById],
  );

  // DEBUG: remove once flagship card data has been inspected
  useEffect(() => {
    if (isLoading) return;
    console.log("[Flagships] raw API response:", flagships.length, "items", flagships);
    console.table(
      flagships.map((f) => ({
        id: f.flagshipId,
        name: f.flagshipName,
        jobsCreated: f.jobsCreated,
        budgetTotalRwf: f.budgetTotalRwf,
        primaryValueChain: f.primaryValueChain,
        progressPercent: f.progressPercent,
        funders: f.funders,
        fundingContributions: f.fundingContributions?.length ?? 0,
      })),
    );
  }, [flagships, isLoading]);

  useEffect(() => {
    if (summaryLoading) return;
    console.log("[Flagships] mv_flagship_summary rows:", summaryRows.length, "items", summaryRows);
    console.table(summaryRows);
  }, [summaryRows, summaryLoading]);

  useEffect(() => {
    if (flagshipCards.length === 0) return;
    console.log(
      "[Flagships] data rendered per card:",
      flagshipCards.map((c) => ({
        id: c.id,
        title: c.title,
        jobsCreated: c.jobsCreated,
        totalBudget: c.totalBudget,
        valueChain: c.valueChain,
        progress: c.progress,
        progressText: c.progressText,
        numberOfFunders: c.numberOfFunders,
        funderNames: c.funderNames,
      })),
    );
  }, [flagshipCards]);

  const flagshipRows = useMemo(() => buildFlagshipTableRows(filteredFlagships, summaryById), [filteredFlagships, summaryById]);

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
      onClick: () => navigate(`${basePath}/${row.flagshipId}`, { viewTransition: true }),
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
        actionLabel={addFlagshipPath ? actionLabel : undefined}
        onActionPress={
          addFlagshipPath
            ? () => navigate(addFlagshipPath, { viewTransition: true })
            : undefined
        }
      />
      <ContentTab
        items={tabItems}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as FlagshipViewTab)}
        endSlot={
          activeTab === "draft" ? null : (
          <div className="flex items-center gap-2">
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
          onViewMore={(item) => navigate(`${basePath}/${item.id}`, { viewTransition: true })}
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
