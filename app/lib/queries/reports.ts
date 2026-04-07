import { queryOptions } from "@tanstack/react-query";

export interface Report {
  id: number;
  title: string;
  flagshipId: number;
  createdAt: string;
}

const DUMMY_REPORTS: Report[] = [
  { id: 1, title: "Q1 Progress Report", flagshipId: 1, createdAt: "2026-01-15" },
  { id: 2, title: "Q2 Progress Report", flagshipId: 2, createdAt: "2026-04-01" },
  { id: 3, title: "Annual Summary",     flagshipId: 3, createdAt: "2026-03-20" },
];

export const reportsQueryOptions = queryOptions({
  queryKey: ["reports"],
  // TODO: replace with api.get<Report[]>("/api/reports", undefined, signal)
  queryFn: () => Promise.resolve(DUMMY_REPORTS),
});
