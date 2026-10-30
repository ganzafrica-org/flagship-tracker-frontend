import { buildTemplateWorkbook, type ListColumn } from "~/lib/import/template";
import { listAllRwandaDistricts, listRwandaDistricts, listRwandaProvinces } from "~/lib/rwanda-locations";
import { listDistricts, listProvinces, listSectors } from "~/lib/rwanda-hierarchy";
import type { IndividualImportLookups } from "./lookups";
import { DISABILITY_OPTIONS, INDIVIDUALS_SHEET, INDIVIDUAL_COLUMNS, YOUTH_STATUS_OPTIONS } from "./schema";

function buildLists(lookups: IndividualImportLookups): ListColumn[] {
  const provinces = listProvinces();
  const districtRows = provinces.flatMap((p) => listDistricts(p).map((d) => ({ p, d })));
  const sectorRows = districtRows.flatMap(({ p, d }) => listSectors(p, d).map((s) => ({ d, s })));
  // listRwandaDistricts is the static fallback the filters use; it keeps the template usable if the package returns nothing.
  const fallbackProvinces = listRwandaProvinces();
  const fallbackDistricts = listAllRwandaDistricts();

  return [
    { title: "Sex", key: "sex", values: lookups.sex.map((o) => o.label) },
    { title: "Youth Status", key: "youthStatus", values: YOUTH_STATUS_OPTIONS.map((o) => o.label) },
    { title: "Youth Status (stored value)", values: YOUTH_STATUS_OPTIONS.map((o) => o.value) },
    { title: "Youth Category", key: "youthCategory", values: lookups.youthCategory.map((o) => o.label) },
    { title: "Education Level", key: "educationLevel", values: lookups.educationLevel.map((o) => o.label) },
    { title: "Disability Status", key: "disability", values: DISABILITY_OPTIONS.map((o) => o.label) },
    { title: "Registration Source", key: "registrationSource", values: lookups.registrationSource.map((o) => o.label) },
    { title: "Province", key: "provinces", values: provinces.length ? provinces : fallbackProvinces },
    {
      title: "District",
      key: "districts",
      values: districtRows.length ? districtRows.map((r) => r.d) : fallbackDistricts,
    },
    {
      title: "…in province",
      values: districtRows.length ? districtRows.map((r) => r.p) : fallbackDistricts.map((d) => listRwandaProvinces().find((p) => listRwandaDistricts(p).includes(d)) ?? ""),
    },
    { title: "Sector", values: sectorRows.map((r) => r.s) },
    { title: "…in district", values: sectorRows.map((r) => r.d) },
  ];
}

/** Builds the individuals import template: one Individuals sheet plus the Lists sheet. */
export function buildIndividualImportTemplate(lookups: IndividualImportLookups): Promise<Blob> {
  return buildTemplateWorkbook([{ name: INDIVIDUALS_SHEET, columns: INDIVIDUAL_COLUMNS }], buildLists(lookups));
}
