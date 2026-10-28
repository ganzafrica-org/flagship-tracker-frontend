import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Chip, Dropdown, Label } from "@heroui/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconChevronDown,
  IconUserPlus,
  IconUsers,
  IconUserCircle,
  IconUserShare,
  IconUserQuestion,
  IconUserCheck,
} from "@tabler/icons-react";

import AppSelect from "~/components/app-select";
import { ContentTab } from "~/components/content-tab";
import { toast } from "~/components/app-alert";
import ExportMenu from "~/components/export-menu";
import RecordDetailsDialog from "~/components/record-details-dialog";
import IndividualImportDialog from "~/components/pages/individuals/individual-import-dialog";
import { StatCard } from "~/components/stat-card";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import { deleteIndividual, individualsQueryOptions, type IndividualsPageItem } from "~/lib/queries/individuals";
import { flagshipSummaryQueryOptions, individualsDashboardQueryOptions } from "~/lib/queries/visualizations";
import { flagshipOptionsQueryOptions } from "~/lib/queries/cooperatives";
import { buildIndividualsExportData, downloadIndividual, exportIndividual, useIndividualSections, youthStatusLabel } from "~/lib/individual-details";
import DraftsTabContent from "~/components/offline-drafts/drafts-tab-content";
import { useDraftCount } from "~/lib/offline-drafts/use-drafts";
import { useRecordDialog } from "~/lib/use-record-dialog";
import type { ExportFormat } from "~/lib/export/table-export";
import { useUrlState } from "~/lib/use-url-state";
import { PageTitleCard } from "~/components/page-title-card";
import VizRefreshButton from "~/components/viz-refresh-button";
import TableComponent from "~/components/table-component";
import {
  canonicalProvince,
  districtMatches,
  inferProvinceForDistrict,
  listAllRwandaDistricts,
  listRwandaDistricts,
  listRwandaProvinces,
  provinceKey,
  provinceMatches,
} from "~/lib/rwanda-locations";

const COLUMNS = [
  { key: "id",         label: "#",        width: "50px"  },
  { key: "name",       label: "Name",     width: "180px" },
  { key: "sex",        label: "Sex",      width: "72px"  },
  { key: "youthStatus", label: "Youth Status", width: "130px" },
  { key: "flagship",   label: "Flagship", width: "320px" },
  { key: "location",   label: "Location", width: "150px" },
  { key: "valueChain", label: "Value Chain", width: "220px" },
  { key: "action",     label: "Action",   width: "72px"  },
];

interface IndividualsListProps {
  addPath?: string;
  updatePath?: string;
  readOnly?: boolean;
  showHeader?: boolean;
  /** M&E: row actions limited to View / Update / Delete — no downloads. */
  hideDownload?: boolean;
  /** M&E only: adds a "Draft" tab showing locally-saved offline individual submissions. */
  showDraftTab?: boolean;
}

type ViewMode = "overview" | "list" | "draft";
type YouthStatusFilter = "all" | "youth" | "non_youth" | "unknown";

type IndividualsTableRow = {
  id: number;
  name: string;
  sex: string;
  youthStatus: string;
  flagship: string;
  location: string;
  valueChain: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  flagshipFilterKey: string;
};

const OVERVIEW_TABS = [
  { id: "overview", label: "Overview" },
  { id: "list", label: "Individuals List" },
] as const;

const CHART_COLORS = [
  "var(--accent)",
  "var(--warning)",
  "var(--forest)",
  "var(--danger)",
  "var(--success)",
  "var(--muted)",
];

function byCountDesc(a: { value: number }, b: { value: number }) {
  return b.value - a.value;
}

function ensureSelectedOption(
  options: { value: string; label: string; displayLabel?: string }[],
  selectedKey: string,
  fallbackLabel: string,
  matches?: (optionValue: string, selected: string) => boolean,
) {
  if (!selectedKey || selectedKey === "all") return options;
  if (options.some((option) => option.value === selectedKey)) return options;
  if (matches) {
    const aliasMatch = options.find((option) => matches(option.value, selectedKey));
    if (aliasMatch) return options;
  }
  return [...options, { value: selectedKey, label: fallbackLabel, displayLabel: fallbackLabel }];
}

