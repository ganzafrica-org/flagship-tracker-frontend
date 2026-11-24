import { Card } from "@heroui/react";
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
  IconBuildingCommunity,
  IconLink,
  IconLinkOff,
  IconUsers,
  IconWoman,
} from "@tabler/icons-react";

import { StatCard } from "~/components/stat-card";
import { ChartSkeleton, StatCardSkeleton } from "~/components/app-skeleton";
import { CHART } from "~/data/dummy-flagship-detail";
import { COOP_BAR_COLORS } from "~/data/dummy-cooperatives";
import { cooperativeTypeNames } from "~/lib/queries/cooperatives";
import { cooperativesDashboardQueryOptions } from "~/lib/queries/visualizations";

const PROPORTION_FILLS = [CHART.accent, CHART.warning];

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center px-6 text-center text-sm text-(--muted-foreground)">
      {message}
    </div>
  );
}

function hasChartData<T>(rows: T[]) {
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CooperativeOverview({ type }: { type?: string }) {
  const { data, isLoading } = useQuery(
    cooperativesDashboardQueryOptions(undefined, type || undefined),
  );

  const stats = data?.cards;
  const names = cooperativeTypeNames(type || "cooperative");
  const typeLabel = names.plural;
  const singularLower = names.singular.toLowerCase();
  const pluralLower = names.plural.toLowerCase();

  // Map the API payload onto the data-keys the charts already use.
  const proportionData = (data?.flagshipProportion ?? []).map((p, i) => ({
    name: p.name,
    value: p.value,
    fill: PROPORTION_FILLS[i % PROPORTION_FILLS.length],
  }));
  const filteredMembers = (data?.membersByFlagship ?? []).map((r) => ({
    flagship: r.flagshipCode,
    members: r.members ?? 0,
  }));
  const filteredInclusion = (data?.inclusionShare ?? []).map((r) => ({
    flagship: r.flagshipCode,
    femaleShare: r.femaleShare ?? 0,
    youthShare: r.youthShare ?? 0,
  }));
  const filteredPerFlagship = (data?.cooperativesPerFlagship ?? []).map((r) => ({
    flagship: r.flagshipCode,
    cooperatives: r.cooperatives,
  }));

  const hasLinkedCooperatives = (stats?.linkedToFlagships ?? 0) > 0;
  const flagshipChartEmptyMessage = hasLinkedCooperatives
    ? "No flagship data yet."
    : `No ${pluralLower} are linked to flagships yet. Link a ${singularLower} on step 2 when adding or editing.`;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* KPI cards — C.1 to C.5 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
        <>
        <StatCard
          color="var(--accent)"
          icon={<IconBuildingCommunity size={20} />}
          stat={stats?.totalCooperatives ?? "—"}
          label={`Total ${typeLabel}`}
        />
        <StatCard
          color="var(--success)"
          icon={<IconLink size={20} />}
          stat={stats?.linkedToFlagships ?? "—"}
          label="Linked to Flagship"
        />
        <StatCard
          color="var(--warning)"
          icon={<IconLinkOff size={20} />}
          stat={stats?.notLinkedToFlagships ?? "—"}
          label="Not Linked to Flagship"
        />
        <StatCard
          color="var(--forest)"
          icon={<IconUsers size={20} />}
          stat={stats?.totalMembers != null ? stats.totalMembers.toLocaleString() : "—"}
          label="Total Members Registered"
        />
        <StatCard
          color="var(--danger)"
          icon={<IconWoman size={20} />}
          stat={stats?.totalFemaleMembers != null ? stats.totalFemaleMembers.toLocaleString() : "—"}
          label="Total Female Registered"
        />
        </>
        )}
      </div>

      {/* Charts 2×2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* C.6 — Donut: Flagship vs non-flagship proportion */}
        <Card>
          <Card.Header>
            <Card.Title>Flagship vs Non-Flagship Proportion</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isLoading ? (
              <ChartSkeleton height="h-64" />
            ) : (stats?.totalCooperatives ?? 0) === 0 ? (
              <ChartEmptyState message={`No ${pluralLower} yet.`} />
            ) : (
            <div className="flex h-[280px] flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={proportionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {proportionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-3 text-sm">
                {proportionData.map((entry) => {
                  const total = proportionData.reduce((sum, item) => sum + item.value, 0);
                  const share = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                  return (
                    <li key={entry.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-(--foreground)">{entry.name}</span>
                      <span className="font-medium text-(--foreground)">{entry.value.toLocaleString()} ({share}%)</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            )}
          </Card.Content>
        </Card>

        {/* C.7 — Bar: Cooperative Members by Flagship */}
        <Card>
          <Card.Header>
            <Card.Title>{names.singular} Members by Flagship</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isLoading ? (
              <ChartSkeleton height="h-64" />
            ) : !hasChartData(filteredMembers) ? (
              <ChartEmptyState message={flagshipChartEmptyMessage} />
            ) : (
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <BarChart data={filteredMembers} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                <Bar dataKey="members" name="Members" radius={[4, 4, 0, 0]}>
                  {filteredMembers.map((entry, index) => (
                    <Cell key={entry.flagship} fill={COOP_BAR_COLORS[index % COOP_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>

        {/* Female & Youth members share */}
        <Card>
          <Card.Header>
            <Card.Title>Female &amp; Youth Members Share (%)</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isLoading ? (
              <ChartSkeleton height="h-64" />
            ) : !hasChartData(filteredInclusion) ? (
              <ChartEmptyState message={flagshipChartEmptyMessage} />
            ) : (
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <BarChart data={filteredInclusion} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="femaleShare" name="Female Share" fill={CHART.danger} radius={[4, 4, 0, 0]} />
                <Bar dataKey="youthShare" name="Youth Share" fill={CHART.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{typeLabel} Enrolled per Flagship</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isLoading ? (
              <ChartSkeleton height="h-64" />
            ) : !hasChartData(filteredPerFlagship) ? (
              <ChartEmptyState message={flagshipChartEmptyMessage} />
            ) : (
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <BarChart data={filteredPerFlagship} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                <Bar dataKey="cooperatives" name={typeLabel} radius={[4, 4, 0, 0]}>
                  {filteredPerFlagship.map((entry, index) => (
                    <Cell key={entry.flagship} fill={COOP_BAR_COLORS[index % COOP_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
