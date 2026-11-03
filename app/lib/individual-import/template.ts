import type { LookupOption } from "~/lib/import/schema";
import { buildTemplateWorkbook, type ListColumn, type TemplateValue } from "~/lib/import/template";
import type { IndividualDetailResponse } from "~/lib/queries/individuals";
import { listAllRwandaDistricts, listRwandaDistricts, listRwandaProvinces } from "~/lib/rwanda-locations";
import { listCells, listDistricts, listProvinces, listSectors, listVillages, matchName } from "~/lib/rwanda-hierarchy";
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

// Same normalisation the parser applies to these columns, so a written label always matches back.
const underscored = (t: string) => t.toLowerCase().replace(/[\s-]+/g, "_");
const lower = (t: string) => t.toLowerCase();

/** The dropdown label for a stored value (what the template offers); unknown values are kept as-is. */
function optionLabel(options: LookupOption[], value: string | null | undefined, normalize = lower): string | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  const wanted = normalize(value.trim());
  return options.find((o) => normalize(o.value) === wanted || normalize(o.label) === wanted)?.label ?? value;
}

/** Location names in the hierarchy's spelling (the parser matches case-insensitively, the dropdowns exactly). */
function location(d: IndividualDetailResponse) {
  const province = d.province ? (matchName(listProvinces(), d.province) ?? d.province) : "";
  const district = d.district ? (matchName(listDistricts(province), d.district) ?? d.district) : "";
  const sector = d.sector ? (matchName(listSectors(province, district), d.sector) ?? d.sector) : "";
  const cell = d.cell ? (matchName(listCells(province, district, sector), d.cell) ?? d.cell) : "";
  const village = d.village ? (matchName(listVillages(province, district, sector, cell), d.village) ?? d.village) : "";
  return { province, district, sector, cell, village };
}

/** One template row for an existing individual, keyed like INDIVIDUAL_COLUMNS. */
export function individualTemplateRow(d: IndividualDetailResponse, lookups: IndividualImportLookups): Record<string, TemplateValue> {
  return {
    nationalId: d.nationalId,
    phoneNumber: d.phoneNumber,
    firstName: d.firstName,
    lastName: d.lastName,
    sex: optionLabel(lookups.sex, d.sex),
    dateOfBirth: d.dateOfBirth,
    youthStatus: optionLabel(YOUTH_STATUS_OPTIONS, d.youthStatus, underscored),
    youthCategory: optionLabel(lookups.youthCategory, d.youthCategory, underscored),
    educationLevel: optionLabel(lookups.educationLevel, d.educationLevel, underscored),
    disabilityStatus:
      d.disabilityStatus === null || d.disabilityStatus === undefined
        ? null
        : optionLabel(DISABILITY_OPTIONS, String(d.disabilityStatus)),
    registrationSource: optionLabel(lookups.registrationSource, d.registrationSource),
    ...location(d),
    latitude: d.latitude,
    longitude: d.longitude,
  };
}

/**
 * Builds the individuals import template: one Individuals sheet plus the Lists sheet. Existing
 * individuals are pre-filled one per row; with none, the sheet holds only the headers.
 */
export function buildIndividualImportTemplate(
  lookups: IndividualImportLookups,
  individuals: IndividualDetailResponse[] = [],
): Promise<Blob> {
  return buildTemplateWorkbook(
    [{ name: INDIVIDUALS_SHEET, columns: INDIVIDUAL_COLUMNS, rows: individuals.map((d) => individualTemplateRow(d, lookups)) }],
    buildLists(lookups),
  );
}
