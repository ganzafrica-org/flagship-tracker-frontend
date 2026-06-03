import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
import { PageTitleCard } from "~/components/page-title-card";
import TableComponent from "~/components/table-component";

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
  { key: "name",       label: "Name",     width: "200px" },
  { key: "sex",        label: "Sex",      width: "80px"  },
  { key: "category",   label: "Category", width: "120px" },
  { key: "flagship",   label: "Flagship", width: "130px" },
  { key: "location",   label: "Location", width: "160px" },
  { key: "source",     label: "Source",   width: "110px" },
  { key: "action",     label: "Action",   width: "80px"  },
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

function normalize(v: string | null | undefined): string {
  return (v ?? "").trim();
}

export default function IndividualsList({
  addPath,
  updatePath,
  readOnly = false,
  showHeader = true,
}: IndividualsListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedFlagship, setSelectedFlagship] = useState("all");
  const [selectedCategoryMode, setSelectedCategoryMode] = useState<CategoryMode>("all");
  const { data: individuals = [], isLoading, isError, error } = useQuery(individualsQueryOptions);

  // Overview charts are served by the visualizations API (server-side dedup +
  // youth MV + location filters). Cards are always system-wide per spec.
  const { data: viz } = useQuery(
    individualsDashboardQueryOptions({
      province: selectedProvince === "all" ? undefined : selectedProvince,
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

  const rows = useMemo<IndividualsTableRow[]>(
    () =>
      individuals.map((ind) => ({
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
      })),
    [individuals],
  );

  const provinceOptions = useMemo(() => {
    const provinces = Array.from(new Set(rows.map((r) => normalize(r.province)).filter(Boolean))).sort();
    return [{ value: "all", label: "All Provinces" }, ...provinces.map((v) => ({ value: v, label: v }))];
  }, [rows]);

  const districtOptions = useMemo(() => {
    const districts = Array.from(
      new Set(
        rows
          .filter((r) => selectedProvince === "all" || r.province === selectedProvince)
          .map((r) => normalize(r.district))
          .filter(Boolean),
      ),
    ).sort();
    return [{ value: "all", label: "All Districts" }, ...districts.map((v) => ({ value: v, label: v }))];
  }, [rows, selectedProvince]);

  const flagshipOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        individuals.flatMap((item) => item.flagshipNames.map((name) => normalize(name))).filter(Boolean),
      ),
    ).sort();
    return [{ value: "all", label: "All Flagships" }, ...names.map((name) => ({ value: name, label: name }))];
  }, [individuals]);

  const categoryViewOptions = [
    { value: "all", label: "All Individuals" },
    { value: "youth", label: "Youth Only" },
  ];

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (selectedCategoryMode === "youth" && !row.isYouth) return false;
        if (selectedProvince !== "all" && row.province !== selectedProvince) return false;
        if (selectedDistrict !== "all" && row.district !== selectedDistrict) return false;
        if (
          selectedFlagship !== "all" &&
          !row.flagshipFilterKey.split("||").filter(Boolean).includes(selectedFlagship)
        ) {
          return false;
        }
        return true;
      }),
    [
      rows,
      selectedCategoryMode,
      selectedProvince,
      selectedDistrict,
      selectedFlagship,
    ],
  );

  // System-wide cards from the API (filters never change these, per spec).
  const kpis = {
    totalIndividuals: viz?.cards.totalIndividuals ?? 0,
    inFlagships: viz?.cards.inFlagships ?? 0,
    outsideFlagships: viz?.cards.outsideFlagships ?? 0,
    females: viz?.cards.female ?? 0,
    youth: viz?.cards.youth ?? 0,
  };

  // Charts are driven by the visualizations API (honor province/district/view filters).
  const flagshipVsNonFlagshipData = useMemo(
    () =>
      (viz?.flagshipProportion ?? []).map((p, idx) => ({
        name: p.name,
        value: p.value,
        fill: idx === 0 ? "var(--accent)" : "var(--warning)",
      })),
    [viz],
  );

  const sexData = useMemo(
    () =>
      (viz?.bySex ?? []).map((item, idx) => ({
        name: item.name,
        value: item.value,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    [viz],
  );

  const youthCategoryData = useMemo(
    () =>
      (viz?.byYouthCategory ?? []).map((item, idx) => ({
        name: item.name,
        value: item.value,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    [viz],
  );

  const registeredOverTimeData = useMemo(
    () =>
      (viz?.growth ?? []).map((g) => ({
        month: `${g.year}-${String(g.month).padStart(2, "0")}`,
        value: g.registered,
      })),
    [viz],
  );

  const valueChainData = useMemo(
    () =>
      (viz?.byValueChain ?? []).map((item, idx) => ({
        name: item.name,
        value: item.value,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    [viz],
  );

  const enrolledPerFlagshipData = useMemo(
    () =>
      (viz?.perFlagship ?? []).map((item, idx) => ({
        name: item.flagshipCode,
        value: item.count,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    [viz],
  );

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

      {viewMode === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <AppSelect
              name="overviewProvince"
              label="Province"
              options={provinceOptions}
              selectedKey={selectedProvince}
              onSelectionChange={(value) => {
                setSelectedProvince(value);
                setSelectedDistrict("all");
              }}
            />
            <AppSelect
              name="overviewDistrict"
              label="District"
              options={districtOptions}
              selectedKey={selectedDistrict}
              onSelectionChange={setSelectedDistrict}
            />
            <AppSelect
              name="overviewCategory"
              label="Category View"
              options={categoryViewOptions}
              selectedKey={selectedCategoryMode}
              onSelectionChange={(value) => setSelectedCategoryMode(value as CategoryMode)}
            />
            <AppSelect
              name="overviewFlagship"
              label="Flagship"
              options={flagshipOptions}
              selectedKey={selectedFlagship}
              onSelectionChange={setSelectedFlagship}
            />
          </div>

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
          emptyMessage="No individuals yet"
          columns={readOnly ? COLUMNS_READONLY : COLUMNS}
          rows={filteredRows}
          searchPlaceholder="Search by name, sex, category, location…"
          searchKeys={["name", "sex", "category", "location", "source"]}
          statusColumnKey="source"
          statusColorMap={STATUS_COLOR_MAP}
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
