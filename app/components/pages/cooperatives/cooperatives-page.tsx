import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dropdown, Label } from "@heroui/react";
import { IconChevronDown, IconPlus } from "@tabler/icons-react";

import { PageTitleCard } from "~/components/page-title-card";
import { ContentTab } from "~/components/content-tab";
import AppSelect from "~/components/app-select";
import TableComponent from "~/components/table-component";
import CooperativeOverview from "~/components/pages/cooperatives/cooperative-overview";
import RecordDetailsDialog from "~/components/record-details-dialog";
import { useUrlState } from "~/lib/use-url-state";
import { useRecordDialog } from "~/lib/use-record-dialog";
import { useCooperativeRecord } from "~/lib/record-details";
import { ApiError } from "~/lib/api";
import { cooperativesListQueryOptions, cooperativeToTableRow, COOPERATIVE_LIST_COLUMNS, COOPERATIVE_LIST_SEARCH_KEYS, COOPERATIVE_SEARCH_PLACEHOLDER, DEFAULT_COOPERATIVE_TYPE, cooperativeTypeNames, cooperativeMatchesFilters, EMPTY_COOPERATIVE_FILTERS, type CooperativeListFilters } from "~/lib/queries/cooperatives";
import { districtMatches, inferProvinceForDistrict, listAllRwandaDistricts, listRwandaDistricts, listRwandaProvinces } from "~/lib/rwanda-locations";
import DraftsTabContent from "~/components/offline-drafts/drafts-tab-content";
import { useDrafts } from "~/lib/offline-drafts/use-drafts";
import { buildCooperativesExportData } from "~/lib/cooperative-details";
import CooperativeImportDialog from "~/components/pages/cooperatives/cooperative-import-dialog";
import { toast } from "~/components/app-alert";
import { useCooperativeImport } from "~/lib/cooperative-import/use-cooperative-import";
import { saveBlob } from "~/lib/import/template";
import { isNetworkError } from "~/lib/offline-drafts/network";

type TabId = "overview" | "list" | "draft";

interface CooperativesPageProps {
  role: "me" | "senior";
}

function cooperativeEditPath(cooperativeId: number, type: string) {
  const params = new URLSearchParams({
    editId: String(cooperativeId),
    returnTo: `/me/cooperatives?type=${type}`,
  });
  return `/me/cooperatives/add-cooperative?${params.toString()}`;
}

function uniqueOptions(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v?.trim())))
    .sort((a, b) => a.localeCompare(b))
    .map((v) => ({ value: v, label: v }));
}

