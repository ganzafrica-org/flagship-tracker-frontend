/**
 * The cooperatives import workbook (see ~/lib/import for the shared machinery), used by the
 * Associations, Companies, Cooperatives and Farmer Groups pages. One sheet whose columns are the
 * fields of the Add Cooperative form in form order: the details step, then the optional flagship
 * link. `key` is the CooperativeRequest field it fills.
 */
import type { ImportColumn, LookupOption } from "~/lib/import/schema";
import { cooperativeTypeNames } from "~/lib/queries/cooperatives";

export const MAX_COOPERATIVES_PER_IMPORT = 500;

/** The sheet is named after the page (e.g. "Associations"). */
export function cooperativeSheetName(type: string): string {
  return cooperativeTypeNames(type).plural;
}

export function cooperativeTemplateFilename(type: string): string {
  return `${cooperativeTypeNames(type).plural.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-import-template.xlsx`;
}

/** Allowed by the API (CreateCooperativeRequest); used when the lookup endpoint returns nothing. */
export const GROUP_TYPE_FALLBACK: LookupOption[] = [
  { value: "cooperative", label: "Cooperative" },
  { value: "farmer_group", label: "Farmer Group" },
  { value: "mpc", label: "MPC" },
  { value: "savings_group", label: "Savings Group" },
  { value: "association", label: "Association" },
  { value: "company", label: "Company" },
  { value: "other", label: "Other" },
];

export const REGISTRATION_STATUS_FALLBACK: LookupOption[] = [
  { value: "registered", label: "Registered" },
  { value: "pending", label: "Pending" },
  { value: "informal", label: "Informal" },
];

export const COOPERATIVE_COLUMNS: ImportColumn[] = [
  // Step 1: Cooperative Details
  { key: "cooperativeName", header: "Cooperative Name", required: true, type: "text", width: 34, hint: "Full cooperative or group name (max 200 characters)." },
  { key: "cooperativeCode", header: "Cooperative Code", required: false, type: "text", width: 20, hint: "Registration or reference code (max 30 characters)." },
  { key: "groupType", header: "Group Type", required: true, type: "list", list: "groupTypes", width: 18 },
  { key: "registrationStatus", header: "Registration Status", required: false, type: "list", list: "registrationStatuses", width: 20 },
  { key: "primaryValueChain", header: "Primary Value Chain", required: false, type: "text", width: 22, hint: "e.g. Potato (max 100 characters)." },
  { key: "cluster", header: "Cluster", required: false, type: "text", width: 20, hint: "e.g. Horticulture (max 100 characters)." },
  { key: "totalMembers", header: "Total Members", required: false, type: "int", min: 0, width: 15, hint: "Whole number, 0 or more." },
  { key: "femaleMembers", header: "Female Members", required: false, type: "int", min: 0, width: 16, hint: "Whole number, 0 or more." },
  { key: "youthMembers", header: "Youth Members", required: false, type: "int", min: 0, width: 15, hint: "Whole number, 0 or more." },
  { key: "province", header: "Province", required: false, type: "list", list: "provinces", width: 14 },
  { key: "district", header: "District", required: false, type: "list", list: "districts", width: 16, hint: "Must belong to the province (see the Lists sheet)." },
  { key: "sector", header: "Sector", required: false, type: "text", width: 18, hint: "Must belong to the district (see the Lists sheet)." },
  // Step 2: Cooperative-Flagship Link (optional)
  { key: "flagship", header: "Flagship", required: false, type: "list", list: "flagships", width: 34, hint: "Optional link to one flagship." },
  { key: "engagementType", header: "Engagement Type", required: false, type: "list", list: "engagementTypes", width: 22, hint: "Only saved together with a Flagship." },
  { key: "engagementStartDate", header: "Start Date", required: false, type: "date", width: 14, hint: "Engagement start, e.g. 2026-01-31." },
  { key: "engagementEndDate", header: "End Date", required: false, type: "date", width: 14, hint: "Engagement end, e.g. 2026-12-31." },
];
