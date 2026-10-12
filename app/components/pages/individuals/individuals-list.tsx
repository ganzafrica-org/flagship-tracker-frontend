import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card } from "@heroui/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconChartBar,
  IconUserPlus,
  IconUsers,
  IconUserCircle,
  IconUserShare,
  IconUserQuestion,
  IconUserCheck,
} from "@tabler/icons-react";

import AppSelect from "~/components/app-select";
import { ContentTab } from "~/components/content-tab";
import { StatCard } from "~/components/stat-card";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import { deleteIndividual, individualsQueryOptions, type IndividualsPageItem } from "~/lib/queries/individuals";
import { individualsDashboardQueryOptions } from "~/lib/queries/visualizations";
import { flagshipOptionsQueryOptions } from "~/lib/queries/cooperatives";
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

const CATEGORY_LABELS: Record<string, string> = {
  student: "Student",
  graduate: "Graduate",
  neet: "NEET",
  employed: "Employed",
  self_employed: "Self-Employed",
  other: "Other",
};

const COLUMNS = [
  { key: "id",         label: "#",        width: "50px"  },
  { key: "name",       label: "Name",     width: "180px" },
  { key: "sex",        label: "Sex",      width: "72px"  },
  { key: "category",   label: "Category", width: "110px" },
  { key: "flagship",   label: "Flagship", width: "320px" },
  { key: "location",   label: "Location", width: "150px" },
  { key: "source",     label: "Source",   width: "100px" },
  { key: "action",     label: "Action",   width: "72px"  },
];

const COLUMNS_READONLY = COLUMNS.filter((c) => c.key !== "action");

const STATUS_COLOR_MAP: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  flagship:  "accent",
  "walk-in": "success",
  referral:  "warning",
  survey:    "default",
};

interface IndividualsListProps {
  addPath?: string;
  updatePath?: string;
  readOnly?: boolean;
  showHeader?: boolean;
}

type ViewMode = "overview" | "list";
type CategoryMode = "all" | "youth";

type IndividualsTableRow = {
  id: number;
  name: string;
  sex: string;
  category: string;
  flagship: string;
  location: string;
  source: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  flagshipFilterKey: string;
  isYouth: boolean;
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

function matchesIndividualFilters(
  ind: IndividualsPageItem,
  filters: {
    categoryMode: CategoryMode;
    province: string;
    district: string;
    flagship: string;
  },
): boolean {
  if (filters.categoryMode === "youth" && !ind.youthCategory) return false;
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
    category: ind.youthCategory ? (CATEGORY_LABELS[ind.youthCategory] ?? ind.youthCategory) : "—",
    flagship: ind.flagshipNames?.length ? ind.flagshipNames.join(", ") : "—",
    location: [ind.district, ind.province].filter(Boolean).join(", "),
    source: ind.registrationSource,
    province: ind.province,
    district: ind.district,
    sector: ind.sector,
    cell: ind.cell,
    flagshipFilterKey: ind.flagshipNames?.join("||") ?? "",
    isYouth: Boolean(ind.youthCategory),
  };
}

