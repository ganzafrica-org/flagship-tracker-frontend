import type { ExportColumn } from "~/lib/export/table-export";
import { formatBudgetRwf, type FlagshipDetailResponse } from "~/lib/queries/flagships";

type Row = Record<string, unknown>;

const show = (v: unknown) => (v === null || v === undefined || v === "" ? "" : v);
const showDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");
const capitalize = (v: unknown) => {
  const text = String(v ?? "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

export const FLAGSHIP_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "Project name", label: "Project name" },
  { key: "Code", label: "Code" },
  { key: "Cluster", label: "Cluster" },
  { key: "Status", label: "Status" },
  { key: "Primary value chain", label: "Primary value chain" },
  { key: "Description", label: "Description" },
  { key: "Implementing agency", label: "Implementing agency" },
  { key: "Management model", label: "Management model" },
  { key: "Start date", label: "Start date" },
  { key: "End date", label: "End date" },
  { key: "Target youth count", label: "Target youth count" },
  { key: "Jobs created", label: "Jobs created" },
  { key: "Progress", label: "Progress" },
  { key: "Total budget", label: "Total budget" },
  { key: "Funders", label: "Funders" },
  { key: "Locations", label: "Locations" },
  { key: "KPIs", label: "KPIs" },
  { key: "Investments", label: "Investments" },
];

function flattenFlagship(d: FlagshipDetailResponse): Row {
  const locations = (d.locations ?? [])
    .map((l) => [l.district, l.sector, l.province].filter(Boolean).join(", "))
    .join("; ");

  const kpis = (d.kpis ?? [])
    .map((k) => `${k.indicatorName} (${k.year}): ${show(k.actualValue) || "—"}/${show(k.targetValue) || "—"}`)
    .join("; ");

  const investments = (d.investments ?? [])
    .map((i) => [i.investorName ?? i.sourceType, `${i.amountRwf.toLocaleString("en-US")} RWF`, i.year].filter(Boolean).join(" · "))
    .join("; ");

  const funders = (d.fundingContributions ?? []).map((f) => f.name).filter(Boolean).join(", ") || show(d.funders);

  return {
    "Project name": show(d.flagshipName),
    "Code": show(d.flagshipCode),
    "Cluster": show(d.flagshipCluster),
    "Status": capitalize(d.status),
    "Primary value chain": show(d.primaryValueChain),
    "Description": show(d.description),
    "Implementing agency": show(d.implementingAgency),
    "Management model": show(d.managementModel),
    "Start date": showDate(d.startDate),
    "End date": showDate(d.endDate),
    "Target youth count": show(d.targetYouthCount),
    "Jobs created": show(d.jobsCreated),
    "Progress": d.progressPercent != null ? `${d.progressPercent}%` : "",
    "Total budget": d.budgetTotalRwf != null ? formatBudgetRwf(d.budgetTotalRwf) : "",
    "Funders": funders,
    "Locations": locations,
    "KPIs": kpis,
    "Investments": investments,
  };
}

/**
 * Export data for every Flagships "Export" button: the list endpoint already returns each
 * flagship's full detail (locations, KPIs, investments, funding breakdown), so this just flattens
 * it the same way the compact table columns are built — no extra per-record fetch needed.
 */
export function buildFlagshipsExportData(flagships: FlagshipDetailResponse[]): { columns: ExportColumn[]; rows: Row[] } {
  return { columns: FLAGSHIP_EXPORT_COLUMNS, rows: flagships.map(flattenFlagship) };
}
