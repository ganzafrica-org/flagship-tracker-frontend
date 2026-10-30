/**
 * The individuals import workbook (see ~/lib/import for the shared machinery). One sheet whose
 * columns are the individual fields of the Add Individual form, plus Youth Status. `key` is the
 * request field the server reports errors against.
 */
import type { ImportColumn, LookupOption } from "~/lib/import/schema";

export const INDIVIDUALS_SHEET = "Individuals";
export const TEMPLATE_FILENAME = "individuals-import-template.xlsx";
export const MAX_INDIVIDUALS_PER_IMPORT = 500;

/** Fallbacks used by the form (and the import) when the lookup API returns nothing. */
export const SEX_OPTIONS: LookupOption[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

export const YOUTH_CATEGORY_OPTIONS: LookupOption[] = [
  { value: "student", label: "Student" },
  { value: "graduate", label: "Graduate" },
  { value: "neet", label: "NEET" },
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "other", label: "Other" },
];

export const EDUCATION_LEVEL_OPTIONS: LookupOption[] = [
  { value: "none", label: "None" },
  { value: "primary", label: "Primary" },
  { value: "lower_secondary", label: "Lower Secondary" },
  { value: "upper_secondary", label: "Upper Secondary" },
  { value: "tvet", label: "TVET" },
  { value: "university", label: "University" },
  { value: "other", label: "Other" },
];

export const REGISTRATION_SOURCE_OPTIONS: LookupOption[] = [
  { value: "flagship", label: "Flagship" },
  { value: "walk-in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "survey", label: "Survey" },
];

/** individual.youth_status as stored: 'youth' or 'non_youth' (blank/unknown is not allowed on import). */
export const YOUTH_STATUS_OPTIONS: LookupOption[] = [
  { value: "youth", label: "Youth" },
  { value: "non_youth", label: "Non-youth" },
];

export const DISABILITY_OPTIONS: LookupOption[] = [
  { value: "false", label: "No disability" },
  { value: "true", label: "Has registered disability" },
];

export const INDIVIDUAL_COLUMNS: ImportColumn[] = [
  { key: "nationalId", header: "National ID", required: false, type: "text", width: 22, hint: "Max 20 characters. Must not already be registered or repeat in the file. Keep the cell as text." },
  { key: "phoneNumber", header: "Phone Number", required: true, type: "text", width: 18, hint: "Max 15 characters, e.g. +250788000000. Must not already be registered or repeat in the file." },
  { key: "firstName", header: "First Name", required: true, type: "text", width: 20, hint: "Max 100 characters." },
  { key: "lastName", header: "Last Name", required: true, type: "text", width: 20, hint: "Max 100 characters." },
  { key: "sex", header: "Sex", required: true, type: "list", list: "sex", width: 10 },
  { key: "dateOfBirth", header: "Date of Birth", required: false, type: "date", width: 16, hint: "Date, e.g. 1998-04-23. Not in the future." },
  { key: "youthStatus", header: "Youth Status", required: true, type: "list", list: "youthStatus", width: 16, hint: "Saved as individual.youth_status: youth or non_youth." },
  { key: "youthCategory", header: "Youth Category", required: false, type: "list", list: "youthCategory", width: 18 },
  { key: "educationLevel", header: "Education Level", required: false, type: "list", list: "educationLevel", width: 20 },
  { key: "disabilityStatus", header: "Disability Status", required: false, type: "list", list: "disability", width: 26 },
  { key: "registrationSource", header: "Registration Source", required: true, type: "list", list: "registrationSource", width: 20 },
  { key: "province", header: "Province", required: true, type: "list", list: "provinces", width: 14 },
  { key: "district", header: "District", required: true, type: "list", list: "districts", width: 16, hint: "Must belong to the province (see the Lists sheet)." },
  { key: "sector", header: "Sector", required: true, type: "text", width: 18, hint: "Must belong to the district (see the Lists sheet)." },
  { key: "cell", header: "Cell", required: false, type: "text", width: 18, hint: "Must be a cell of the sector." },
  { key: "village", header: "Village", required: false, type: "text", width: 18, hint: "Must be a village of the cell." },
  { key: "latitude", header: "Latitude", required: false, type: "decimal", width: 12, min: -2.84, max: -1.05, hint: "-2.84 to -1.05." },
  { key: "longitude", header: "Longitude", required: false, type: "decimal", width: 12, min: 28.86, max: 30.9, hint: "28.86 to 30.90." },
];
