import type { LookupOption } from "~/lib/import/schema";
import { buildTemplateWorkbook, type ListColumn, type TemplateValue } from "~/lib/import/template";
import type { CooperativeDetail } from "~/lib/queries/cooperatives";
import { listDistricts, listProvinces, listSectors, matchName } from "~/lib/rwanda-hierarchy";
import { COOPERATIVE_COLUMNS, cooperativeSheetName } from "./schema";
import type { CooperativeImportLookups } from "./types";

function buildLists(lookups: CooperativeImportLookups): ListColumn[] {
  const provinces = listProvinces();
  const districtRows = provinces.flatMap((p) => listDistricts(p).map((d) => ({ p, d })));
  const sectorRows = districtRows.flatMap(({ p, d }) => listSectors(p, d).map((s) => ({ d, s })));
  return [
    { title: "Group Type", key: "groupTypes", values: lookups.groupTypes.map((o) => o.label) },
    { title: "Registration Status", key: "registrationStatuses", values: lookups.registrationStatuses.map((o) => o.label) },
    { title: "Flagship", key: "flagships", values: lookups.flagships.map((o) => o.label) },
    { title: "Engagement Type", key: "engagementTypes", values: lookups.engagementTypes.map((o) => o.label) },
    { title: "Province", key: "provinces", values: provinces },
    { title: "District", key: "districts", values: districtRows.map((r) => r.d) },
    { title: "…in province", values: districtRows.map((r) => r.p) },
    { title: "Sector", values: sectorRows.map((r) => r.s) },
    { title: "…in district", values: sectorRows.map((r) => r.d) },
  ];
}

/** The dropdown label for a stored value; an unknown value is kept as-is so nothing is lost. */
function label(options: LookupOption[], value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return options.find((o) => o.value === String(value))?.label ?? String(value);
}

/** One template row for an existing record, keyed like COOPERATIVE_COLUMNS (the form edits only the first flagship link). */
export function cooperativeTemplateRow(c: CooperativeDetail, lookups: CooperativeImportLookups): Record<string, TemplateValue> {
  const province = c.province ? (matchName(listProvinces(), c.province) ?? c.province) : null;
  const district = c.district ? (matchName(listDistricts(province ?? ""), c.district) ?? c.district) : null;
  const sector = c.sector ? (matchName(listSectors(province ?? "", district ?? ""), c.sector) ?? c.sector) : null;
  const link = c.flagships?.[0];
  return {
    cooperativeName: c.cooperativeName,
    cooperativeCode: c.cooperativeCode,
    groupType: label(lookups.groupTypes, c.groupType),
    registrationStatus: label(lookups.registrationStatuses, c.registrationStatus),
    primaryValueChain: c.primaryValueChain,
    cluster: c.cluster,
    totalMembers: c.totalMembers,
    femaleMembers: c.femaleMembers,
    youthMembers: c.youthMembers,
    province,
    district,
    sector,
    flagship: link ? label(lookups.flagships, link.flagshipId) : null,
    engagementType: link ? label(lookups.engagementTypes, link.engagementType) : null,
    engagementStartDate: link?.startDate,
    engagementEndDate: link?.endDate,
  };
}

/** The page's import template, pre-filled with `records` (header only when there are none). */
export function buildCooperativeImportTemplate(
  type: string,
  lookups: CooperativeImportLookups,
  records: CooperativeDetail[] = [],
): Promise<Blob> {
  return buildTemplateWorkbook(
    [{ name: cooperativeSheetName(type), columns: COOPERATIVE_COLUMNS, rows: records.map((c) => cooperativeTemplateRow(c, lookups)) }],
    buildLists(lookups),
  );
}
