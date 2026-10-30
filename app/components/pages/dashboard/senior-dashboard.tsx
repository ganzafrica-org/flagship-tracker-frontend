import { useMemo, Suspense, lazy } from "react";
import { Card, Separator, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
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
  IconBriefcase,
  IconBuildingCommunity,
  IconFlag,
  IconUsers,
} from "@tabler/icons-react";

import { FlagshipStatusBadge } from "~/components/pages/flagships/flagships-list";
import { PageTitleCard } from "~/components/page-title-card";
import VizRefreshButton from "~/components/viz-refresh-button";
import { StatCard } from "~/components/stat-card";
import { StatCardSkeleton, ChartSkeleton } from "~/components/app-skeleton";
import {
  flagshipStatusListQueryOptions,
  seniorDashboardQueryOptions,
  seniorIndividualsQueryOptions,
  type FlagshipSummaryRow,
} from "~/lib/queries/visualizations";
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
// Flagships status (every flagship from mv_flagship_summary)
// ---------------------------------------------------------------------------

function FlagshipStatusList({ flagships }: { flagships: FlagshipSummaryRow[] }) {
  return (
    <ul className="m-0 flex list-none flex-col p-0" data-testid="flagship-status-list">
      {flagships.map((f, index) => (
        <li key={f.flagshipId}>
          {index > 0 && <Separator />}
          <div className="flex items-start justify-between gap-3 py-3" data-testid={`flagship-status-${f.flagshipCode}`}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--foreground)">{f.flagshipCode}</p>
              <p className="text-sm leading-snug text-(--foreground)">{f.flagshipName}</p>
              <p className="text-xs uppercase tracking-wide text-(--muted)">{f.flagshipCluster}</p>
            </div>
            <FlagshipStatusBadge status={f.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SeniorDashboard() {
  // Two independent aggregate queries, fetched in parallel; each section renders as soon as its own
  // data arrives (nothing here downloads a full list).
  const vizQuery = useQuery(seniorDashboardQueryOptions());
  const individualsQuery = useQuery(seniorIndividualsQueryOptions);
  const statusQuery = useQuery(flagshipStatusListQueryOptions);
  const viz = vizQuery.data;
  const individualsStats = individualsQuery.data;
  const vizLoading = vizQuery.isPending;
  const individualsLoading = individualsQuery.isPending;

  // All values come from the visualizations API (materialized views). When there
  // is no underlying data the cards show 0 / "—" and the charts render empty —
  // never fabricated placeholder numbers.
  const dashboardStats = useMemo(() => {
    return {
      totalFlagships: viz?.cards.totalFlagships ?? 0,
      totalJobsCreated: viz?.cards.totalJobsCreated ?? 0,
      totalFunders: viz?.cards.totalFunders ?? 0,
      totalIndividualsRegistered: individualsStats?.total ?? 0,
      totalCooperativesEngaged: viz?.cards.totalCooperativesEngaged ?? 0,
    };
  }, [individualsStats, viz]);

  // 1.6 — youth vs non-youth from individual.youth_status; individuals with no value are
  // shown as "Unknown" (never dropped), and percentages are of all individuals.
  const genderData = useMemo(() => {
    if (!individualsStats || individualsStats.total === 0) return [];
    return [
      { name: "Youth", value: individualsStats.youth, fill: CHART.accent },
      { name: "Non-Youth", value: individualsStats.nonYouth, fill: CHART.warning },
      { name: "Unknown", value: individualsStats.unknown, fill: "var(--muted)" },
    ].filter((d) => d.value > 0);
  }, [individualsStats]);
  const genderTotal = genderData.reduce((sum, d) => sum + d.value, 0);

  // 1.8 — jobs created by flagship (materialized view; empty when none).
  const jobsCreatedData = useMemo(
    () =>
      (viz?.jobsByFlagship ?? []).map((item) => ({
        flagship: item.flagshipCode || item.flagshipName,
        jobs: Math.max(0, item.jobs ?? 0),
      })),
    [viz],
  );

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page title — no action */}
      <PageTitleCard title="Dashboard Overview" actionSlot={<VizRefreshButton />} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {vizLoading ? <StatCardSkeleton /> : (
          <StatCard
            color="var(--accent)"
            icon={<IconFlag size={20} />}
            stat={dashboardStats.totalFlagships}
            label="Total Flagships"
          />
        )}
        {vizLoading ? <StatCardSkeleton /> : (
          <StatCard
            color="var(--warning)"
            icon={<IconBriefcase size={20} />}
            stat={dashboardStats.totalJobsCreated.toLocaleString()}
            label="Total Jobs Created"
          />
        )}
        {vizLoading ? <StatCardSkeleton /> : (
          <StatCard
            color="var(--forest)"
            icon={<IconUsers size={20} />}
            stat={dashboardStats.totalFunders}
            label="Total Funders"
          />
        )}
        {individualsLoading ? <StatCardSkeleton /> : (
          <StatCard
            color="var(--danger)"
            icon={<IconUsers size={20} />}
            stat={dashboardStats.totalIndividualsRegistered.toLocaleString()}
            label="Total Individuals Registered"
          />
        )}
        {vizLoading ? <StatCardSkeleton /> : (
          <StatCard
            color="var(--success)"
            icon={<IconBuildingCommunity size={20} />}
            stat={dashboardStats.totalCooperativesEngaged.toLocaleString()}
            label="Total Cooperatives Engaged"
          />
        )}
      </div>

      {/* Charts 2×2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1 — Donut: Youth vs non-youth participation */}
        <Card>
          <Card.Header>
            <Card.Title>Youth vs Non-Youth Participation</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-2">
            {individualsLoading ? <ChartSkeleton height="h-[280px]" /> : genderData.length === 0 ? <EmptyChart /> : (
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
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                  labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                >
                  {genderData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => {
                    const n = Number(value ?? 0);
                    return `${n.toLocaleString()} (${genderTotal ? ((n / genderTotal) * 100).toFixed(1) : 0}%)`;
                  }}
                />
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
            {vizLoading ? <ChartSkeleton height="h-[240px]" /> : jobsCreatedData.length === 0 ? <EmptyChart height={240} /> : (
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
      </div>

      {/* Bottom section: map ~65% + flagships status ~35% */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[65fr_35fr]">
        {/* Rwanda map */}
        <Card>
          <Card.Header>
            <Card.Title>Flagships and Where They Are Being Implemented</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {vizLoading ? <Skeleton className="h-[380px] rounded-xl" /> : (
            <Suspense fallback={<Skeleton className="h-[380px] rounded-xl" />}>
              <RwandaMap
                locations={(viz?.locations ?? []).map((l) => ({
                  name: l.flagshipCode || l.flagshipName,
                  district: l.district,
                  province: l.province,
                }))}
              />
            </Suspense>
            )}
          </Card.Content>
        </Card>

        {/* Flagships status */}
        <Card>
          <Card.Header>
            <Card.Title>Flagships Status</Card.Title>
          </Card.Header>
          <Card.Content className="max-h-[420px] overflow-y-auto p-4 pt-0">
            {statusQuery.isPending ? (
              <ChartSkeleton height="h-48" />
            ) : statusQuery.isError || !statusQuery.data ? (
              <p className="py-8 text-center text-sm text-(--danger)">Could not load flagship statuses.</p>
            ) : statusQuery.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-(--muted)">No flagships yet.</p>
            ) : (
              <FlagshipStatusList flagships={statusQuery.data} />
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
