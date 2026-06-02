import { useState } from "react";
import { Card, Dropdown } from "@heroui/react";
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
  IconCaretDownFilled,
  IconLink,
  IconLinkOff,
  IconUsers,
  IconWoman,
} from "@tabler/icons-react";

import { StatCard } from "~/components/stat-card";
import { CHART } from "~/data/dummy-flagship-detail";
import {
  cooperativeOverviewStats,
  cooperativeFlagshipProportionData,
  cooperativeMembersByFlagship,
  engagementTypeByFlagship,
  inclusionShareByFlagship,
  cooperativesPerFlagship,
  COOP_BAR_COLORS,
} from "~/data/dummy-cooperatives";
import { flagshipOptionsQueryOptions } from "~/lib/queries/cooperatives";

// ---------------------------------------------------------------------------
// Flagship filter dropdown
// ---------------------------------------------------------------------------

function FlagshipFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? "All Flagships";

  return (
    <Dropdown>
      <Dropdown.Trigger className="flex min-w-[160px] items-center justify-between gap-2 rounded-xl border border-(--separator) bg-(--surface) px-3 py-1.5 text-sm text-(--muted) hover:bg-(--default)">
        <span className="truncate">{label}</span>
        <IconCaretDownFilled size={14} className="shrink-0 text-(--muted)" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label="Filter by flagship"
          selectionMode="single"
          selectedKeys={[value]}
          disallowEmptySelection
          onAction={(key) => onChange(String(key))}
        >
          <Dropdown.Item key="all" id="all" textValue="All Flagships">
            All Flagships
          </Dropdown.Item>
          {options.map((opt) => (
            <Dropdown.Item key={opt.value} id={opt.value} textValue={opt.label}>
              {opt.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CooperativeOverview() {
  const [flagshipFilter, setFlagshipFilter] = useState("all");

  const { data: flagshipOptions = [] } = useQuery(flagshipOptionsQueryOptions());

  // When a flagship is selected, filter the chart data to that flagship only.
  // (With real API this would be a query param; here we filter the dummy arrays.)
  const filteredMembers =
    flagshipFilter === "all"
      ? cooperativeMembersByFlagship
      : cooperativeMembersByFlagship.filter(
          (r) => flagshipOptions.find((f) => f.value === flagshipFilter)?.label.startsWith(r.flagship) ?? true,
        );

  const filteredEngagement =
    flagshipFilter === "all"
      ? engagementTypeByFlagship
      : engagementTypeByFlagship.filter(
          (r) => flagshipOptions.find((f) => f.value === flagshipFilter)?.label.startsWith(r.flagship) ?? true,
        );

  const filteredInclusion =
    flagshipFilter === "all"
      ? inclusionShareByFlagship
      : inclusionShareByFlagship.filter(
          (r) => flagshipOptions.find((f) => f.value === flagshipFilter)?.label.startsWith(r.flagship) ?? true,
        );

  const filteredPerFlagship =
    flagshipFilter === "all"
      ? cooperativesPerFlagship
      : cooperativesPerFlagship.filter(
          (r) => flagshipOptions.find((f) => f.value === flagshipFilter)?.label.startsWith(r.flagship) ?? true,
        );

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Flagship filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-(--muted)">Filter by flagship:</span>
        <FlagshipFilter
          value={flagshipFilter}
          onChange={setFlagshipFilter}
          options={flagshipOptions}
        />
      </div>

      {/* KPI cards — C.1 to C.5 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          color="var(--accent)"
          icon={<IconBuildingCommunity size={20} />}
          stat={cooperativeOverviewStats.totalCooperatives}
          label="Total Cooperatives"
        />
        <StatCard
          color="var(--success)"
          icon={<IconLink size={20} />}
          stat={cooperativeOverviewStats.linkedToFlagships}
          label="Linked to Flagships"
        />
        <StatCard
          color="var(--warning)"
          icon={<IconLinkOff size={20} />}
          stat={cooperativeOverviewStats.notLinkedToFlagships}
          label="Not Linked"
        />
        <StatCard
          color="var(--forest)"
          icon={<IconUsers size={20} />}
          stat={cooperativeOverviewStats.totalMembers.toLocaleString()}
          label="Total Members"
        />
        <StatCard
          color="var(--danger)"
          icon={<IconWoman size={20} />}
          stat={cooperativeOverviewStats.totalFemaleMembers.toLocaleString()}
          label="Female Members"
        />
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
                  data={cooperativeFlagshipProportionData}
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
                  {cooperativeFlagshipProportionData.map((entry) => (
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
