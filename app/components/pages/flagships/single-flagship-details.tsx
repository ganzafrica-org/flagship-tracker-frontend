import { Card, Dropdown } from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  IconCaretDownFilled,
  IconChartBar,
  IconCoin,
  IconMapPin,
  IconUsers,
} from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

import { PageTitleCard } from "~/components/page-title-card";
import { StatCard } from "~/components/stat-card";
import {
  CHART,
  flagshipDetailIndividualsByGender,
  flagshipDetailIndividualsTotal,
  flagshipDetailGenderCardAccents,
  flagshipDetailInvestmentSplit,
  getFlagshipDetailIntro,
  flagshipDetailJobsByGender,
  flagshipDetailJobsGauge,
  flagshipDetailJobsCurrent,
  flagshipDetailJobsPerChain,
  flagshipDetailJobsCreatedTotal,
  flagshipDetailJobsTarget,
  flagshipDetailKpis,
  flagshipDetailLocations,
  flagshipDetailQuantitiesByChain,
  flagshipDetailRevenueByChain,
  getHighlightRowBackground,
} from "~/data/dummy-flagship-detail";
import { parseFunderNames } from "~/lib/flagship-funders";
import type { Flagship, FundingContribution } from "~/lib/queries/flagships";
import { useQuery } from "@tanstack/react-query";
import { flagshipDashboardQueryOptions, type FlagshipDashboard } from "~/lib/queries/visualizations";

/** Latest non-null actual_value for an indicator from the viz KPI list. */
function latestKpiActual(kpis: FlagshipDashboard["kpis"] | undefined, indicatorName: string): number | null {
  if (!kpis) return null;
  const matches = kpis
    .filter((k) => k.indicatorName === indicatorName && k.actualValue != null)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return matches.length > 0 ? matches[0].actualValue : null;
}

