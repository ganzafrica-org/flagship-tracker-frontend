import type { ImportLookups } from "./lookups";
import { SHEET_COLUMNS, SHEET_NAMES, SHEET_ORDER } from "./schema";
import { buildTemplateWorkbook, type ListColumn } from "~/lib/import/template";
import { listRwandaDistricts } from "~/lib/rwanda-locations";

/** One Lists-sheet column per allowed-value list; the first one for each key feeds the dropdowns. */
function buildLists(lookups: ImportLookups): ListColumn[] {
  const columns: ListColumn[] = [];
  const add = (title: string, values: string[], key?: string) => {
    columns.push({ title, values, key });
  };

  add("Flagship Cluster", lookups.clusters.map((o) => o.label), "clusters");
  add("Status", lookups.statuses.map((o) => o.label), "statuses");
  add("Primary Value Chain", lookups.valueChains.map((v) => v.valueChain), "valueChains");
  add("…belongs to cluster", lookups.valueChains.map((v) => lookups.clusters.find((c) => c.value === v.cluster)?.label ?? v.cluster));
  add("Funder", lookups.funders.map((o) => o.label), "funders");
  add("Implementing Agency", lookups.agencies.map((o) => o.label), "agencies");
  add("Currency", lookups.currencies.map((o) => o.label), "currencies");
  add("Source Type", lookups.sourceTypes.map((o) => o.label), "sourceTypes");
  add("Disbursement Type", lookups.disbursementTypes.map((o) => o.label), "disbursementTypes");
  add("Measurement Point", lookups.measurementPoints.map((o) => o.label), "measurementPoints");
  add("Reporting Period", lookups.reportingPeriods.map((o) => o.label), "reportingPeriods");
  add("KPI Indicator Name", [...new Set(lookups.kpiDefinitions.map((d) => d.indicatorName))], "kpiIndicators");
  add("KPI Definitions: Flagship Code", lookups.kpiDefinitions.map((d) => d.flagshipCode));
  add("KPI Definitions: Indicator", lookups.kpiDefinitions.map((d) => d.indicatorName));
  add("Province", lookups.provinces, "provinces");
  const districtRows = lookups.provinces.flatMap((p) => listRwandaDistricts(p).map((d) => ({ p, d })));
  add("District", districtRows.map((r) => r.d));
  add("…in province", districtRows.map((r) => r.p));
  return columns;
}

/** Builds the flagship import template: one sheet per form step plus the Lists sheet. */
export function buildImportTemplate(lookups: ImportLookups): Promise<Blob> {
  return buildTemplateWorkbook(
    SHEET_ORDER.map((id) => ({ name: SHEET_NAMES[id], columns: SHEET_COLUMNS[id] })),
    buildLists(lookups),
  );
}
