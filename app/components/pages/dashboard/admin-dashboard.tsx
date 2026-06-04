import { Card } from "@heroui/react";
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
import type { PieLabelRenderProps } from "recharts";
import { useNavigate } from "react-router";
import {
  IconUserCheck,
  IconUserCog,
  IconUserOff,
  IconUsers,
} from "@tabler/icons-react";

import { PageTitleCard } from "~/components/page-title-card";
import { StatCard } from "~/components/stat-card";
import TableComponent from "~/components/table-component";
import { StatCardSkeleton, ChartSkeleton } from "~/components/app-skeleton";
import { dashboardQueryOptions, recentUsersQueryOptions } from "~/lib/queries/dashboard";

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
  const navigate = useNavigate();
  // Two independent queries — each section shows its own skeleton until it resolves.
  const { data: stats, isLoading: statsLoading } = useQuery(dashboardQueryOptions);
  const { data: recentUsers = [], isLoading: recentLoading } = useQuery(recentUsersQueryOptions(10));

  const recentUserRows = recentUsers.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.active ? "Active" : "Inactive",
  }));

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard title="Dashboard Overview" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
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
              color="var(--forest)"
              iconBackground="var(--forest-icon-bg)"
              icon={<IconUserCheck size={20} />}
              stat={String(stats?.activeUsers ?? "—")}
              label="Active Users"
            />
            <StatCard
              color="var(--warning)"
              iconBackground="var(--warning-icon-bg)"
              icon={<IconUserOff size={20} />}
              stat={String(stats?.inactiveUsers ?? "—")}
              label="Inactive Users"
            />
            <StatCard
              color="var(--danger)"
              iconBackground="var(--danger-icon-bg)"
              icon={<IconUserCog size={20} />}
              stat={String(
                stats?.usersByRole?.find((r) => r.name === "Admin")?.value ?? "—",
              )}
              label="Admins"
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
            {statsLoading ? (
              <ChartSkeleton height="h-52" />
            ) : (
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
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
            <Card.Title>Users by Role</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {statsLoading ? (
              <ChartSkeleton height="h-52" />
            ) : (
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart data={stats?.usersByRole} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Users" radius={[4, 4, 0, 0]}>
                    {stats?.usersByRole?.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>
      </div>

      <TableComponent
        tableSectionTitle="Recent Users"
        tableAriaLabel="Recent users table"
        rows={recentUserRows}
        loading={recentLoading}
        emptyMessage="No users yet"
        searchKeys={["fullName", "email", "role"]}
        columns={[
          { key: "id", label: "#" },
          { key: "fullName", label: "Full Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          { key: "action", label: "Action" },
        ]}
        minTableWidthClassName="min-w-[800px]"
        filterByTab={() => true}
        statusColumnKey="status"
        statusColorMap={{
          Active: "success",
          Inactive: "default",
        }}
        actions={(row) => [
          {
            label: "View Details",
            onClick: () =>
              navigate(`/admin/users/add-user?editId=${encodeURIComponent(String(row.id))}&mode=view`),
          },
        ]}
      />
    </div>
  );
}
