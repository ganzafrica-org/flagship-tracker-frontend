import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { IconHomeFilled, IconLayoutGrid, IconTable } from "@tabler/icons-react";
import { Button, Spinner } from "@heroui/react";

import FlagshipsList, { type FlagshipCardItem } from "~/components/pages/flagships/flagships-list";
import { ContentTab } from "~/components/content-tab";
import { PageTitleCard } from "~/components/page-title-card";
import TableComponent from "~/components/table-component";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import {
  buildFlagshipTableRows,
  deleteFlagship,
  filterFlagshipsByStatusTab,
  flagshipsQueryOptions,
  mapFlagshipToListItem,
  FLAGSHIP_STATUS_TAB_ITEMS,
  type FlagshipStatusTab,
} from "~/lib/queries/flagships";

const FLAGSHIP_TABLE_COLUMNS = [
  { key: "id", label: "#" },
  { key: "projectName", label: "Project Name" },
  { key: "totalBudget", label: "Total Budget" },
  { key: "jobsCreated", label: "Jobs Created" },
  { key: "numberOfFunders", label: "Number of Funders" },
  { key: "valueChain", label: "Value Chain" },
  { key: "progress", label: "Progress" },
  { key: "action", label: "Action" },
] as const;

export interface FlagshipsIndexPageProps {
  title: string;
  /** Base path without trailing slash, e.g. `/me/flagships` */
  basePath: string;
  addFlagshipPath?: string;
  actionLabel?: string;
}

export default function FlagshipsIndexPage({
  title,
  basePath,
  addFlagshipPath,
  actionLabel = "Add Flagship",
}: FlagshipsIndexPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FlagshipStatusTab>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [listError, setListError] = useState<string | null>(null);

  const { data: flagships = [], isLoading, isError, error } = useQuery(flagshipsQueryOptions);

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
      [...filterFlagshipsByStatusTab(flagships, activeTab)].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      ),
    [activeTab, flagships],
  );

  const flagshipCards: FlagshipCardItem[] = useMemo(
    () =>
      filteredFlagships.map((item, index) => ({
        ...mapFlagshipToListItem(item, index),
        icon: <IconHomeFilled size={18} />,
      })),
    [filteredFlagships],
  );

  const flagshipRows = useMemo(() => buildFlagshipTableRows(filteredFlagships), [filteredFlagships]);

  function handleDelete(row: { id: number; projectName: string }) {
    const confirmed = window.confirm(
      `Delete flagship "${row.projectName}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    deleteMutation.mutate(Number(row.id));
  }

  const tableActions = (row: { id: number; projectName: string }) => [
    {
      label: "View Details",
      onClick: () => navigate(`${basePath}/${row.id}`, { viewTransition: true }),
    },
    ...(addFlagshipPath
      ? [
          {
            label: "Update",
            onClick: () =>
              navigate(
                `${addFlagshipPath}?editId=${encodeURIComponent(String(row.id))}&returnTo=${encodeURIComponent(basePath)}`,
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
        items={FLAGSHIP_STATUS_TAB_ITEMS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as FlagshipStatusTab)}
        endSlot={
          <Button
            isIconOnly
            variant={viewMode === "table" ? "primary" : "outline"}
            aria-label={viewMode === "table" ? "Switch to card view" : "Switch to table view"}
            onPress={() => setViewMode((prev) => (prev === "cards" ? "table" : "cards"))}
          >
            {viewMode === "table" ? <IconLayoutGrid size={18} /> : <IconTable size={18} />}
          </Button>
        }
      />
      {listError ? (
        <p className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
          {listError}
        </p>
      ) : null}
      {isLoading ? (
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
          rows={flagshipRows}
          searchKeys={["projectName", "valueChain"]}
          columns={[...FLAGSHIP_TABLE_COLUMNS]}
          minTableWidthClassName="min-w-[1100px]"
          filterByTab={() => true}
          actions={tableActions}
        />
      )}
    </div>
  );
}
