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
  activeFlags: number;
  trend: MonthlyTrend[];
}

const DUMMY_STATS: DashboardStats = {
  totalFlagships: 12,
  totalReports: 8,
  totalUsers: 24,
  activeFlags: 7,
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
