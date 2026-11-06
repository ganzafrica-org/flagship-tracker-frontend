import { Button, Card } from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  IconChartBar,
  IconCashBanknote,
  IconWallet,
  IconMapPin,
} from "@tabler/icons-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { ChartSkeleton } from "~/components/app-skeleton";
import { PageTitleCard } from "~/components/page-title-card";
import VizRefreshButton from "~/components/viz-refresh-button";
import { StatCard } from "~/components/stat-card";
import { parseFunderNames } from "~/lib/flagship-funders";
import { type Flagship, type FlagshipKpi, type FundingContribution } from "~/lib/queries/flagships";
import { useQuery } from "@tanstack/react-query";
import { flagshipDashboardQueryOptions } from "~/lib/queries/visualizations";

const CHART = {
  accent: "var(--accent)",
  warning: "var(--warning)",
} as const;

/** One hue per stat card: line, icon, and a light circle of that same color. No purple. */
const CARD_COLORS = [
  "var(--accent)",
  "var(--warning)",
  "var(--forest)",
  "oklch(58% 0.11 195)",
  "oklch(66% 0.15 42)",
] as const;

const motionFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

interface SingleFlagshipDetailsProps {
  flagship?: Flagship | null;
  flagshipPageId?: number;
  /** True while the full record (notes, locations, charts) is still on the way. The card fields are already shown. */
  pending?: boolean;
  onViewSummaryPress?: () => void;
}