function formatRwfShort(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

/** Format a live value when present; undefined keeps the dummy fallback in place. */
function liveOrUndefined(value: number | null, format: (v: number) => string): string | undefined {
  return value == null ? undefined : format(value);
}

function formatContributionDetail(contribution: FundingContribution): string | null {
  const parts: string[] = [];
  const amount = contribution.amount?.trim();
  const currency = contribution.currency?.trim();
  const description = contribution.description?.trim();

  if (amount) {
    parts.push(currency ? `${currency} ${amount}` : amount);
  }
  if (description) {
    parts.push(description);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

const FUNDER_ROW_TONES = ["accent", "success", "warning", "muted"] as const;

function getFunderRowBackground(apiColor: string | null | undefined, index: number): string {
  const tone = FUNDER_ROW_TONES[index % FUNDER_ROW_TONES.length];
  if (apiColor?.trim() && /^#[0-9A-Fa-f]{6}$/i.test(apiColor.trim())) {
    return `${apiColor.trim()}22`;
  }
  return getHighlightRowBackground(tone);
}

interface SingleFlagshipDetailsProps {
  flagship?: Flagship | null;
  /** Route param id from flagship list (`/flagships/:id`) — selects intro copy in `getFlagshipDetailIntro`. */
  flagshipPageId?: number;
  onViewSummaryPress?: () => void;
}

const motionFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatManagementModel(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function findKpi(id: (typeof flagshipDetailKpis)[number]["id"]) {
  const k = flagshipDetailKpis.find((x) => x.id === id);
  if (!k) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return k;
}

function KpiStatCard({
  k,
  className,
  statOverride,
}: {
  k: (typeof flagshipDetailKpis)[number];
  className?: string;
  /** Live value from the visualizations API; falls back to the dummy stat when undefined. */
  statOverride?: string;
}) {
  return (
    <StatCard
      className={className}
      color={k.color}
      iconBackground={k.iconBackground}
      icon={
        k.id === "invest" || k.id === "revenue" ? (
          <IconCoin size={20} />
        ) : (
          <IconChartBar size={20} />
        )
      }
      stat={statOverride ?? k.stat}
      label={k.label}
      statDescription={"statSuffix" in k ? k.statSuffix : undefined}
    />
  );
}

export function SingleFlagshipDetails({
  flagship,
  flagshipPageId,
  onViewSummaryPress,
}: SingleFlagshipDetailsProps) {
  const intro = getFlagshipDetailIntro(flagshipPageId, flagship?.name, flagship?.description);

  // Live visualization data (3.1–3.15) for this flagship, when a real id is present.
  const { data: viz } = useQuery({
    ...flagshipDashboardQueryOptions(flagship?.id ?? 0),
    enabled: Boolean(flagship?.id),
  });

  // Override the dummy KPI card numbers with real values where the API has them.
  const liveKpiStat = useMemo(() => {
    const investTotal = (viz?.investmentBySource ?? []).reduce(
      (sum, r) => sum + (r.value ?? 0),
      0,
    );
    return {
      invest: viz ? `${formatRwfShort(investTotal || null)} RWF` : undefined,
      irr: liveOrUndefined(latestKpiActual(viz?.kpis, "irr"), (v) => `${v}%`),
      revenue: liveOrUndefined(latestKpiActual(viz?.kpis, "annual_revenue"), (v) => `${formatRwfShort(v)} RWF`),
      income: liveOrUndefined(latestKpiActual(viz?.kpis, "income_per_youth_monthly"), (v) => `${formatRwfShort(v)} RWF`),
    };
  }, [viz]);

  // 3.4 — jobs created by gender (from flagship_kpi disaggregation via the MV).
  const liveJobsByGender = useMemo(() => {
    const g = viz?.gender;
    if (!g || (g.jobsMale == null && g.jobsFemale == null)) return null;
    const male = g.jobsMale ?? 0;
    const female = g.jobsFemale ?? 0;
    return {
      total: (male + female).toLocaleString(),
      data: [
        { name: "Male", value: male, fill: CHART.accent },
        { name: "Female", value: female, fill: CHART.warning },
      ],
    };
  }, [viz]);

  // 3.5 — individuals enrolled by gender.
  const liveIndividualsByGender = useMemo(() => {
    const g = viz?.gender;
    if (!g || (g.individualsMale == null && g.individualsFemale == null)) return null;
    const male = g.individualsMale ?? 0;
    const female = g.individualsFemale ?? 0;
    return {
      total: (male + female).toLocaleString(),
      data: [
        { name: "Male", value: male, fill: CHART.accent },
        { name: "Female", value: female, fill: CHART.warning },
      ],
    };
  }, [viz]);

  const funderEntries = useMemo(() => {
    const contributions = flagship?.fundingContributions ?? [];
    const withNames = contributions.filter((c) => c.name?.trim());
    if (withNames.length > 0) {
      return withNames.map((c, index) => {
        const name = c.name.trim();
        const detail = formatContributionDetail(c);
        return {
          key: name,
          name,
          detail,
          backgroundColor: getFunderRowBackground(c.color, index),
        };
      });
    }
    return parseFunderNames(flagship?.funders).map((name, index) => ({
      key: name,
      name,
      detail: "",
      backgroundColor: getFunderRowBackground(null, index),
    }));
  }, [flagship?.funders, flagship?.fundingContributions]);
  const managementModelLabel = useMemo(
    () => formatManagementModel(flagship?.managementModel),
    [flagship?.managementModel],
  );
  const implementationLocations = useMemo(() => {
    const grouped = new Map<string, string[]>();

    const addLocation = (provinceRaw: string | null | undefined, districtRaw: string | null | undefined) => {
      const province = (provinceRaw ?? "").trim();
      const district = (districtRaw ?? "").trim();
      if (!province || !district) return;

      const existing = grouped.get(province) ?? [];
      if (!existing.includes(district)) existing.push(district);
      grouped.set(province, existing);
    };

    if (flagship?.locations?.length) {
      flagship.locations.forEach((loc) => addLocation(loc.province, loc.district));
    } else {
      flagshipDetailLocations.forEach((loc) => addLocation(loc.province, loc.detail.split(",")[0]));
    }

    return Array.from(grouped.entries())
      .map(([province, districts]) => ({
        province,
        districts: districts.sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.province.localeCompare(b.province));
  }, [flagship?.locations]);
  const jobsYears = flagshipDetailJobsPerChain.map((row) => row.year);
  const revenueYears = flagshipDetailRevenueByChain.map((row) => row.year);
  const quantityYears = flagshipDetailQuantitiesByChain.map((row) => row.year);
  const investmentYears = jobsYears;

  const [jobsYear, setJobsYear] = useState(jobsYears[jobsYears.length - 1] ?? "2026");
  const [investmentYear, setInvestmentYear] = useState(
    investmentYears[investmentYears.length - 1] ?? "2026",
  );
  const [revenueYear, setRevenueYear] = useState(revenueYears[revenueYears.length - 1] ?? "2026");
  const [quantityYear, setQuantityYear] = useState(quantityYears[quantityYears.length - 1] ?? "2026");

  const jobsChartData = useMemo(
    () => flagshipDetailJobsPerChain.filter((row) => Number(row.year) <= Number(jobsYear)),
    [jobsYear],
  );
  const revenueChartData = useMemo(
    () => flagshipDetailRevenueByChain.filter((row) => Number(row.year) <= Number(revenueYear)),
    [revenueYear],
  );
  const quantityChartData = useMemo(
    () => flagshipDetailQuantitiesByChain.filter((row) => Number(row.year) <= Number(quantityYear)),
    [quantityYear],
  );
  const investmentPieFills = [CHART.accent, CHART.warning, CHART.success, CHART.danger];
  const investmentChartData = useMemo(() => {
    // Prefer live investment-by-source (3.11); fall back to the dummy split.
    if (viz?.investmentBySource && viz.investmentBySource.length > 0) {
      return viz.investmentBySource.map((row, idx) => ({
        name: row.name,
        value: row.value ?? 0,
        fill: investmentPieFills[idx % investmentPieFills.length],
      }));
    }

    const multipliers: Record<string, number> = {
      "2020": 0.7,
      "2021": 0.82,
      "2022": 0.9,
      "2023": 1,
      "2024": 1.1,
      "2025": 1.2,
      "2026": 1.3,
    };
    const factor = multipliers[investmentYear] ?? 1;

    return flagshipDetailInvestmentSplit.map((row) => ({
      ...row,
      value: Math.round(row.value * factor),
    }));
  }, [investmentYear, viz]);

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title={intro.displayTitle}
        actionLabel="Generate Report"
        onActionPress={onViewSummaryPress}
      />

      <motion.div
        {...motionFade}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:items-stretch"
      >
        {/* Left: 2×2 KPI block — height follows the gender cards on lg */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 lg:min-h-0 auto-rows-fr">
          <div className="min-h-0 flex flex-col">
            <KpiStatCard k={findKpi("invest")} statOverride={liveKpiStat.invest} className="h-full min-h-0" />
          </div>
          <div className="min-h-0 flex flex-col">
            <KpiStatCard k={findKpi("irr")} statOverride={liveKpiStat.irr} className="h-full min-h-0" />
          </div>
          <div className="min-h-0 flex flex-col">
            <KpiStatCard k={findKpi("revenue")} statOverride={liveKpiStat.revenue} className="h-full min-h-0" />
          </div>
          <div className="min-h-0 flex flex-col">
            <KpiStatCard k={findKpi("income")} statOverride={liveKpiStat.income} className="h-full min-h-0" />
          </div>
        </div>
        <div className="lg:col-span-1 min-h-[240px] lg:min-h-0 flex flex-col">
          <GenderBigCard
            accent={flagshipDetailGenderCardAccents.jobs}
            stat={liveJobsByGender?.total ?? flagshipDetailJobsCreatedTotal}
            label="Jobs Created by Gender"
            data={liveJobsByGender?.data ?? flagshipDetailJobsByGender}
            variant="donut"
          />
        </div>
        <div className="lg:col-span-1 min-h-[240px] lg:min-h-0 flex flex-col">
          <GenderBigCard
            accent={flagshipDetailGenderCardAccents.individuals}
            stat={liveIndividualsByGender?.total ?? flagshipDetailIndividualsTotal}
            label="Total Individuals by Gender"
            data={liveIndividualsByGender?.data ?? flagshipDetailIndividualsByGender}
            variant="pie"
          />
        </div>
      </motion.div>

      <motion.div {...motionFade} transition={{ duration: 0.25, delay: 0.05 }}>
        <Card className="w-full min-w-0">
          <Card.Content className="flex w-full min-w-0 flex-col gap-6 p-6">
            <div className="w-full min-w-0 space-y-3">
              <h3 className="w-full text-base font-bold text-(--foreground)">
                {intro.descriptionHeading}
              </h3>
              <p className="w-full min-w-0 text-base leading-snug text-(--muted)">
                {intro.segments.map((segment, i) =>
                  segment.emphasis ? (
                    <strong key={i} className="font-semibold text-(--foreground)">
                      {segment.text}
                    </strong>
                  ) : (
                    <span key={i}>{segment.text}</span>
                  ),
                )}
              </p>
            </div>
            <div className="w-full min-w-0">
              <h3 className="mb-5 text-base font-bold text-(--foreground)">Implementation Locations</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {implementationLocations.map((loc) => (
                  <div key={loc.province} className="flex items-start gap-2.5 rounded-lg border border-(--separator) p-3">
                    <IconMapPin
                      size={18}
                      stroke={1.35}
                      className="mt-0.5 shrink-0 text-(--accent) opacity-80"
                      aria-hidden
                    />
                    <div className="min-w-0 text-sm font-normal leading-snug text-(--foreground)">
                      <p className="font-semibold">{loc.province}</p>
                      <p className="text-(--muted)">{loc.districts.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        {...motionFade}
        transition={{ duration: 0.25, delay: 0.12 }}
        className="grid grid-cols-1 gap-4"
      >
        <Card>
          <Card.Header>
            <Card.Title>Progress vs Target: Jobs for Youth</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <div className="flex w-full min-w-0 flex-col items-stretch">
              <div className="relative h-[200px] w-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                    <Pie
                      data={[
                        {
                          name: "Actual Jobs for youth",
                          value: flagshipDetailJobsCurrent,
                          fill: flagshipDetailJobsGauge.actualFill,
                        },
                        {
                          name: "Total Target Jobs for youth",
                          value: Math.max(0, flagshipDetailJobsTarget - flagshipDetailJobsCurrent),
                          fill: flagshipDetailJobsGauge.trackFill,
                        },
                      ]}
                      dataKey="value"
                      stroke="none"
                      startAngle={180}
                      endAngle={0}
                      cx="50%"
                      cy="82%"
                      innerRadius={60}
                      outerRadius={108}
                    >
                      <Cell fill={flagshipDetailJobsGauge.actualFill} />
                      <Cell fill={flagshipDetailJobsGauge.trackFill} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute left-[calc(50%-106px)] top-[calc(82%-2px)] text-xs text-(--muted)">
                  0
                </div>
                <div className="pointer-events-none absolute left-[calc(50%+106px)] top-[calc(82%-2px)] -translate-x-full text-xs text-(--muted)">
                  {flagshipDetailJobsTarget}
                </div>
                <div
                  className="pointer-events-none absolute left-1/2 top-[82%] -translate-x-1/2 -translate-y-1/2 -mt-5"
                  aria-hidden
                >
                  <span className="text-3xl font-bold text-(--foreground)">
                    {flagshipDetailJobsCurrent}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-(--foreground)">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: flagshipDetailJobsGauge.trackFill }}
                    aria-hidden
                  />
                  Total Target Jobs for youth
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: flagshipDetailJobsGauge.actualFill }}
                    aria-hidden
                  />
                  Actual Jobs for youth
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        {...motionFade}
        transition={{ duration: 0.25, delay: 0.14 }}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Jobs created over the years</Card.Title>
            <div className="flex items-center gap-2">
              <span className="text-xs text-(--muted)">Year</span>
              <YearDropdown value={jobsYear} options={jobsYears} onChange={setJobsYear} ariaLabel="Jobs year" />
            </div>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <LineChart data={jobsChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke={CHART.grid} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tomato" name="Tomato" stroke={CHART.accent} strokeWidth={2} />
                <Line type="monotone" dataKey="cucumber" name="Cucumber" stroke={CHART.warning} strokeWidth={2} />
                <Line type="monotone" dataKey="chili" name="Chili" stroke={CHART.success} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Disaggregation of Total Investment</Card.Title>
            <YearDropdown
              value={investmentYear}
              options={investmentYears}
              onChange={setInvestmentYear}
              ariaLabel="Investment year"
            />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <PieChart>
                <Pie
                  data={investmentChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {investmentChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Revenue by Value Chain over the Years</Card.Title>
            <YearDropdown
              value={revenueYear}
              options={revenueYears}
              onChange={setRevenueYear}
              ariaLabel="Revenue year"
            />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <LineChart data={revenueChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="tomato" name="Tomato" stroke={CHART.accent} strokeWidth={2} />
                <Line type="monotone" dataKey="cucumber" name="Cucumber" stroke={CHART.warning} strokeWidth={2} />
                <Line type="monotone" dataKey="chili" name="Chili" stroke={CHART.success} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Quantities produced per Value Chain</Card.Title>
            <YearDropdown
              value={quantityYear}
              options={quantityYears}
              onChange={setQuantityYear}
              ariaLabel="Quantity year"
            />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <BarChart data={quantityChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="tomato" name="Tomato" fill={CHART.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cucumber" name="Cucumber" fill={CHART.warning} radius={[4, 4, 0, 0]} />
                <Bar dataKey="chili" name="Chili" fill={CHART.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        {...motionFade}
        transition={{ duration: 0.25, delay: 0.16 }}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <Card>
          <Card.Header>
            <Card.Title>Funders</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {funderEntries.length === 0 ? (
              <p className="text-sm text-(--muted)">No funders recorded for this flagship.</p>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {funderEntries.map((entry) => (
                  <li
                    key={entry.key}
                    className="rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: entry.backgroundColor }}
                  >
                    <p className="text-sm font-semibold leading-snug text-(--foreground)">{entry.name}</p>
                    {entry.detail ? (
                      <p className="mt-1 text-xs leading-snug text-(--foreground)/80">{entry.detail}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {flagship?.funders?.trim() && funderEntries.length === 0 ? (
              <p
                className="mt-0 rounded-xl px-3 py-2.5 text-sm leading-relaxed text-(--foreground)"
                style={{ backgroundColor: getHighlightRowBackground("accent") }}
              >
                {flagship.funders}
              </p>
            ) : null}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Management Model</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {managementModelLabel ? (
              <p className="rounded-xl border border-(--separator) bg-(--default)/40 px-4 py-3 text-sm leading-relaxed text-(--foreground)">
                {managementModelLabel}
              </p>
            ) : (
              <p className="text-sm text-(--muted)">Management model not specified.</p>
            )}
          </Card.Content>
        </Card>
      </motion.div>
    </div>
  );
}

function YearDropdown({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: string[];
  onChange: (year: string) => void;
  ariaLabel: string;
}) {
  return (
    <Dropdown>
      <Dropdown.Trigger
        className="flex min-w-[96px] items-center justify-between rounded-xl border border-(--separator) bg-(--surface) px-3 py-1.5 text-sm text-(--muted) hover:bg-(--default)"
        aria-label={ariaLabel}
      >
        <span>{value}</span>
        <IconCaretDownFilled size={16} className="shrink-0 text-(--muted)" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="rounded-xl border border-(--separator) bg-(--surface) p-0">
        <Dropdown.Menu
          aria-label={ariaLabel}
          className="py-1"
          selectedKeys={[value]}
          selectionMode="single"
          disallowEmptySelection
          onAction={(key) => onChange(String(key))}
        >
          {options.map((year) => (
            <Dropdown.Item
              key={year}
              id={year}
              textValue={year}
              className="min-h-0 px-3 py-1.5 text-sm leading-tight"
            >
              {year}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** Gender KPI + chart card (reference layout: icon + stat row, centered label, no side stripe). */
function GenderBigCard({
  accent,
  stat,
  label,
  data,
  variant,
}: {
  accent: { icon: string; iconSoft: string };
  stat: string;
  label: string;
  data: { name: string; value: number; fill: string }[];
  variant: "donut" | "pie";
}) {
  const innerRadius = variant === "donut" ? "48%" : 0;
  const outerRadius = "68%";

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl p-0">
      <div className="shrink-0 px-4 pt-3 pb-1">
        <div className="flex flex-row items-center gap-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: accent.iconSoft }}
          >
            <span style={{ color: accent.icon }}>
              <IconUsers size={18} stroke={2} />
            </span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-(--foreground)">{stat}</span>
        </div>
        <p className="mt-1 text-center text-xs text-(--muted) leading-snug">{label}</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-2 pb-3 pt-0 min-h-[132px]">
        <div className="h-[132px] w-full shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="40%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={variant === "donut" ? 1.5 : 0}
                stroke="none"
                label={(props: PieLabelRenderProps) => {
                  const { x, y, value, textAnchor, payload } = props;
                  if (value == null || x == null || y == null) return null;
                  const fill =
                    payload && typeof payload === "object" && "fill" in payload
                      ? String((payload as { fill: string }).fill)
                      : "#334155";
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={fill}
                      fontSize={10}
                      fontWeight={600}
                      textAnchor={textAnchor ?? "middle"}
                      dominantBaseline="central"
                    >
                      {String(value)}
                    </text>
                  );
                }}
                labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11, paddingLeft: 2, color: "var(--foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
