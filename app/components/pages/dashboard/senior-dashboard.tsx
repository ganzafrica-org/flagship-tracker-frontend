import { useMemo, useState, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconCircleCheck,
  IconFlag,
  IconHourglass,
} from "@tabler/icons-react";

import { FlagshipStatusBadge } from "~/components/pages/flagships/flagships-list";
import { PageTitleCard } from "~/components/page-title-card";
import { TargetScopeFilter } from "~/components/target-scope-filter";
import { readTargetScope, withTargetScope, writeTargetScope, type TargetScope } from "~/lib/target-scope";
import { StatCard } from "~/components/stat-card";
import { StatCardSkeleton, ChartSkeleton } from "~/components/app-skeleton";
import {
  flagshipStatusListQueryOptions,
  seniorDashboardQueryOptions,
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

function FlagshipStatusTable({
  flagships,
  flagshipBase,
  targetScope,
}: {
  flagships: FlagshipSummaryRow[];
  flagshipBase: string;
  targetScope: TargetScope;
}) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto" data-testid="flagship-status-list">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
        <colgroup>
          <col className="w-14" />
          <col />
          <col className="w-28" />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-(--separator) text-(--muted)">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="py-2 pl-8 pr-3 font-medium">Flagship name</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Progress summary</th>
            <th className="px-3 py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {flagships.map((flagship, index) => {
            const detailsPath = withTargetScope(`${flagshipBase}/flagships/${flagship.flagshipId}`, targetScope);
            const name = flagship.flagshipCode
              ? `${flagship.flagshipName}(${flagship.flagshipCode})`
              : flagship.flagshipName;
            return (
              <tr
                key={flagship.flagshipId}
                className="cursor-pointer border-b border-(--separator) last:border-0"
                onClick={() => navigate(detailsPath)}
              >
                <td className="px-3 py-2.5 text-(--muted)">{index + 1}</td>
                <td className="py-2.5 pl-8 pr-3">
                  <Link
                    to={detailsPath}
                    viewTransition
                    className="text-(--foreground)"
                    data-testid={`flagship-status-${flagship.flagshipId}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {name}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <FlagshipStatusBadge status={flagship.status} />
                </td>
                <td className="px-3 py-2.5 whitespace-normal break-words text-(--foreground)">
                  {flagship.progressSummary?.trim() || ""}
                </td>
                <td className="px-3 py-2.5" />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SeniorDashboard({ flagshipBase = "/senior" }: { flagshipBase?: string }) {
  const [targetScope, setTargetScope] = useState<TargetScope>(() => readTargetScope());
  // Two independent aggregate queries, fetched in parallel; each section renders as soon as its own
  // data arrives (nothing here downloads a full list).
  const vizQuery = useQuery(seniorDashboardQueryOptions());
  const statusQuery = useQuery(flagshipStatusListQueryOptions);
  const viz = vizQuery.data;
  const vizLoading = vizQuery.isPending;

  // All values come from the visualizations API (materialized views). When there
  // is no underlying data the cards show 0 / "—" and the charts render empty —
  // never fabricated placeholder numbers.
  const dashboardStats = useMemo(() => {
    const rows = statusQuery.data ?? [];
    return {
      totalFlagships: viz?.cards.totalFlagships ?? 0,
      activeFlagships: rows.filter((row) => row.status === "active").length,
      planningFlagships: rows.filter((row) => row.status === "planning").length,
      totalJobsCreated: viz?.cards.totalJobsCreated ?? 0,
      totalCooperativesEngaged: viz?.cards.totalCooperativesEngaged ?? 0,
    };
  }, [statusQuery.data, viz]);

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
      <PageTitleCard
        title="Dashboard Overview"
        actionSlot={
          <TargetScopeFilter
            value={targetScope}
            onChange={(next) => {
              writeTargetScope(next);
              setTargetScope(next);
            }}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {vizLoading ? <StatCardSkeleton compact /> : (
          <StatCard
            compact
            color="var(--accent)"
            icon={<IconFlag size={20} />}
            stat={dashboardStats.totalFlagships}
            label="Total Flagships"
          />
        )}
        {statusQuery.isPending ? <StatCardSkeleton compact /> : (
          <StatCard
            compact
            color="var(--success)"
            icon={<IconCircleCheck size={20} />}
            stat={dashboardStats.activeFlagships}
            label="Active Flagships"
          />
        )}
        {statusQuery.isPending ? <StatCardSkeleton compact /> : (
          <StatCard
            compact
            color="var(--warning)"
            icon={<IconHourglass size={20} />}
            stat={dashboardStats.planningFlagships}
            label="Pending Flagships"
          />
        )}
        {vizLoading ? <StatCardSkeleton compact /> : (
          <StatCard
            compact
            color="oklch(66% 0.15 42)"
            icon={<IconBriefcase size={20} />}
            stat={dashboardStats.totalJobsCreated.toLocaleString()}
            label="Total Jobs Created"
          />
        )}
        {vizLoading ? <StatCardSkeleton compact /> : (
          <StatCard
            compact
            color="var(--forest)"
            icon={<IconBuildingCommunity size={20} />}
            stat={dashboardStats.totalCooperativesEngaged.toLocaleString()}
            label="Total Cooperatives Engaged"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {vizLoading ? (
          <>
            <ChartSkeleton height="h-[210px]" />
            <ChartSkeleton height="h-[210px]" />
          </>
        ) : (
        <>
        <Card>
          <Card.Header>
            <Card.Title>Jobs Created by Flagships</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {jobsCreatedData.length === 0 ? <EmptyChart height={150} /> : (
            <ResponsiveContainer width="100%" height={150} minWidth={0}>
              <BarChart data={jobsCreatedData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                <Bar dataKey="jobs" name="Jobs" maxBarSize={32} radius={[4, 4, 0, 0]}>
                  {jobsCreatedData.map((entry, index) => (
                    <Cell key={entry.flagship} fill={FLAGSHIP_BAR_COLORS[index % FLAGSHIP_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Youth vs non-youth participation in flagship</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <div className="grid h-[150px] grid-cols-2 items-center">
              <div className="flex justify-center">
                <div className="h-24 w-24 shrink-0 rounded-full border-[12px] border-(--default)" aria-hidden />
              </div>
              <div className="min-w-0 pl-8">
                <p className="text-sm font-semibold text-(--foreground)">No data yet</p>
                <p className="mt-1 text-xs text-(--muted)">Data will appear once records are added.</p>
                <ul className="mt-4 space-y-2 text-sm text-(--foreground)">
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-(--accent)" />
                    Youth
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-(--muted)" />
                    Non-youth
                  </li>
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>
        </>
        )}
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Flagships Status</Card.Title>
        </Card.Header>
        <Card.Content className="p-4 pt-0">
          {statusQuery.isPending ? (
            <ChartSkeleton height="h-48" />
          ) : statusQuery.isError || !statusQuery.data ? (
            <p className="py-8 text-center text-sm text-(--danger)">Could not load flagship statuses.</p>
          ) : statusQuery.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-(--muted)">No flagships yet.</p>
          ) : (
            <FlagshipStatusTable flagships={statusQuery.data} flagshipBase={flagshipBase} targetScope={targetScope} />
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Flagships and Where They Are Being Implemented</Card.Title>
        </Card.Header>
        <Card.Content className="p-4 pt-0">
          {vizLoading ? <Skeleton className="h-[380px] rounded-xl" /> : (
          <Suspense fallback={<Skeleton className="h-[380px] rounded-xl" />}>
            <RwandaMap
              locations={(viz?.locations ?? []).map((location) => ({
                name: location.flagshipCode || location.flagshipName,
                district: location.district,
                province: location.province,
              }))}
            />
          </Suspense>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
