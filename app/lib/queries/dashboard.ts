import { queryOptions } from "@tanstack/react-query";

export interface MonthlyTrend {
  month: string;
  flagships: number;
  reports: number;
}

export interface DashboardStats {
  totalFlagships: number;
  totalReports: number;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  activeFlags: number;
  usersByStatus: { name: string; value: number; fill: string }[];
  usersByGender: { name: string; value: number; fill: string }[];
  trend: MonthlyTrend[];
}

const DUMMY_STATS: DashboardStats = {
  totalFlagships: 12,
  totalReports: 8,
  totalUsers: 24,
  activeUsers: 18,
  pendingUsers: 4,
  activeFlags: 7,
  usersByStatus: [
    { name: "Active",   value: 18, fill: "var(--accent)"  },
    { name: "Inactive", value: 6,  fill: "var(--warning)" },
  ],
  usersByGender: [
    { name: "Male",   value: 14, fill: "var(--accent)"  },
    { name: "Female", value: 10, fill: "var(--warning)" },
  ],
  trend: [
    { month: "Nov", flagships: 6,  reports: 3 },
    { month: "Dec", flagships: 7,  reports: 4 },
    { month: "Jan", flagships: 8,  reports: 5 },
    { month: "Feb", flagships: 9,  reports: 6 },
    { month: "Mar", flagships: 10, reports: 7 },
    { month: "Apr", flagships: 12, reports: 8 },
  ],
};

export const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard"],
  // TODO: replace with api.get<DashboardStats>("/api/dashboard", undefined, signal)
  queryFn: () => Promise.resolve(DUMMY_STATS),
});
