import { useState } from "react";
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
import { StatCardSkeleton } from "~/components/app-skeleton";
import AppSelect from "~/components/app-select";
import VizRefreshButton from "~/components/viz-refresh-button";
import { CHART } from "~/data/dummy-flagship-detail";
import { COOP_BAR_COLORS } from "~/data/dummy-cooperatives";
import { flagshipOptionsQueryOptions } from "~/lib/queries/cooperatives";
import { cooperativesDashboardQueryOptions } from "~/lib/queries/visualizations";

const PROPORTION_FILLS = [CHART.accent, CHART.warning];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CooperativeOverview() {
  // "" = all flagships (server-side filter via ?flagship=<code>).
  const [flagshipFilter, setFlagshipFilter] = useState("");

  const { data: flagshipOptions = [] } = useQuery(flagshipOptionsQueryOptions());
  const { data, isLoading } = useQuery(
    cooperativesDashboardQueryOptions(flagshipFilter || undefined),
  );

  const stats = data?.cards;

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
  const filteredEngagement = (data?.engagementByFlagship ?? []).map((r) => ({
    flagship: r.flagshipCode,
    implementing_partner: r.implementingPartner,
    beneficiary_group: r.beneficiaryGroup,
    service_provider: r.serviceProvider,
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

  // Options use the flagship CODE as the value (the API filters by code).
  const flagshipFilterOptions = [
    { label: "All Flagships", value: "" },
    ...flagshipOptions.map((f) => ({
      label: f.label,
      value: f.label.split(" — ")[0],
    })),
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Flagship filter + refresh */}
      <div className="flex items-end justify-between gap-3">
        <div className="max-w-xs flex-1">
          <AppSelect
            name="flagshipFilter"
            label="Filter by Flagship"
            placeholder="All Flagships"
            selectedKey={flagshipFilter}
            onSelectionChange={setFlagshipFilter}
            options={flagshipFilterOptions}
          />
        </div>
        <VizRefreshButton />
      </div>

      {/* KPI cards — C.1 to C.5 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
        <>
        <StatCard
          color="var(--accent)"
          icon={<IconBuildingCommunity size={20} />}
          stat={stats?.totalCooperatives ?? "—"}
          label="Total Cooperatives"
        />
        <StatCard
          color="var(--success)"
          icon={<IconLink size={20} />}
          stat={stats?.linkedToFlagships ?? "—"}
          label="Linked to Flagships"
        />
        <StatCard
          color="var(--warning)"
          icon={<IconLinkOff size={20} />}
          stat={stats?.notLinkedToFlagships ?? "—"}
          label="Not Linked"
        />
        <StatCard
          color="var(--forest)"
          icon={<IconUsers size={20} />}
          stat={stats?.totalMembers != null ? stats.totalMembers.toLocaleString() : "—"}
          label="Total Members"
        />
        <StatCard
          color="var(--danger)"
          icon={<IconWoman size={20} />}
          stat={stats?.totalFemaleMembers != null ? stats.totalFemaleMembers.toLocaleString() : "—"}
          label="Female Members"
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
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={proportionData}
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
                  {proportionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* C.7 — Bar: Cooperative Members by Flagship */}
        <Card>
          <Card.Header>
            <Card.Title>Cooperative Members by Flagship</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
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
          </Card.Content>
        </Card>

        {/* C.8 — Stacked bar: Engagement type per flagship */}
        <Card>
          <Card.Header>
            <Card.Title>Engagement Type per Flagship</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <BarChart data={filteredEngagement} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="implementing_partner" name="Implementing Partner" stackId="a" fill={CHART.accent} />
                <Bar dataKey="beneficiary_group" name="Beneficiary Group" stackId="a" fill={CHART.warning} />
                <Bar dataKey="service_provider" name="Service Provider" stackId="a" fill={CHART.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* C.9 — Grouped bar: Female & Youth members share */}
        <Card>
          <Card.Header>
            <Card.Title>Female &amp; Youth Members Share (%)</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
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
          </Card.Content>
        </Card>
      </div>

      {/* C.10 — Bar: Cooperatives enrolled per flagship (full-width) */}
      <Card>
        <Card.Header>
          <Card.Title>Cooperatives Enrolled per Flagship</Card.Title>
        </Card.Header>
        <Card.Content className="p-4 pt-0">
          <ResponsiveContainer width="100%" height={240} minWidth={0}>
            <BarChart data={filteredPerFlagship} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
              <Bar dataKey="cooperatives" name="Cooperatives" radius={[4, 4, 0, 0]}>
                {filteredPerFlagship.map((entry, index) => (
                  <Cell key={entry.flagship} fill={COOP_BAR_COLORS[index % COOP_BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card.Content>
      </Card>
    </div>
  );
}
