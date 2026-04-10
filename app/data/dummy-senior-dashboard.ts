/**
 * Dummy data for the Senior Officials dashboard (development only).
 * All values are fictional and for display purposes only.
 */

import { CHART } from "~/data/dummy-flagship-detail";

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------

export const seniorDashboardStats = {
  totalFlagships: 12,
  totalJobsCreated: 34_820,
  totalInvestors: 47,
  totalInvestment: "142.6B",
};

// ---------------------------------------------------------------------------
// Years available for chart filters
// ---------------------------------------------------------------------------

export const SENIOR_DASHBOARD_YEARS = ["2021", "2022", "2023", "2024", "2025", "2026"] as const;
export type SeniorDashboardYear = (typeof SENIOR_DASHBOARD_YEARS)[number];

// ---------------------------------------------------------------------------
// Donut chart — Number of Youths Employed (Men vs. Women), by year
// ---------------------------------------------------------------------------

export const youthEmploymentByYear: Record<SeniorDashboardYear, { name: string; value: number; fill: string }[]> = {
  "2021": [
    { name: "Male", value: 3_200, fill: CHART.accent },
    { name: "Female", value: 2_400, fill: CHART.warning },
  ],
  "2022": [
    { name: "Male", value: 4_100, fill: CHART.accent },
    { name: "Female", value: 3_300, fill: CHART.warning },
  ],
  "2023": [
    { name: "Male", value: 5_500, fill: CHART.accent },
    { name: "Female", value: 4_200, fill: CHART.warning },
  ],
  "2024": [
    { name: "Male", value: 7_200, fill: CHART.accent },
    { name: "Female", value: 5_800, fill: CHART.warning },
  ],
  "2025": [
    { name: "Male", value: 9_100, fill: CHART.accent },
    { name: "Female", value: 7_400, fill: CHART.warning },
  ],
  "2026": [
    { name: "Male", value: 11_000, fill: CHART.accent },
    { name: "Female", value: 9_200, fill: CHART.warning },
  ],
};

// ---------------------------------------------------------------------------
// Column chart — Number of Jobs for Youth per Flagship, by year
// ---------------------------------------------------------------------------

export interface JobsPerFlagshipRow {
  flagship: string;
  jobs: number;
}

export const jobsPerFlagshipByYear: Record<SeniorDashboardYear, JobsPerFlagshipRow[]> = {
  "2021": [
    { flagship: "YEPA",   jobs: 1_200 },
    { flagship: "EYPDEL", jobs: 980 },
    { flagship: "HINGA",  jobs: 760 },
    { flagship: "YAMS",   jobs: 640 },
    { flagship: "MYPIG",  jobs: 520 },
  ],
  "2022": [
    { flagship: "YEPA",   jobs: 1_800 },
    { flagship: "EYPDEL", jobs: 1_240 },
    { flagship: "HINGA",  jobs: 1_050 },
    { flagship: "YAMS",   jobs: 870 },
    { flagship: "MYPIG",  jobs: 700 },
  ],
  "2023": [
    { flagship: "YEPA",   jobs: 2_400 },
    { flagship: "EYPDEL", jobs: 1_700 },
    { flagship: "HINGA",  jobs: 1_400 },
    { flagship: "YAMS",   jobs: 1_100 },
    { flagship: "MYPIG",  jobs: 900 },
  ],
  "2024": [
    { flagship: "YEPA",   jobs: 3_100 },
    { flagship: "EYPDEL", jobs: 2_200 },
    { flagship: "HINGA",  jobs: 1_900 },
    { flagship: "YAMS",   jobs: 1_500 },
    { flagship: "MYPIG",  jobs: 1_200 },
  ],
  "2025": [
    { flagship: "YEPA",   jobs: 4_000 },
    { flagship: "EYPDEL", jobs: 2_900 },
    { flagship: "HINGA",  jobs: 2_600 },
    { flagship: "YAMS",   jobs: 2_000 },
    { flagship: "MYPIG",  jobs: 1_600 },
  ],
  "2026": [
    { flagship: "YEPA",   jobs: 5_200 },
    { flagship: "EYPDEL", jobs: 3_800 },
    { flagship: "HINGA",  jobs: 3_400 },
    { flagship: "YAMS",   jobs: 2_700 },
    { flagship: "MYPIG",  jobs: 2_100 },
  ],
};

/** Bar colors per flagship — cycle through the card accent colors */
export const FLAGSHIP_BAR_COLORS = [
  CHART.accent,
  CHART.warning,
  CHART.success,
  CHART.danger,
] as const;

// ---------------------------------------------------------------------------
// Column chart — Jobs Created by Flagships, by year
// ---------------------------------------------------------------------------