function flagshipTriggerLabel(fullLabel: string): string {
  if (fullLabel === "All Flagships") return fullLabel;
  const separator = " — ";
  if (!fullLabel.includes(separator)) {
    return fullLabel.length > 26 ? `${fullLabel.slice(0, 26)}…` : fullLabel;
  }
  const [code, ...nameParts] = fullLabel.split(separator);
  const name = nameParts.join(separator).trim();
  const shortName = name.length > 14 ? `${name.slice(0, 14)}…` : name;
  return `${code.trim()} — ${shortName}`;
}

/** Infer province from district using individuals data first, then Rwanda lookups. */
function inferProvinceForDistrictFromData(
  district: string,
  individuals: { province: string; district: string }[],
): string | null {
  if (!district || district === "all") return null;

  const match = individuals.find((ind) => districtMatches(ind.district, district));
  if (match?.province?.trim()) return canonicalProvince(match.province) ?? match.province.trim();

  return inferProvinceForDistrict(district);
}

/** individual.youth_status → filter/badge key; anything other than youth / non_youth is "unknown". */
function youthStatusKey(value: string | null | undefined): Exclude<YouthStatusFilter, "all"> {
  if (value === "youth") return "youth";
  if (value === "non_youth") return "non_youth";
  return "unknown";
}

const YOUTH_STATUS_BADGES: Record<Exclude<YouthStatusFilter, "all">, { label: string; color: "success" | "default" | "warning" }> = {
  youth: { label: "Youth", color: "success" },
  non_youth: { label: "Non-youth", color: "default" },
  unknown: { label: "Unknown", color: "warning" },
};

function matchesIndividualFilters(
  ind: IndividualsPageItem,
  filters: {
    youthStatus: YouthStatusFilter;
    province: string;
    district: string;
    flagship: string;
    valueChain: string;
  },
): boolean {
  if (filters.youthStatus !== "all" && youthStatusKey(ind.youthStatus) !== filters.youthStatus) return false;
  if (filters.valueChain) {
    const wanted = filters.valueChain.trim().toLowerCase();
    if (!(ind.valueChainNames ?? []).some((vc) => vc.trim().toLowerCase() === wanted)) return false;
  }
  if (!provinceMatches(ind.province, filters.province)) return false;
  if (!districtMatches(ind.district, filters.district)) return false;
  if (filters.flagship !== "all" && !(ind.flagshipNames ?? []).includes(filters.flagship)) {
    return false;
  }
  return true;
}

function individualToTableRow(ind: IndividualsPageItem): IndividualsTableRow {
  return {
    id: ind.individualId,
    name: `${ind.firstName} ${ind.lastName}`,
    sex: ind.sex,
    youthStatus: youthStatusKey(ind.youthStatus),
    flagship: ind.flagshipNames?.length ? ind.flagshipNames.join(", ") : "—",
    location: [ind.district, ind.province].filter(Boolean).join(", "),
    valueChain: ind.valueChainNames?.length ? ind.valueChainNames.join(", ") : "—",
    province: ind.province,
    district: ind.district,
    sector: ind.sector,
    cell: ind.cell,
    flagshipFilterKey: ind.flagshipNames?.join("||") ?? "",
  };
}

function ValueChainTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; stages?: { stage: string; count: number }[] } }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, stages = [] } = payload[0].payload;
  const breakdown = stages.map((s) => `${s.stage.replace(/_/g, " ")} ${s.count}`).join(", ");
  return (
    <div className="rounded-lg border border-(--separator) bg-(--surface) px-3 py-2 text-sm shadow">
      {name}: {value}
      {breakdown ? ` (${breakdown})` : ""}
    </div>
  );
}

