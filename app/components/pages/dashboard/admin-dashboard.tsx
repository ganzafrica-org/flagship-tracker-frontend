import { Card, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import {
  IconBuildingFactory2,
  IconUserCheck,
  IconUserCog,
  IconUsers,
} from "@tabler/icons-react";

import { PageTitleCard } from "~/components/page-title-card";
import { StatCard } from "~/components/stat-card";
import { dashboardQueryOptions } from "~/lib/queries/dashboard";

function renderPieLabel(props: PieLabelRenderProps) {
  const { x, y, value, percent, textAnchor, payload } = props;
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
      fontSize={11}
      fontWeight={600}
      textAnchor={textAnchor ?? "middle"}
      dominantBaseline="central"
    >
      {`${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
    </text>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery(dashboardQueryOptions);

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard title="Dashboard Overview" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              color="var(--accent)"
              iconBackground="var(--accent-icon-bg)"
              icon={<IconUsers size={20} />}
              stat={String(stats?.totalUsers ?? "—")}
              label="Total Users"
            />
            <StatCard
              color="var(--warning)"
              iconBackground="var(--warning-icon-bg)"
              icon={<IconUserCheck size={20} />}
              stat={String(stats?.activeUsers ?? "—")}
              label="Total Active Users"
            />
            <StatCard
              color="var(--forest)"
              iconBackground="var(--forest-icon-bg)"
              icon={<IconUserCog size={20} />}
              stat={String(stats?.pendingUsers ?? "—")}
              label="Total Pending Users"
            />
            <StatCard
              color="var(--danger)"
              iconBackground="var(--danger-icon-bg)"
              icon={<IconBuildingFactory2 size={20} />}
              stat={String(stats?.totalFlagships ?? "—")}
              label="Total Flagships"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Active vs Inactive Users</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-52 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats?.usersByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                    label={renderPieLabel}
                    labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                  >
                    {stats?.usersByStatus?.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>User Gender Distribution</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-52 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats?.usersByGender}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                    label={renderPieLabel}
                    labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                  >
                    {stats?.usersByGender?.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Recent Users — placeholder */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Users</Card.Title>
        </Card.Header>
        <Card.Content className="p-4 pt-0">
          <div className="flex h-32 items-center justify-center text-sm text-(--muted)">
            No recent users to display.
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