export interface JobsCreatedRow {
  year: string;
  YEPA: number;
  EYPDEL: number;
  HINGA: number;
  YAMS: number;
  MYPIG: number;
}

export const jobsCreatedByFlagship: JobsCreatedRow[] = [
  { year: "2021", YEPA: 1_200, EYPDEL: 980,   HINGA: 760,   YAMS: 640,   MYPIG: 520   },
  { year: "2022", YEPA: 1_800, EYPDEL: 1_240,  HINGA: 1_050, YAMS: 870,   MYPIG: 700   },
  { year: "2023", YEPA: 2_400, EYPDEL: 1_700,  HINGA: 1_400, YAMS: 1_100, MYPIG: 900   },
  { year: "2024", YEPA: 3_100, EYPDEL: 2_200,  HINGA: 1_900, YAMS: 1_500, MYPIG: 1_200 },
  { year: "2025", YEPA: 4_000, EYPDEL: 2_900,  HINGA: 2_600, YAMS: 2_000, MYPIG: 1_600 },
  { year: "2026", YEPA: 5_200, EYPDEL: 3_800,  HINGA: 3_400, YAMS: 2_700, MYPIG: 2_100 },
];

export const jobsCreatedFilteredByYear = (year: SeniorDashboardYear): JobsCreatedRow[] =>
  jobsCreatedByFlagship.filter((r) => Number(r.year) <= Number(year));

/** For chart 3: returns per-flagship totals up to the selected year, x-axis = flagship name */
export interface JobsByFlagshipTotalRow {
  flagship: string;
  jobs: number;
}

export const jobsCreatedByFlagshipForYear = (year: SeniorDashboardYear): JobsByFlagshipTotalRow[] => {
  const rows = jobsCreatedByFlagship.filter((r) => Number(r.year) <= Number(year));
  const totals: Record<string, number> = { YEPA: 0, EYPDEL: 0, HINGA: 0, YAMS: 0, MYPIG: 0 };
  for (const row of rows) {
    totals["YEPA"]   += row.YEPA;
    totals["EYPDEL"] += row.EYPDEL;
    totals["HINGA"]  += row.HINGA;
    totals["YAMS"]   += row.YAMS;
    totals["MYPIG"]  += row.MYPIG;
  }
  return Object.entries(totals).map(([flagship, jobs]) => ({ flagship, jobs }));
};

// ---------------------------------------------------------------------------
// Pie chart — Disaggregation of Total Investment
// ---------------------------------------------------------------------------

export const investmentDisaggregation = [
  { name: "Government", value: 58, fill: CHART.accent },
  { name: "Private",    value: 27, fill: CHART.warning },
  { name: "Bilateral",  value: 15, fill: CHART.danger },
];

// ---------------------------------------------------------------------------
// Rwanda map — flagship implementation locations
// ---------------------------------------------------------------------------

export interface FlagshipLocation {
  id: string;
  name: string;
  district: string;
  /** WGS84 latitude */
  lat: number;
  /** WGS84 longitude */
  lng: number;
  color: string;
}

export const flagshipLocations: FlagshipLocation[] = [
  { id: "yepa",   name: "YEPA",   district: "Kigali",    lat: -1.9441, lng: 30.0619, color: CHART.accent  },
  { id: "eypdel", name: "EYPDEL", district: "Musanze",   lat: -1.4988, lng: 29.6341, color: CHART.warning },
  { id: "hinga",  name: "HINGA",  district: "Huye",      lat: -2.5975, lng: 29.7388, color: CHART.success },
  { id: "yams",   name: "YAMS",   district: "Rubavu",    lat: -1.6832, lng: 29.2564, color: CHART.danger  },
  { id: "mypig",  name: "MYPIG",  district: "Nyagatare", lat: -1.2958, lng: 30.3249, color: CHART.accent  },
];

// ---------------------------------------------------------------------------
// Investment progress per flagship
// ---------------------------------------------------------------------------

export type ProgressStatus = "percentage" | "planning";

export interface InvestmentProgress {
  id: string;
  flagship: string;
  targetLabel: string;
  value: number;
  status: ProgressStatus;
}

export const investmentProgress: InvestmentProgress[] = [
  { id: "yepa",   flagship: "YEPA",   targetLabel: "40B RWF", value: 17, status: "percentage" },
  { id: "eypdel", flagship: "EYPDEL", targetLabel: "28B RWF", value: 34, status: "percentage" },
  { id: "hinga",  flagship: "HINGA",  targetLabel: "55B RWF", value: 8,  status: "planning"   },
  { id: "yams",   flagship: "YAMS",   targetLabel: "19B RWF", value: 61, status: "percentage" },
  { id: "mypig",  flagship: "MYPIG",  targetLabel: "32B RWF", value: 22, status: "planning"   },
];