export default function IndividualsList({
  addPath,
  updatePath,
  readOnly = false,
  showHeader = true,
  hideDownload = false,
  showDraftTab = false,
}: IndividualsListProps) {
  const navigate = useNavigate();
  const draftCount = useDraftCount(showDraftTab ? "individual" : undefined);
  const overviewTabItems: { id: string; label: string }[] = showDraftTab
    ? [...OVERVIEW_TABS, { id: "draft", label: draftCount ? `Draft (${draftCount})` : "Draft" }]
    : [...OVERVIEW_TABS];
  const [, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const view = useRecordDialog();
  const record = useIndividualSections(view.id);
  const [importOpen, setImportOpen] = useState(false);
  // Filters live in the URL so the view is shareable.
  const [selectedProvince, setSelectedProvince] = useUrlState("province", "all");
  const [selectedDistrict, setSelectedDistrict] = useUrlState("district", "all");
  const [selectedFlagship, setSelectedFlagship] = useUrlState("flagship", "all");
  const [selectedValueChain, setSelectedValueChain] = useUrlState("valueChain", "");
  // Arriving with a value-chain filter (e.g. from the dashboard) opens the list.
  const [viewMode, setViewMode] = useState<ViewMode>(selectedValueChain ? "list" : "overview");
  const [selectedYouthStatusRaw, setSelectedYouthStatus] = useUrlState("youthStatus", "all");
  const selectedYouthStatus = (["youth", "non_youth", "unknown"].includes(selectedYouthStatusRaw)
    ? selectedYouthStatusRaw
    : "all") as YouthStatusFilter;
  const resolvedProvince =
    selectedProvince === "all" ? "all" : (canonicalProvince(selectedProvince) ?? selectedProvince);
  const { data: individuals = [], isLoading, isError, error } = useQuery(individualsQueryOptions);

  const setLocationFilters = useCallback(
    (next: { province?: string; district?: string }) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);

          if (next.province !== undefined) {
            const province = next.province || "all";
            if (province === "all") updated.delete("province");
            else updated.set("province", province);
          }

          if (next.district !== undefined) {
            const district = next.district || "all";
            if (district === "all") updated.delete("district");
            else updated.set("district", district);
          }

          return updated;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleProvinceChange = useCallback(
    (value: string) => {
      const province = value || "all";
      setLocationFilters({ province, district: "all" });
    },
    [setLocationFilters],
  );

  const handleDistrictChange = useCallback(
    (value: string) => {
      const district = value || "all";
      if (district === "all") {
        setLocationFilters({ district: "all" });
        return;
      }

      const province =
        resolvedProvince === "all"
          ? inferProvinceForDistrictFromData(district, individuals)
          : resolvedProvince;

      if (province && province !== "all") {
        setLocationFilters({ province, district });
        return;
      }

      setLocationFilters({ district });
    },
    [individuals, resolvedProvince, setLocationFilters],
  );

  useEffect(() => {
    if (selectedProvince === "all") return;
    const canonical = canonicalProvince(selectedProvince);
    if (canonical && canonical !== selectedProvince) {
      setSelectedProvince(canonical);
    }
  }, [selectedProvince, setSelectedProvince]);

  // Value-chain chart still comes from the visualizations API; KPI cards and other
  // overview charts are derived from filteredIndividuals so they match the list.
  const { data: viz, isFetching: vizFetching } = useQuery(
    individualsDashboardQueryOptions({
      province: resolvedProvince === "all" ? undefined : resolvedProvince,
      district: selectedDistrict === "all" ? undefined : selectedDistrict,
      view: selectedYouthStatus === "youth" ? "youth" : "all",
      flagship: selectedFlagship === "all" ? undefined : selectedFlagship,
    }),
  );

  const deleteMutation = useMutation({
    mutationFn: deleteIndividual,
    onSuccess: () => {
      setSubmitError(null);
      void queryClient.invalidateQueries({ queryKey: individualsQueryOptions.queryKey });
    },
    onError: (err: Error) => {
      if (err instanceof ApiError) {
        setSubmitError(formatApiErrorMessage(err.message));
        return;
      }
      setSubmitError(err.message || "Failed to delete individual");
    },
  });

  const activeFilters = useMemo(
    () => ({
      youthStatus: selectedYouthStatus,
      province: resolvedProvince,
      district: selectedDistrict,
      flagship: selectedFlagship,
      valueChain: selectedValueChain,
    }),
    [selectedYouthStatus, resolvedProvince, selectedDistrict, selectedFlagship, selectedValueChain],
  );

  const filteredIndividuals = useMemo(
    () => individuals.filter((ind) => matchesIndividualFilters(ind, activeFilters)),
    [individuals, activeFilters],
  );

  const rows = useMemo<IndividualsTableRow[]>(
    () => filteredIndividuals.map(individualToTableRow),
    [filteredIndividuals],
  );

  // Static Rwanda provinces — always show all five in the dropdown.
  const provinceOptions = useMemo(() => {
    const base = [
      { value: "all", label: "All Provinces", displayLabel: "All Provinces" },
      ...listRwandaProvinces().map((v) => ({ value: v, label: v, displayLabel: v })),
    ];
    return ensureSelectedOption(base, resolvedProvince, resolvedProvince, (a, b) => provinceKey(a) === provinceKey(b));
  }, [resolvedProvince]);

  const districtOptions = useMemo(() => {
    const fromData = individuals
      .filter((ind) => provinceMatches(ind.province, resolvedProvince))
      .map((ind) => ind.district)
      .filter(Boolean);
    const fromRwanda =
      resolvedProvince === "all" ? listAllRwandaDistricts() : listRwandaDistricts(resolvedProvince);
    const merged = [...new Set([...fromRwanda, ...fromData])].sort((a, b) => a.localeCompare(b));
    const base = [
      { value: "all", label: "All Districts", displayLabel: "All Districts" },
      ...merged.map((v) => ({ value: v, label: v, displayLabel: v })),
    ];
    return ensureSelectedOption(base, selectedDistrict, selectedDistrict);
  }, [individuals, resolvedProvince, selectedDistrict]);

  // Infer province once when landing with a district in the URL but no province.
  useEffect(() => {
    if (selectedDistrict === "all" || selectedProvince !== "all") return;
    const province = inferProvinceForDistrictFromData(selectedDistrict, individuals);
    if (province) setLocationFilters({ province, district: selectedDistrict });
  }, [individuals, selectedDistrict, selectedProvince, setLocationFilters]);

  useEffect(() => {
    if (
      selectedDistrict !== "all" &&
      !districtOptions.some((option) => option.value === selectedDistrict)
    ) {
      setSelectedDistrict("all");
    }
  }, [districtOptions, selectedDistrict, setSelectedDistrict]);

  // Flagship filter is fed by the real flagships endpoint. The value is the
  // flagship NAME so it matches the names individuals carry.
  const { data: flagshipApiOptions = [] } = useQuery(flagshipOptionsQueryOptions());
  const flagshipOptions = useMemo(
    () => {
      const base = [
        { value: "all", label: "All Flagships", displayLabel: "All Flagships" },
        ...flagshipApiOptions.map((f) => {
          const name = f.label.includes(" — ") ? f.label.split(" — ").slice(1).join(" — ") : f.label;
          return {
            value: name,
            label: f.label,
            displayLabel: flagshipTriggerLabel(f.label),
          };
        }),
      ];
      return ensureSelectedOption(
        base,
        selectedFlagship,
        flagshipTriggerLabel(selectedFlagship),
      ).map((option) =>
        option.value === selectedFlagship && selectedFlagship !== "all" && !option.displayLabel
          ? { ...option, displayLabel: flagshipTriggerLabel(option.label) }
          : option,
      );
    },
    [flagshipApiOptions, selectedFlagship],
  );

  const youthStatusOptions = [
    { value: "all", label: "All", displayLabel: "All" },
    { value: "youth", label: "Youth", displayLabel: "Youth" },
    { value: "non_youth", label: "Non-youth", displayLabel: "Non-youth" },
    { value: "unknown", label: "Unknown", displayLabel: "Unknown" },
  ];

  const filteredRows = rows;

  const listEmptyMessage = useMemo(() => {
    const locationFiltered = resolvedProvince !== "all" || selectedDistrict !== "all";
    if (locationFiltered) return "No individuals found for the selected location";
    if (selectedValueChain) return "No individuals found for the selected value chain";
    if (selectedFlagship !== "all") return "No individuals found for the selected flagship";
    if (selectedYouthStatus !== "all") return `No ${YOUTH_STATUS_BADGES[selectedYouthStatus].label.toLowerCase()} individuals found`;
    return "No individuals yet";
  }, [selectedYouthStatus, selectedDistrict, selectedFlagship, selectedValueChain, resolvedProvince]);

  // KPI cards use the same filtered individuals as the list so numbers always match.
  const kpis = useMemo(
    () => ({
      totalIndividuals: filteredIndividuals.length,
      inFlagships: filteredIndividuals.filter((ind) => (ind.flagshipNames?.length ?? 0) > 0).length,
      outsideFlagships: filteredIndividuals.filter((ind) => (ind.flagshipNames?.length ?? 0) === 0).length,
      // Total registered individuals who are youth — there's no youth disaggregation on the
      // jobs_created KPI, so this comes from individual.youth_status, not mv_flagship_summary.
      youthTotal: filteredIndividuals.filter((ind) => youthStatusKey(ind.youthStatus) === "youth").length,
    }),
    [filteredIndividuals],
  );

  // Female jobs card comes from mv_flagship_summary (flagship-level, no location breakdown), so
  // only the Flagship filter applies; Province / District / Youth Status do not. Nulls count as 0.
  const { data: summaryRows } = useQuery(flagshipSummaryQueryOptions);
  const jobs = useMemo(() => {
    if (!summaryRows) return null;
    const rows =
      selectedFlagship === "all" ? summaryRows : summaryRows.filter((f) => f.flagshipName === selectedFlagship);
    return {
      female: Math.round(rows.reduce((sum, f) => sum + (f.jobsCreatedFemale ?? 0), 0)),
      scope: selectedFlagship === "all" ? "across all flagships" : `in ${rows[0]?.flagshipCode ?? selectedFlagship}`,
    };
  }, [summaryRows, selectedFlagship]);

  const sexData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ind of filteredIndividuals) {
      counts.set(ind.sex, (counts.get(ind.sex) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value], idx) => ({
      name,
      value,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [filteredIndividuals]);

  const [valueChainRank, setValueChainRank] = useState<"highest" | "lowest">("highest");
  const valueChainData = useMemo(() => {
    // 1. Combine stages: one entry per value chain (name matched ignoring case/spaces),
    //    value = sum of its stage counts, stages = breakdown for the tooltip.
    const combined = new Map<string, { name: string; value: number; stages: Map<string, number> }>();
    for (const item of viz?.byValueChain ?? []) {
      const key = item.name.trim().toLowerCase();
      const entry = combined.get(key) ?? { name: item.name.trim(), value: 0, stages: new Map<string, number>() };
      entry.value += item.value;
      const stages = item.stages?.length ? item.stages : [];
      for (const s of stages) entry.stages.set(s.stage, (entry.stages.get(s.stage) ?? 0) + s.count);
      combined.set(key, entry);
    }
    // 2. Then rank on the combined totals. Lowest 5 only considers chains with at least one individual.
    return Array.from(combined.values())
      .filter((item) => item.value > 0)
      .sort((a, b) => (valueChainRank === "highest" ? b.value - a.value : a.value - b.value) || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((item, idx) => ({
        name: item.name,
        value: item.value,
        stages: Array.from(item.stages, ([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count),
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      }));
  }, [viz, valueChainRank]);

  // DEBUG: remove once the individuals overview data has been inspected
  useEffect(() => {
    if (!viz) return;
    console.log("[Individuals] raw overview API response (/api/visualizations/individuals):", viz);
  }, [viz]);

  useEffect(() => {
    if (isLoading) return;
    console.log("[Individuals] raw individuals list:", individuals.length, "items", individuals);
    console.log("[Individuals] cards (kpis):", kpis);
    console.log("[Individuals] chart data — Individuals by value chain:", valueChainData);
    console.log("[Individuals] chart data — by sex:", sexData);
  }, [
    isLoading, individuals, kpis, valueChainData, sexData,
  ]);

  async function handleDownload(individualId: number, format: ExportFormat) {
    try {
      await downloadIndividual(queryClient, individualId, format);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download this individual");
    }
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {showHeader ? (
        <PageTitleCard
          title="Individuals"
          actionSlot={
            readOnly ? undefined : (
              <div className="flex gap-3">
                {addPath && (
                  <Dropdown>
                    <Button variant="primary" className="!rounded-3xl font-medium" aria-label="Add Individual">
                      <IconUserPlus size={16} />
                      Add Individual
                      <IconChevronDown size={14} />
                    </Button>
                    <Dropdown.Popover className="min-w-max">
                      <Dropdown.Menu
                        onAction={(key) => {
                          if (key === "manual") navigate(addPath, { viewTransition: true });
                          else setImportOpen(true);
                        }}
                      >
                        <Dropdown.Item id="manual" textValue="Add manually">
                          <Label>Add manually</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="upload" textValue="Upload sheet">
                          <Label>Upload sheet</Label>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                )}
              </div>
            )
          }
        />
      ) : null}
      {submitError ? (
        <p className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
          {submitError}
        </p>
      ) : null}
      {isError ? (
        <p className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
          {error instanceof Error ? error.message : "Failed to load individuals."}
        </p>
      ) : null}
      <ContentTab
        items={overviewTabItems}
        activeId={viewMode}
        onChange={(id) => setViewMode(id as ViewMode)}
      />

      <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
        <AppSelect
          name="overviewProvince"
          label="Province"
          className="w-full min-w-0 lg:flex-1"
          options={provinceOptions}
          selectedKey={resolvedProvince}
          onSelectionChange={handleProvinceChange}
        />
        <AppSelect
          name="overviewDistrict"
          label="District"
          className="w-full min-w-0 lg:flex-1"
          options={districtOptions}
          selectedKey={selectedDistrict}
          onSelectionChange={handleDistrictChange}
        />
        <div className="hidden shrink-0 lg:block lg:w-5" aria-hidden />
        <AppSelect
          name="overviewYouthStatus"
          label="Youth Status"
          className="w-full min-w-0 lg:flex-1"
          options={youthStatusOptions}
          selectedKey={selectedYouthStatus}
          onSelectionChange={(value) => setSelectedYouthStatus(value || "all")}
        />
        <AppSelect
          name="overviewFlagship"
          label="Flagship"
          className="w-full min-w-0 lg:flex-[1.25]"
          options={flagshipOptions}
          selectedKey={selectedFlagship}
          onSelectionChange={(value) => setSelectedFlagship(value || "all")}
        />
        <div className="w-full shrink-0 lg:w-auto">
          {viewMode === "overview" ? <VizRefreshButton className="w-full justify-center lg:w-auto" /> : null}
        </div>
      </div>

      {selectedValueChain ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-(--default) px-3 py-1">
            Value chain: <strong>{selectedValueChain}</strong>
          </span>
          <Button size="sm" variant="secondary" onPress={() => setSelectedValueChain("")}>
            Clear value chain
          </Button>
        </div>
      ) : null}

      {vizFetching ? (
        <p className="text-xs text-(--muted)">Updating overview for selected location…</p>
      ) : null}

      {viewMode === "draft" ? (
        <DraftsTabContent entityType="individual" editPath={addPath ?? "/me/individuals/add-individual"} />
      ) : viewMode === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              color="var(--accent)"
              iconBackground="var(--accent-icon-bg)"
              icon={<IconUsers size={18} />}
              stat={kpis.totalIndividuals}
              label="Total individuals registered"
            />
            <StatCard
              color="var(--warning)"
              iconBackground="var(--warning-icon-bg)"
              icon={<IconUserCheck size={18} />}
              stat={kpis.inFlagships}
              label="Individuals in flagships"
            />
            <StatCard
              color="var(--danger)"
              iconBackground="var(--danger-icon-bg)"
              icon={<IconUserQuestion size={18} />}
              stat={kpis.outsideFlagships}
              label="Individuals outside flagships"
            />
            <StatCard
              color="var(--forest)"
              iconBackground="var(--forest-icon-bg)"
              icon={<IconUserCircle size={18} />}
              stat={jobs ? jobs.female.toLocaleString("en-US") : "—"}
              label={`Female jobs ${jobs?.scope ?? "across all flagships"}`}
            />
            <StatCard
              color="var(--success)"
              iconBackground="var(--success-icon-bg)"
              icon={<IconUserShare size={18} />}
              stat={kpis.youthTotal.toLocaleString("en-US")}
              label="Total youth registered"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-base font-semibold">Individuals by sex</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sexData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {sexData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold">Individuals by value chain</h3>
                <AppSelect
                  name="valueChainRank"
                  label="Show"
                  className="w-40 min-w-0"
                  options={[
                    { label: "Highest 5", value: "highest" },
                    { label: "Lowest 5", value: "lowest" },
                  ]}
                  selectedKey={valueChainRank}
                  onSelectionChange={(v) => setValueChainRank(v === "lowest" ? "lowest" : "highest")}
                />
              </div>
              <div style={{ height: Math.max(256, valueChainData.length * 40 + 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valueChainData} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={160} interval={0} />
                    <Tooltip content={<ValueChainTooltip />} />
                    <Bar dataKey="value">
                      {valueChainData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>
        </div>
      ) : (
        <TableComponent
          tableSectionTitle="Individuals List"
          tableAriaLabel="Individuals table"
          loading={isLoading}
          emptyMessage={listEmptyMessage}
          columns={COLUMNS}
          rows={filteredRows}
          minTableWidthClassName="min-w-[1100px]"
          exportConfig={{
            title: "Individuals List",
            fileBase: "individuals",
            values: { youthStatus: (row) => youthStatusLabel(String(row.youthStatus)) },
            // Full per-individual detail (same as the View dialog), not just the compact table columns.
            getExportData: () => buildIndividualsExportData(queryClient, filteredIndividuals),
          }}
          searchPlaceholder="Search by name, sex, youth status, location, flagship, value chain…"
          searchKeys={["name", "sex", "youthStatus", "location", "valueChain", "flagship", "province", "district"]}
          cellRenderers={{
            youthStatus: (row) => {
              const badge = YOUTH_STATUS_BADGES[youthStatusKey(String(row.youthStatus))];
              return (
                <Chip size="sm" variant="soft" color={badge.color}>
                  {badge.label}
                </Chip>
              );
            },
            flagship: (row) => (
              <span
                className="block min-w-[280px] max-w-[320px] text-sm leading-snug whitespace-normal text-(--foreground)"
                title={String(row.flagship ?? "")}
              >
                {String(row.flagship ?? "—")}
              </span>
            ),
          }}
          filterByTab={() => true}
          actions={(row) => [
            { label: "View", onClick: () => view.open(Number(row.id)) },
            ...(hideDownload
              ? []
              : [
                  { label: "Download (.xlsx)", onClick: () => handleDownload(Number(row.id), "xlsx") },
                  { label: "Download (.pdf)", onClick: () => handleDownload(Number(row.id), "pdf") },
                ]),
            ...(readOnly
              ? []
              : [
                  {
                    label: "Update",
                    onClick: () =>
                      updatePath
                        ? navigate(`${updatePath}?editId=${row.id}`, { viewTransition: true })
                        : undefined,
                  },
                  {
                    label: "Delete",
                    onClick: () => {
                      const confirmed = window.confirm("Delete this individual?");
                      if (!confirmed) return;
                      deleteMutation.mutate(Number(row.id));
                    },
                    color: "danger" as const,
                  },
                ]),
          ]}
        />
      )}
      <RecordDetailsDialog
        testId="individual-details"
        isOpen={view.id !== null}
        onClose={view.close}
        title={record.detail ? `${record.detail.firstName} ${record.detail.lastName}` : null}
        fallbackTitle="Individual"
        isLoading={record.isLoading}
        isError={record.isError}
        onRetry={record.onRetry}
        sections={record.sections}
        actions={
          record.detail ? (
            <ExportMenu
              label="Download"
              onExport={(format) => record.detail && exportIndividual(record.detail, record.sections, format)}
            />
          ) : undefined
        }
        onEdit={!readOnly && updatePath && view.id !== null ? () => navigate(`${updatePath}?editId=${view.id}`, { viewTransition: true }) : undefined}
      />
      {!readOnly && addPath ? (
        <IndividualImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} individualsPath={pathname} />
      ) : null}
    </div>
  );
}