export default function IndividualsList({
  addPath,
  updatePath,
  readOnly = false,
  showHeader = true,
}: IndividualsListProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  // Filters live in the URL so the view is shareable.
  const [selectedProvince, setSelectedProvince] = useUrlState("province", "all");
  const [selectedDistrict, setSelectedDistrict] = useUrlState("district", "all");
  const [selectedFlagship, setSelectedFlagship] = useUrlState("flagship", "all");
  const [selectedCategoryModeRaw, setSelectedCategoryMode] = useUrlState("view", "all");
  const selectedCategoryMode = selectedCategoryModeRaw as CategoryMode;
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
      view: selectedCategoryMode === "youth" ? "youth" : "all",
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
      categoryMode: selectedCategoryMode,
      province: resolvedProvince,
      district: selectedDistrict,
      flagship: selectedFlagship,
    }),
    [selectedCategoryMode, resolvedProvince, selectedDistrict, selectedFlagship],
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

  const categoryViewOptions = [
    { value: "all", label: "All Individuals", displayLabel: "All Individuals" },
    { value: "youth", label: "Youth Only", displayLabel: "Youth Only" },
  ];

  const filteredRows = rows;

  const listEmptyMessage = useMemo(() => {
    const locationFiltered = resolvedProvince !== "all" || selectedDistrict !== "all";
    if (locationFiltered) return "No individuals found for the selected location";
    if (selectedFlagship !== "all") return "No individuals found for the selected flagship";
    if (selectedCategoryMode === "youth") return "No youth individuals found";
    return "No individuals yet";
  }, [selectedCategoryMode, selectedDistrict, selectedFlagship, resolvedProvince]);

  // KPI cards use the same filtered individuals as the list so numbers always match.
  const kpis = useMemo(
    () => ({
      totalIndividuals: filteredIndividuals.length,
      inFlagships: filteredIndividuals.filter((ind) => (ind.flagshipNames?.length ?? 0) > 0).length,
      outsideFlagships: filteredIndividuals.filter((ind) => (ind.flagshipNames?.length ?? 0) === 0).length,
      females: filteredIndividuals.filter((ind) => ind.sex === "Female").length,
      youth: filteredIndividuals.filter((ind) => Boolean(ind.youthCategory)).length,
    }),
    [filteredIndividuals],
  );

  const flagshipVsNonFlagshipData = useMemo(() => {
    const enrolled = filteredIndividuals.filter((ind) => (ind.flagshipNames?.length ?? 0) > 0).length;
    const notEnrolled = filteredIndividuals.length - enrolled;
    return [
      { name: "Enrolled", value: enrolled, fill: "var(--accent)" },
      { name: "Not Enrolled", value: notEnrolled, fill: "var(--warning)" },
    ];
  }, [filteredIndividuals]);

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

  const youthCategoryData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ind of filteredIndividuals) {
      if (!ind.youthCategory) continue;
      const label = CATEGORY_LABELS[ind.youthCategory] ?? ind.youthCategory;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value], idx) => ({
      name,
      value,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [filteredIndividuals]);

  const registeredOverTimeData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ind of filteredIndividuals) {
      const date = new Date(ind.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      counts.set(month, (counts.get(month) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, value }));
  }, [filteredIndividuals]);

  const valueChainData = useMemo(
    () =>
      (viz?.byValueChain ?? []).map((item, idx) => ({
        name: item.name,
        value: item.value,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    [viz],
  );

  const enrolledPerFlagshipData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ind of filteredIndividuals) {
      for (const flagship of ind.flagshipNames ?? []) {
        counts.set(flagship, (counts.get(flagship) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      }));
  }, [filteredIndividuals]);

  return (
    <div className="space-y-6 w-full min-w-0">
      {showHeader ? (
        <PageTitleCard
          title="Individuals"
          actionSlot={
            readOnly ? undefined : (
              <div className="flex gap-3">
                {addPath && (
                  <Button
                    variant="primary"
                    className="!rounded-3xl font-medium"
                    onPress={() => navigate(addPath, { viewTransition: true })}
                  >
                    <IconUserPlus size={16} />
                    Add Individual
                  </Button>
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
        items={[...OVERVIEW_TABS]}
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
          name="overviewCategory"
          label="Category View"
          className="w-full min-w-0 lg:flex-1"
          options={categoryViewOptions}
          selectedKey={selectedCategoryMode}
          onSelectionChange={(value) => setSelectedCategoryMode((value || "all") as CategoryMode)}
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

      {vizFetching ? (
        <p className="text-xs text-(--muted)">Updating overview for selected location…</p>
      ) : null}

      {viewMode === "overview" ? (
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
              stat={kpis.females}
              label="Female individuals"
            />
            <StatCard
              color="var(--success)"
              iconBackground="var(--success-icon-bg)"
              icon={<IconUserShare size={18} />}
              stat={kpis.youth}
              label="Youth individuals"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-base font-semibold">Flagship vs non-flagship proportion</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={flagshipVsNonFlagshipData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {flagshipVsNonFlagshipData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

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
              <h3 className="mb-3 text-base font-semibold">Individuals by youth category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={youthCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {youthCategoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-base font-semibold">Individuals registered over time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={registeredOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-base font-semibold">Individuals by value chain</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valueChainData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {valueChainData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-base font-semibold">Individuals enrolled per flagship</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrolledPerFlagshipData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {enrolledPerFlagshipData.map((entry) => (
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
          columns={readOnly ? COLUMNS_READONLY : COLUMNS}
          rows={filteredRows}
          minTableWidthClassName="min-w-[1054px]"
          searchPlaceholder="Search by name, sex, category, location, flagship, source…"
          searchKeys={["name", "sex", "category", "location", "source", "flagship", "province", "district"]}
          statusColumnKey="source"
          statusColorMap={STATUS_COLOR_MAP}
          cellRenderers={{
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
          actions={
            readOnly
              ? undefined
              : (row) => [
                  {
                    label: "View Details",
                    onClick: () =>
                      updatePath
                        ? navigate(`${updatePath}?editId=${row.id}&mode=view`, { viewTransition: true })
                        : undefined,
                  },
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
                    color: "danger",
                  },
                ]
          }
        />
      )}
    </div>
  );
}