export default function CooperativesPage({ role }: CooperativesPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Group type comes from the sidebar dropdown (?type=association) and feeds the existing `group` filter.
  const [typeParam, setTypeParam] = useUrlState("type");
  const [activeTab, setActiveTab] = useState<TabId>(typeParam ? "list" : "overview");
  useEffect(() => {
    if (typeParam) setActiveTab("list");
  }, [typeParam]);
  const [searchParams] = useSearchParams();
  const view = useRecordDialog();
  const record = useCooperativeRecord(view.id);

  const { data: all = [], isLoading, isError, error } = useQuery({
    ...cooperativesListQueryOptions,
    enabled: activeTab === "list",
  });

  const [filters, setFilters] = useState<CooperativeListFilters>(EMPTY_COOPERATIVE_FILTERS);
  const setFilter = (key: keyof CooperativeListFilters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const setProvince = (value: string) => {
    setFilters((prev) => {
      const districts = value ? listRwandaDistricts(value) : listAllRwandaDistricts();
      const districtStillValid = !prev.district || districts.some((district) => districtMatches(district, prev.district));
      return { ...prev, province: value, district: districtStillValid ? prev.district : "" };
    });
  };
  const setDistrict = (value: string) => {
    setFilters((prev) => {
      if (!value || prev.province) return { ...prev, district: value };
      return { ...prev, district: value, province: inferProvinceForDistrict(value) ?? "" };
    });
  };
  const provinceOptions = useMemo(
    () => listRwandaProvinces().map((province) => ({ value: province, label: province })),
    [],
  );
  const districtOptions = useMemo(() => {
    const districts = filters.province ? listRwandaDistricts(filters.province) : listAllRwandaDistricts();
    return districts.map((district) => ({ value: district, label: district }));
  }, [filters.province]);
  const effectiveFilters = useMemo(() => ({ ...filters, group: typeParam }), [filters, typeParam]);
  const hasActiveFilters = Object.values(effectiveFilters).some(Boolean);
  // Only value chains that actually occur in this group type.
  const valueChainOptions = useMemo(
    () => uniqueOptions(all.filter((c) => c.groupType === typeParam).map((c) => c.primaryValueChain)),
    [all, typeParam],
  );

  const filteredCooperatives = useMemo(
    () => all.filter((c) => cooperativeMatchesFilters(c, effectiveFilters)),
    [all, effectiveFilters],
  );
  const rows = useMemo(() => filteredCooperatives.map(cooperativeToTableRow), [filteredCooperatives]);

  // Bulk upload + template (M&E only, like Add). The template holds the page's current records: the
  // list query with this page's filters, loaded on demand so it also works from the Overview tab.
  const canImport = role === "me";
  const [importOpen, setImportOpen] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const importer = useCooperativeImport(
    typeParam,
    async () => {
      // Offline, use the list already loaded instead of waiting for a connection.
      const cached = queryClient.getQueryData(cooperativesListQueryOptions.queryKey);
      const list =
        cached ?? (await queryClient.fetchQuery({ ...cooperativesListQueryOptions, networkMode: "always", retry: false }));
      return list.filter((c) => cooperativeMatchesFilters(c, effectiveFilters));
    },
    canImport && Boolean(typeParam),
  );
  async function downloadTemplate() {
    setTemplateBusy(true);
    try {
      saveBlob(importer.templateFilename, await importer.buildTemplate());
    } catch (e) {
      toast.error(
        isNetworkError(e)
          ? "You're offline and this list has not been loaded yet. Open the list once while online to download the template with its records."
          : e instanceof Error && e.message
            ? e.message
            : "Could not create the template",
      );
    } finally {
      setTemplateBusy(false);
    }
  }


  const names = cooperativeTypeNames(typeParam);
  const cooperativeDrafts = useDrafts("cooperative") ?? [];
  const typeDraftCount =
    role === "me"
      ? cooperativeDrafts.filter((d) => d.entityType === "cooperative" && d.payload.groupType === typeParam).length
      : 0;
  const tabs: { id: string; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "list", label: `${names.plural} list` },
    ...(role === "me" ? [{ id: "draft", label: typeDraftCount ? `Draft (${typeDraftCount})` : "Draft" }] : []),
  ];
  const addPath =
    role === "me"
      ? `/me/cooperatives/add-cooperative?type=${typeParam}&returnTo=${encodeURIComponent(`/me/cooperatives?type=${typeParam}`)}`
      : undefined;

  // There is no default list: visiting without a type goes to the first group type.
  if (!typeParam) {
    // Keep any other params (e.g. ?view=) when defaulting the type.
    const next = new URLSearchParams(searchParams);
    next.set("type", DEFAULT_COOPERATIVE_TYPE);
    return <Navigate to={`?${next.toString()}`} replace />;
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title={names.plural}
        actionSlot={
          addPath && canImport ? (
            // Same control as the Individuals page: one "Add …" button with the manual form and the sheet options.
            <Dropdown>
              <Button variant="primary" className="!rounded-3xl font-medium" aria-label={`Add ${names.singular}`}>
                <IconPlus size={16} />
                {`Add ${names.singular}`}
                <IconChevronDown size={14} />
              </Button>
              <Dropdown.Popover className="min-w-max">
                <Dropdown.Menu
                  disabledKeys={importer.ready && !templateBusy ? [] : ["template"]}
                  onAction={(key) => {
                    if (key === "manual") navigate(addPath);
                    else if (key === "upload") setImportOpen(true);
                    else if (key === "template") void downloadTemplate();
                  }}
                >
                  <Dropdown.Item id="manual" textValue="Add manually">
                    <Label>Add manually</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="upload" textValue="Upload sheet">
                    <Label>Upload sheet</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="template" textValue="Download template">
                    <Label>{templateBusy ? "Preparing template…" : "Download template"}</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : undefined
        }
        actionLabel={addPath && !canImport ? `Add ${names.singular}` : undefined}
        onActionPress={addPath && !canImport ? () => navigate(addPath) : undefined}
      />

      <ContentTab
        items={tabs}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      {activeTab === "draft" ? (
        <DraftsTabContent
          entityType="cooperative"
          editPath={addPath ?? `/me/cooperatives/add-cooperative?type=${typeParam}`}
          groupType={typeParam}
        />
      ) : activeTab === "overview" ? (
        <CooperativeOverview type={typeParam} />
      ) : (
        <>
          {isError ? (
            <p className="text-sm text-(--danger)">
              {error instanceof ApiError ? error.message : "Failed to load cooperatives"}
            </p>
          ) : null}

          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <AppSelect
                name="provinceFilter"
                label="Province"
                placeholder="All Provinces"
                selectedKey={filters.province}
                onSelectionChange={setProvince}
                options={[{ label: "All Provinces", value: "" }, ...provinceOptions]}
              />
            </div>
            <div className="min-w-0 flex-1">
              <AppSelect
                name="districtFilter"
                label="District"
                placeholder="All Districts"
                selectedKey={filters.district}
                onSelectionChange={setDistrict}
                options={[{ label: "All Districts", value: "" }, ...districtOptions]}
              />
            </div>
            <div className="min-w-0 flex-1">
              <AppSelect
                name="valueChainFilter"
                label="Value Chain"
                placeholder="All Value Chains"
                selectedKey={filters.valueChain}
                onSelectionChange={setFilter("valueChain")}
                options={[{ label: "All Value Chains", value: "" }, ...valueChainOptions]}
              />
            </div>
            {hasActiveFilters ? (
              <Button size="sm" variant="secondary" onPress={() => { setFilters(EMPTY_COOPERATIVE_FILTERS); setTypeParam(""); }}>
                Clear filters
              </Button>
            ) : null}
          </div>

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
            itemsPerPage={10}
            searchPlaceholder={COOPERATIVE_SEARCH_PLACEHOLDER}
            searchKeys={[...COOPERATIVE_LIST_SEARCH_KEYS]}
            filterByTab={() => true}
            columns={COOPERATIVE_LIST_COLUMNS.map((c) => (c.key === "cooperativeName" ? { ...c, label: `${names.singular} Name` } : c))}
            minTableWidthClassName="min-w-[1100px]"
            actions={(row) => {
              if (role === "senior") {
                return [
                  { label: "View Details", onClick: () => view.open(row.id) },
                ];
              }
              return [
                { label: "View Details", onClick: () => view.open(row.id) },
                {
                  label: "Update",
                  onClick: () => navigate(cooperativeEditPath(Number(row.id), typeParam)),
                },
              ];
            }}
          />

          <RecordDetailsDialog
            testId="cooperative-details"
            isOpen={view.id !== null}
            onClose={view.close}
            fallbackTitle={`${names.singular} Details`}
            onEdit={role === "me" && view.id !== null ? () => navigate(cooperativeEditPath(view.id as number, typeParam)) : undefined}
            {...record}
          />
        </>
      )}

      {canImport ? (
        <CooperativeImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} type={typeParam} importer={importer} />
      ) : null}
    </div>
  );
}
