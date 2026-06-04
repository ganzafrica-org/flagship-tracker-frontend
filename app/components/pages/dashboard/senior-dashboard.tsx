import { useMemo, Suspense, lazy } from "react";
import { Card, Separator, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconFlag,
  IconUsers,
} from "@tabler/icons-react";

import { PageTitleCard } from "~/components/page-title-card";
import VizRefreshButton from "~/components/viz-refresh-button";
import { StatCard } from "~/components/stat-card";
import { individualsQueryOptions } from "~/lib/queries/individuals";
import { seniorDashboardQueryOptions } from "~/lib/queries/visualizations";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import { CHART } from "~/data/dummy-flagship-detail";
import { FLAGSHIP_BAR_COLORS } from "~/data/dummy-senior-dashboard";

const RwandaMap = lazy(() => import("~/components/pages/dashboard/rwanda-map"));

// ---------------------------------------------------------------------------
// Year filter dropdown (reusable within this page)
// ---------------------------------------------------------------------------

/** Shown in place of a chart when there is no data to plot. */
function EmptyChart({ height = 280 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 text-center"
      style={{ height }}
    >
      <span className="text-sm font-medium text-(--foreground)">No data yet</span>
      <span className="text-xs text-(--muted)">Data will appear once records are added.</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Investment progress row
// ---------------------------------------------------------------------------

interface ProgressRow {
  id: string;
  flagship: string;
  targetLabel: string;
  value: number;
  status: "percentage" | "planning";
}

function InvestmentProgressList({ rows }: { rows: ProgressRow[] }) {
  return (
    <div className="flex flex-col">
      {rows.map((item, index) => (
        <div key={item.id}>
          {index > 0 && <Separator />}
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--foreground)">{item.flagship}</p>
              <p className="text-xs text-(--muted)">Target: {item.targetLabel}</p>
            </div>
            <span
              className="shrink-0 text-sm font-bold"
              style={{ color: item.status === "percentage" ? "var(--accent)" : "var(--warning)" }}
            >
              {item.status === "percentage" ? `${item.value}%` : "Planning"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SeniorDashboard() {
  const flagshipsQuery = useQuery(flagshipsQueryOptions);
  const individualsQuery = useQuery(individualsQueryOptions);
  const vizQuery = useQuery(seniorDashboardQueryOptions());
  const isLoading = flagshipsQuery.isLoading || individualsQuery.isLoading;

  const flagships = flagshipsQuery.data ?? [];
  const individuals = individualsQuery.data ?? [];
  const viz = vizQuery.data;

  // All values come from the visualizations API (materialized views). When there
  // is no underlying data the cards show 0 / "—" and the charts render empty —
  // never fabricated placeholder numbers.
  const dashboardStats = useMemo(() => {
    const totalInvestmentRwf = viz?.cards.totalInvestmentRwf ?? null;
    return {
      totalFlagships: viz?.cards.totalFlagships ?? 0,
      totalJobsCreated: viz?.cards.totalJobsCreated ?? 0,
      totalInvestors: viz?.cards.totalInvestors ?? 0,
      totalIndividualsRegistered: individuals.length,
      totalCooperativesEngaged: viz?.cards.totalCooperativesEngaged ?? 0,
      totalInvestment:
        totalInvestmentRwf != null
          ? `${(totalInvestmentRwf / 1_000_000_000).toFixed(1)}B RWF`
          : "—",
    };
  }, [individuals, viz]);

  // 1.11 — investment progress (real data, empty when none).
  const progressRows = useMemo<ProgressRow[]>(() => {
    return (viz?.investmentProgress ?? []).map((p) => ({
      id: String(p.flagshipId),
      flagship: p.flagshipCode,
      targetLabel:
        p.budgetTotalRwf != null
          ? `${(p.budgetTotalRwf / 1_000_000_000).toFixed(1)}B RWF`
          : "—",
      value: p.progressPercent ?? 0,
      status: p.progressPercent != null ? "percentage" : "planning",
    }));
  }, [viz]);

  // 1.6 — youth vs non-youth, computed from real individuals (empty when none).
  const genderData = useMemo(() => {
    let youth = 0;
    let nonYouth = 0;
    for (const individual of individuals) {
      if (individual.youthCategory) youth += 1;
      else nonYouth += 1;
    }
    if (youth + nonYouth === 0) return [];
    return [
      { name: "Youth", value: youth, fill: CHART.accent },
      { name: "Non-Youth", value: nonYouth, fill: CHART.warning },
    ];
  }, [individuals]);

  // 1.8 — jobs created by flagship (materialized view; empty when none).
  const jobsCreatedData = useMemo(
    () =>
      (viz?.jobsByFlagship ?? []).map((item) => ({
        flagship: item.flagshipCode || item.flagshipName,
        jobs: Math.max(0, item.jobs ?? 0),
      })),
    [viz],
  );

  // 1.9 — investment disaggregation by source (materialized view; empty when none).
  const investmentSplitData = useMemo(() => {
    const rows = viz?.investmentBySource ?? [];
    const total = rows.reduce((s, r) => s + (r.value ?? 0), 0);
    if (total <= 0) return [];
    return rows.map((r, index) => ({
      name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
      value: Math.round(((r.value ?? 0) / total) * 100),
      fill: FLAGSHIP_BAR_COLORS[index % FLAGSHIP_BAR_COLORS.length],
    }));
  }, [viz]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page title — no action */}
      <PageTitleCard title="Dashboard Overview" actionSlot={<VizRefreshButton />} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          color="var(--accent)"
          icon={<IconFlag size={20} />}
          stat={dashboardStats.totalFlagships}
          label="Total Flagships"
        />
        <StatCard
          color="var(--warning)"
          icon={<IconBriefcase size={20} />}
          stat={dashboardStats.totalJobsCreated.toLocaleString()}
          label="Total Jobs Created"
        />
        <StatCard
          color="var(--forest)"
          icon={<IconUsers size={20} />}
          stat={dashboardStats.totalInvestors}
          label="Total Investors"
        />
        <StatCard
          color="var(--danger)"
          icon={<IconUsers size={20} />}
          stat={dashboardStats.totalIndividualsRegistered.toLocaleString()}
          label="Total Individuals Registered"
        />
        <StatCard
          color="var(--success)"
          icon={<IconBuildingCommunity size={20} />}
          stat={dashboardStats.totalCooperativesEngaged.toLocaleString()}
          label="Total Cooperatives Engaged"
        />
      </div>

      {/* Charts 2×2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1 — Donut: Youth vs non-youth participation */}
        <Card>
          <Card.Header>
            <Card.Title>Youth vs Non-Youth Participation</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-2">
            {genderData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                >
                  {genderData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>

        {/* 2 — Column: Jobs Created by Flagships */}
        <Card>
          <Card.Header>
            <Card.Title>Jobs Created by Flagships</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {jobsCreatedData.length === 0 ? <EmptyChart height={240} /> : (
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <BarChart data={jobsCreatedData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                <Bar dataKey="jobs" name="Jobs" radius={[4, 4, 0, 0]}>
                  {jobsCreatedData.map((entry, index) => (
                    <Cell key={entry.flagship} fill={FLAGSHIP_BAR_COLORS[index % FLAGSHIP_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>

        {/* Pie: Disaggregation of Total Investment */}
        <Card>
          <Card.Header>
            <Card.Title>Disaggregation of Total Investment</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {investmentSplitData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                <Pie
                  data={investmentSplitData}
                  dataKey="value"
                  nameKey="name"
                  cx="40%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                >
                  {investmentSplitData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value ?? 0)}%`} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            )}
            <p className="pt-2 text-sm text-(--foreground) text-center">
              <span className="font-semibold">{dashboardStats.totalInvestment}</span>{" "}
              investment in total
            </p>
          </Card.Content>
        </Card>
      </div>

      {/* Bottom section: map ~65% + investment progress ~35% */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[65fr_35fr]">
        {/* Rwanda map */}
        <Card>
          <Card.Header>
            <Card.Title>Flagships and Where They Are Being Implemented</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <Suspense fallback={<Skeleton className="h-[380px] rounded-xl" />}>
              <RwandaMap
                locations={(viz?.locations ?? []).map((l) => ({
                  name: l.flagshipCode || l.flagshipName,
                  district: l.district,
                  province: l.province,
                }))}
              />
            </Suspense>
          </Card.Content>
        </Card>

        {/* Investment progress */}
        <Card>
          <Card.Header>
            <Card.Title>Investment Progress</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {progressRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-(--muted)">No investment data yet.</p>
            ) : (
              <InvestmentProgressList rows={progressRows} />
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
