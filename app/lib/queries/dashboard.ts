import { queryOptions } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { User } from "~/lib/queries/users";

export interface CountByLabel {
  label: string;
  count: number;
}

/** Raw shape returned by GET /api/users/stats. */
export interface UserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: CountByLabel[];
  registeredOverTime: CountByLabel[];
}

/** Friendly role labels for the by-role chart. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SENIOR: "Senior",
  MONITORING_OFFICER: "M&E Officer",
};

const STATUS_FILLS = ["var(--accent)", "var(--warning)"];
const ROLE_FILLS = ["var(--accent)", "var(--forest)", "var(--warning)"];

/** View-model the dashboard component consumes (charts pre-shaped for recharts). */
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByStatus: { name: string; value: number; fill: string }[];
  usersByRole: { name: string; value: number; fill: string }[];
  registeredOverTime: { month: string; count: number }[];
}

function toViewModel(s: UserStatsResponse): DashboardStats {
  return {
    totalUsers: s.totalUsers,
    activeUsers: s.activeUsers,
    inactiveUsers: s.inactiveUsers,
    usersByStatus: [
      { name: "Active", value: s.activeUsers, fill: STATUS_FILLS[0] },
      { name: "Inactive", value: s.inactiveUsers, fill: STATUS_FILLS[1] },
    ],
    usersByRole: s.byRole.map((r, i) => ({
      name: ROLE_LABELS[r.label] ?? r.label,
      value: r.count,
      fill: ROLE_FILLS[i % ROLE_FILLS.length],
    })),
    registeredOverTime: s.registeredOverTime.map((r) => ({ month: r.label, count: r.count })),
  };
}

export const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard", "user-stats"],
  queryFn: async ({ signal }) => {
    const stats = await api.get<UserStatsResponse>("/api/users/stats", undefined, signal);
    return toViewModel(stats);
  },
});

export const recentUsersQueryOptions = (limit = 10) =>
  queryOptions({
    queryKey: ["dashboard", "recent-users", limit],
    queryFn: ({ signal }) => api.get<User[]>("/api/users/recent", { limit }, signal),
  });