function labelize(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Longer figures step down so the number and unit stay inside the card. */
function statFontClass(stat: string): string {
  const digits = stat.replace(/\D/g, "").length;
  if (digits >= 13) return "text-[clamp(0.875rem,10cqi,1.25rem)]";
  if (digits >= 10) return "text-[clamp(1rem,11cqi,1.375rem)]";
  return "text-[clamp(1.125rem,12cqi,1.5rem)]";
}

function kpiCardLabel(kpi: FlagshipKpi): string {
  const fromIndicator = labelize(kpi.indicatorName);
  const chain = kpi.valueChain?.trim();
  if (chain && !isRevenueKpi(kpi) && chain.length < fromIndicator.length) return chain;
  return fromIndicator;
}

function formatKpiStat(value: number, valueType: string | null | undefined): { amount: string; unit?: string } {
  const type = (valueType ?? "").toLowerCase();
  const amount = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (type === "rwf" || type === "currency") return { amount, unit: "RWF" };
  if (type === "percent" || type === "percentage") return { amount, unit: "%" };
  if (!type || type === "count" || type === "number" || type === "other") return { amount };
  return { amount, unit: valueType ?? undefined };
}

function isRevenueKpi(kpi: FlagshipKpi): boolean {
  return kpi.indicatorName === "annual_revenue" || (kpi.indicatorValueType ?? "").toLowerCase() === "rwf";
}

function latestByIndicator(kpis: FlagshipKpi[], predicate: (kpi: FlagshipKpi) => boolean): FlagshipKpi[] {
  const byName = new Map<string, FlagshipKpi>();
  for (const kpi of kpis) {
    if (!predicate(kpi) || kpi.actualValue == null) continue;
    const current = byName.get(kpi.indicatorName);
    if (!current || (kpi.year ?? 0) > (current.year ?? 0)) byName.set(kpi.indicatorName, kpi);
  }
  return Array.from(byName.values()).sort((a, b) => a.indicatorName.localeCompare(b.indicatorName));
}

function funderMark(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  return name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
}

function formatContributionDetail(contribution: FundingContribution): string | null {
  const parts: string[] = [];
  const amount = contribution.amount?.trim();
  const currency = contribution.currency?.trim();
  const description = contribution.description?.trim();
  if (amount) parts.push(currency ? `${currency} ${amount}` : amount);
  if (description) parts.push(description);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function SingleFlagshipDetails({
  flagship,
  pending = false,
  onViewSummaryPress,
}: SingleFlagshipDetailsProps) {
  const { data: viz } = useQuery({
    ...flagshipDashboardQueryOptions(flagship?.id ?? 0),
    enabled: Boolean(flagship?.id) && !pending,
  });

  const kpis = flagship?.kpis ?? [];

  const progressNotes = useMemo(
    () =>
      kpis
        .filter((kpi) => kpi.indicatorName === "progress_note" && kpi.notes?.trim())
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
    [kpis],
  );

  const headlineKpis = useMemo(
    () =>
      latestByIndicator(
        kpis,
        (kpi) => kpi.indicatorName !== "jobs_created" && kpi.indicatorName !== "progress_note" && !kpi.disaggregation,
      ),
    [kpis],
  );

  const jobsRows = useMemo(
    () => kpis.filter((kpi) => kpi.indicatorName === "jobs_created" && !kpi.disaggregation),
    [kpis],
  );

  const jobsByYear = useMemo(() => {
    const byYear = new Map<number, { year: string; actual: number; target: number | null }>();
    for (const kpi of jobsRows) {
      if (kpi.year == null) continue;
      const entry = byYear.get(kpi.year) ?? { year: String(kpi.year), actual: 0, target: null };
      if (kpi.actualValue != null) entry.actual += kpi.actualValue;
      if (kpi.targetValue != null) entry.target = (entry.target ?? 0) + kpi.targetValue;
      byYear.set(kpi.year, entry);
    }
    return Array.from(byYear.values()).sort((a, b) => Number(a.year) - Number(b.year));
  }, [jobsRows]);

  const latestJobs = jobsByYear[jobsByYear.length - 1];
  const jobsActual = latestJobs?.actual ?? flagship?.jobsCreated ?? 0;
  const jobsTarget = latestJobs?.target ?? flagship?.targetYouthCount ?? null;

  const genderJobs = useMemo(() => {
    const male = latestByIndicator(kpis, (kpi) => kpi.indicatorName === "jobs_created" && kpi.disaggregation === "by_sex_male");
    const female = latestByIndicator(kpis, (kpi) => kpi.indicatorName === "jobs_created" && kpi.disaggregation === "by_sex_female");
    const maleValue = male[0]?.actualValue ?? null;
    const femaleValue = female[0]?.actualValue ?? null;
    if (maleValue == null && femaleValue == null) return null;
    return {
      total: (maleValue ?? 0) + (femaleValue ?? 0),
      data: [
        { name: "Female", value: femaleValue ?? 0, fill: CHART.warning },
        { name: "Male", value: maleValue ?? 0, fill: CHART.accent },
      ],
    };
  }, [kpis]);

  const valueChainEntries = useMemo(() => {
    const fromTable = flagship?.valueChains ?? [];
    if (fromTable.length > 0) {
      return [...fromTable]
        .sort((a, b) => Number(b.primary) - Number(a.primary) || a.valueChain.localeCompare(b.valueChain))
        .map((item) => ({ name: item.valueChain, primary: item.primary, cluster: item.cluster }));
    }
    return (flagship?.primaryValueChain ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, primary: false, cluster: null as string | null }));
  }, [flagship?.primaryValueChain, flagship?.valueChains]);

  const locations = useMemo(() => {
    const grouped = new Map<string, string[]>();
    const source = flagship?.locations?.length
      ? flagship.locations
      : (viz?.locations ?? []).map((loc) => ({ province: loc.province, district: loc.district }));
    for (const loc of source) {
      const province = (loc.province ?? "").trim();
      const district = (loc.district ?? "").trim();
      if (!province || !district) continue;
      const existing = grouped.get(province) ?? [];
      if (!existing.includes(district)) existing.push(district);
      grouped.set(province, existing);
    }
    return Array.from(grouped.entries())
      .map(([province, districts]) => ({
        province,
        districts: districts.sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.province.localeCompare(b.province));
  }, [flagship?.locations, viz?.locations]);

  const funderEntries = useMemo(() => {
    const contributions = (flagship?.fundingContributions ?? []).filter((item) => item.name?.trim());
    if (contributions.length > 0) {
      return contributions.map((contribution) => ({
        key: contribution.name,
        name: contribution.name.trim(),
        detail: formatContributionDetail(contribution),
      }));
    }
    return parseFunderNames(flagship?.funders).map((name) => ({
      key: name,
      name,
      detail: null as string | null,
    }));
  }, [flagship?.funders, flagship?.fundingContributions]);

  const statCards = [
    {
      key: "budget",
      label: "Total budget",
      stat: flagship?.budgetTotalRwf != null
        ? flagship.budgetTotalRwf.toLocaleString("en-US", { maximumFractionDigits: 0 })
        : "—",
      unit: flagship?.budgetTotalRwf != null ? "RWF" : undefined,
      icon: <IconCashBanknote size={20} />,
    },
    ...headlineKpis
      .slice()
      .sort((a, b) => Number(isRevenueKpi(b)) - Number(isRevenueKpi(a)) || a.indicatorName.localeCompare(b.indicatorName))
      .map((kpi) => {
        const formatted = formatKpiStat(kpi.actualValue ?? 0, kpi.indicatorValueType);
        return {
          key: `kpi-${kpi.kpiId}`,
          label: kpiCardLabel(kpi),
          stat: formatted.amount,
          unit: formatted.unit,
          icon: isRevenueKpi(kpi) ? <IconWallet size={20} /> : <IconChartBar size={20} />,
        };
      }),
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title={flagship?.name?.trim() || "Flagship"}
        actionSlot={
          <div className="flex items-center gap-3">
            <VizRefreshButton />
            <Button variant="primary" className="!rounded-3xl" onPress={onViewSummaryPress}>
              Generate Report
            </Button>
          </div>
        }
      />

      <motion.div
        {...motionFade}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
      >
        {statCards.map((card, index) => (
          <StatCard
            key={card.key}
            className="h-full min-w-0"
            color={CARD_COLORS[index % CARD_COLORS.length]}
            icon={card.icon}
            stat={card.stat}
            unit={card.unit}
            label={card.label}
            labelOnOwnLine
            statClassName={statFontClass(card.stat)}
          />
        ))}
      </motion.div>

      <motion.div {...motionFade} transition={{ duration: 0.2 }} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {pending ? (
          <>
            <ChartSkeleton height="h-52" />
            <ChartSkeleton height="h-52" />
          </>
        ) : (
        <>
        <Card className="flex h-full min-h-[220px] flex-col">
          <Card.Header className="flex-col items-start gap-0.5">
            <Card.Title>Jobs for youth: progress vs target</Card.Title>
            <p className="text-xs text-(--muted)">Jobs created against the youth target</p>
          </Card.Header>
          <Card.Content className="flex flex-1 items-center p-4 pt-0">
            {jobsTarget != null && jobsTarget > 0 ? (
              <JobsGauge current={jobsActual} target={jobsTarget} />
            ) : (
              <p className="w-full text-center text-sm text-(--muted)">No youth jobs target is recorded for this flagship.</p>
            )}
          </Card.Content>
        </Card>
        <GenderPanel
          label="Jobs created by gender"
          total={genderJobs?.total ?? null}
          data={genderJobs?.data ?? null}
          empty="Jobs are not split by gender for this flagship."
          variant="donut"
        />
        </>
        )}
      </motion.div>

      <motion.div {...motionFade} transition={{ duration: 0.2 }} className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <Card.Content className="flex flex-col gap-4 p-6">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-(--foreground)">Project description</h3>
              {pending && !flagship?.description?.trim() ? (
                <ChartSkeleton height="h-16" />
              ) : (
              <p className="text-base leading-snug text-(--muted)">
                {flagship?.description?.trim() || "No description is recorded for this flagship."}
              </p>
              )}
              {flagship?.startDate || flagship?.endDate ? (
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-(--muted)">
                  {flagship?.startDate ? <span>Start: <strong className="text-(--foreground)">{flagship.startDate}</strong></span> : null}
                  {flagship?.endDate ? <span>End: <strong className="text-(--foreground)">{flagship.endDate}</strong></span> : null}
                </div>
              ) : null}
            </div>
            <div>
              <h3 className="mb-2 text-base font-bold text-(--foreground)">Implementation locations</h3>
              {pending ? (
                <ChartSkeleton height="h-16" />
              ) : locations.length === 0 ? (
                <p className="text-sm text-(--muted)">No locations are recorded for this flagship.</p>
              ) : (
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {locations.map((loc) => (
                    <div key={loc.province} className="flex min-w-0 items-start gap-2">
                      <IconMapPin size={18} stroke={1.35} className="mt-0.5 shrink-0 text-(--accent)" aria-hidden />
                      <div className="text-sm">
                        <p className="font-semibold">{loc.province}</p>
                        <p className="text-(--muted)">{loc.districts.join(", ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
        <Card className="h-full">
          <Card.Header>
            <Card.Title>Progress notes</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {pending ? (
              <ChartSkeleton height="h-20" />
            ) : progressNotes.length === 0 ? (
              <p className="text-sm text-(--muted)">No progress note is recorded for this flagship.</p>
            ) : (
              <ul className="m-0 list-none space-y-3 p-0">
                {progressNotes.map((note) => (
                  <li key={note.kpiId}>
                    <p className="text-xs font-medium text-(--muted)">
                      {[note.year, note.reportingPeriod].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-(--foreground)">{note.notes}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <Card className="h-full">
          <Card.Header>
            <Card.Title>Value chain</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {valueChainEntries.length === 0 ? (
              <p className="text-sm text-(--muted)">No value chain is recorded for this flagship.</p>
            ) : (
              <p className="text-sm text-(--foreground)">{valueChainEntries.map((chain) => chain.name).join(", ")}</p>
            )}
          </Card.Content>
        </Card>

        <Card className="h-full">
          <Card.Header>
            <Card.Title>Funders</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {funderEntries.length === 0 ? (
              <p className="text-sm text-(--muted)">No funders are recorded for this flagship.</p>
            ) : (
              <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0">
                {funderEntries.map((entry, index) => (
                  <li key={entry.key} className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: index % 2 === 0 ? "var(--accent)" : "var(--warning)" }}
                    >
                      {funderMark(entry.name)}
                    </span>
                    <span className="text-sm font-semibold">{entry.name}</span>
                    {entry.detail ? <span className="text-xs text-(--muted)">{entry.detail}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

function JobsGauge({ current, target }: { current: number; target: number }) {
  const remainder = Math.max(0, target - current);
  const percent = Math.round((current / target) * 100);
  return (
    <div className="flex w-full items-center gap-4">
      <div className="relative h-[150px] min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={[
                { name: "Actual jobs", value: Math.min(current, target), fill: CHART.accent },
                { name: "Remaining to target", value: remainder, fill: "var(--default)" },
              ]}
              dataKey="value"
              stroke="none"
              startAngle={180}
              endAngle={0}
              cx="50%"
              cy="78%"
              innerRadius={52}
              outerRadius={78}
            >
              <Cell fill={CHART.accent} />
              <Cell fill="var(--default)" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute left-1/2 top-[72%] -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="text-3xl font-bold text-(--foreground)">{percent}%</span>
          <p className="text-xs text-(--muted)">complete</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-4 pr-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-(--muted)">Jobs created</p>
          <p className="text-2xl font-bold leading-none text-(--foreground)">{current.toLocaleString("en-US")}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-(--muted)">Youth target</p>
          <p className="text-2xl font-bold leading-none text-(--foreground)">{target.toLocaleString("en-US")}</p>
        </div>
      </div>
    </div>
  );
}

function GenderPanel({
  label,
  total,
  data,
  empty,
  variant,
}: {
  label: string;
  total: number | null;
  data: { name: string; value: number; fill: string }[] | null;
  empty: string;
  variant: "donut" | "pie";
}) {
  const shownTotal = total ?? data?.reduce((sum, entry) => sum + entry.value, 0) ?? 0;
  return (
    <Card className="flex h-full min-h-[220px] flex-col overflow-hidden">
      <Card.Header className="flex-col items-start gap-0.5">
        <Card.Title>{label}</Card.Title>
        {data != null ? (
          <p className="text-xs text-(--muted)">{shownTotal.toLocaleString("en-US")} jobs in total</p>
        ) : null}
      </Card.Header>
      {data == null ? (
        <p className="flex flex-1 items-center justify-center px-4 pb-4 text-center text-sm text-(--muted)">{empty}</p>
      ) : (
        <div className="flex flex-1 items-center gap-2 px-2 pb-4">
          <div className="relative h-[160px] w-[46%] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={variant === "donut" ? 42 : 0}
                  outerRadius={62}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="text-2xl font-bold text-(--foreground)">
                {shownTotal.toLocaleString("en-US")}
              </span>
            </div>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {data.map((entry) => {
              const share = shownTotal > 0 ? Math.round((entry.value / shownTotal) * 100) : 0;
              return (
                <li key={entry.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="font-medium">{entry.name}</span>
                  <span className="text-(--muted)">
                    {entry.value.toLocaleString("en-US")} · {share}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}

