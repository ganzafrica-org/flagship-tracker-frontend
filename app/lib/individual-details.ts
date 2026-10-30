import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { exportDocument, type ExportColumn, type ExportFormat, type ExportSection } from "~/lib/export/table-export";
import { cooperativesLookupQueryOptions } from "~/lib/queries/lookups";
import { individualQueryOptions, type IndividualDetailResponse, type IndividualsPageItem } from "~/lib/queries/individuals";
import { flagshipSummaryQueryOptions } from "~/lib/queries/visualizations";

type Row = Record<string, unknown>;

interface Names {
  flagships: Map<number, string>;
  cooperatives: Map<number, string>;
}

/** 'self_employed' → 'Self employed', 'walk-in' → 'Walk-in'; null/empty → ''. */
export function humanize(value: unknown): string {
  if (value == null || value === "") return "";
  const text = String(value).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const yesNo = (v: unknown) => (v == null ? "" : v ? "Yes" : "No");
const text = (v: unknown) => (v == null ? "" : String(v));
const date = (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : text(v));

export function youthStatusLabel(value: string | null | undefined): string {
  if (value === "youth") return "Youth";
  if (value === "non_youth") return "Non-youth";
  return "Unknown";
}

function lookupName(names: Map<number, string>, id: unknown): string {
  if (id == null) return "";
  return names.get(Number(id)) ?? `#${id}`;
}

function fields(pairs: [string, string][]): ExportSection {
  return {
    title: undefined,
    columns: [{ key: "field", label: "Field" }, { key: "value", label: "Value" }],
    rows: pairs.map(([field, value]) => ({ field, value: value || "—" })),
  };
}

function table(title: string, columns: [string, string][], rows: Row[]): ExportSection | null {
  if (rows.length === 0) return null;
  return {
    title,
    columns: columns.map(([key, label]) => ({ key, label })),
    rows: rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v === "" || v == null ? "—" : v]))),
  };
}

/** Every piece of information held for one individual, as sections (shared by the View dialog and the Download). */
export function buildIndividualSections(d: IndividualDetailResponse, names: Names): ExportSection[] {
  const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const personal: ExportSection = {
    ...fields([
      ["Name", `${d.firstName} ${d.lastName}`.trim()],
      ["National ID", text(d.nationalId)],
      ["Phone number", text(d.phoneNumber)],
      ["Sex", text(d.sex)],
      ["Date of birth", date(d.dateOfBirth)],
      ["Program entry age", text(d.programEntryAge)],
      ["Youth status", youthStatusLabel(d.youthStatus)],
      ["Youth category", humanize(d.youthCategory)],
      ["Education level", humanize(d.educationLevel)],
      ["Disability status", d.disabilityStatus == null ? "" : d.disabilityStatus ? "Has registered disability" : "No disability"],
      ["Registration source", humanize(d.registrationSource)],
      ["Registered on", date(d.createdAt)],
      ["Last updated", date((d as { updatedAt?: string }).updatedAt)],
    ]),
    title: "Personal information",
  };
  const location: ExportSection = {
    ...fields([
      ["Province", text(d.province)],
      ["District", text(d.district)],
      ["Sector", text(d.sector)],
      ["Cell", text(d.cell)],
      ["Village", text(d.village)],
      ["Latitude", text(d.latitude)],
      ["Longitude", text(d.longitude)],
    ]),
    title: "Location",
  };

  type Flagship = { flagshipId: number; participationType?: string; startDate?: string; endDate?: string; active?: boolean; notes?: string };
  type Coop = { cooperativeId: number; role?: string; joinDate?: string; endDate?: string; active?: boolean };
  type ValueChain = { cluster?: string; valueChain?: string; valueChainStage?: string; primary?: boolean; year?: number; details?: string };
  type Employment = { flagshipId?: number; cooperativeId?: number; employmentType?: string; employmentStatus?: string; employerName?: string; employerType?: string; jobTitle?: string; incomeRangeRwf?: string; primaryJob?: boolean; startDate?: string; endDate?: string };
  type Land = { landSizeHa?: number; landUseType?: string; ownershipStatus?: string; province?: string; district?: string; sector?: string; hasLandTitle?: boolean; year?: number };
  type Production = { flagshipId?: number; cooperativeId?: number; product?: string; valueChain?: string; season?: string; year?: number; quantityProduced?: number; quantitySold?: number; unit?: string; revenueRwf?: number; marketChannel?: string; notes?: string };
  type Intervention = { flagshipId?: number; cooperativeId?: number; interventionType?: string; description?: string; deliveryDate?: string; year?: number; valueRwf?: number; deliveryLocation?: string; notes?: string };
  type Feedback = { flagshipId?: number; cooperativeId?: number; constraintType?: string; severity?: string; description?: string; reportedDate?: string; year?: number; location?: string };

  const sections = [
    personal,
    location,
    table("Flagships", [["flagship", "Flagship"], ["participation", "Participation"], ["start", "Start"], ["end", "End"], ["active", "Active"], ["notes", "Notes"]],
      list<Flagship>(d.flagships).map((f) => ({ flagship: lookupName(names.flagships, f.flagshipId), participation: humanize(f.participationType), start: date(f.startDate), end: date(f.endDate), active: yesNo(f.active), notes: text(f.notes) }))),
    table("Cooperatives", [["cooperative", "Cooperative"], ["role", "Role"], ["joined", "Joined"], ["left", "Left"], ["active", "Active"]],
      list<Coop>(d.cooperatives).map((c) => ({ cooperative: lookupName(names.cooperatives, c.cooperativeId), role: humanize(c.role), joined: date(c.joinDate), left: date(c.endDate), active: yesNo(c.active) }))),
    table("Value chains", [["cluster", "Cluster"], ["valueChain", "Value chain"], ["stage", "Stage"], ["primary", "Primary"], ["year", "Year"], ["details", "Details"]],
      list<ValueChain>(d.valueChains).map((v) => ({ cluster: humanize(v.cluster), valueChain: text(v.valueChain), stage: humanize(v.valueChainStage), primary: yesNo(v.primary), year: text(v.year), details: text(v.details) }))),
    table("Employment", [["type", "Type"], ["status", "Status"], ["employer", "Employer"], ["employerType", "Employer type"], ["job", "Job title"], ["income", "Income range"], ["primaryJob", "Primary job"], ["start", "Start"], ["end", "End"], ["flagship", "Flagship"], ["cooperative", "Cooperative"]],
      list<Employment>(d.employments).map((e) => ({ type: humanize(e.employmentType), status: humanize(e.employmentStatus), employer: text(e.employerName), employerType: humanize(e.employerType), job: text(e.jobTitle), income: humanize(e.incomeRangeRwf), primaryJob: yesNo(e.primaryJob), start: date(e.startDate), end: date(e.endDate), flagship: lookupName(names.flagships, e.flagshipId), cooperative: lookupName(names.cooperatives, e.cooperativeId) }))),
    table("Land access", [["size", "Size (ha)"], ["use", "Use"], ["ownership", "Ownership"], ["province", "Province"], ["district", "District"], ["sector", "Sector"], ["title", "Land title"], ["year", "Year"]],
      list<Land>(d.landAccess).map((l) => ({ size: text(l.landSizeHa), use: humanize(l.landUseType), ownership: humanize(l.ownershipStatus), province: text(l.province), district: text(l.district), sector: text(l.sector), title: yesNo(l.hasLandTitle), year: text(l.year) }))),
    table("Production records", [["product", "Product"], ["valueChain", "Value chain"], ["season", "Season"], ["year", "Year"], ["produced", "Produced"], ["sold", "Sold"], ["unit", "Unit"], ["revenue", "Revenue (RWF)"], ["channel", "Market channel"], ["flagship", "Flagship"], ["cooperative", "Cooperative"], ["notes", "Notes"]],
      list<Production>(d.productionRecords).map((p) => ({ product: text(p.product), valueChain: text(p.valueChain), season: humanize(p.season), year: text(p.year), produced: text(p.quantityProduced), sold: text(p.quantitySold), unit: text(p.unit), revenue: text(p.revenueRwf), channel: humanize(p.marketChannel), flagship: lookupName(names.flagships, p.flagshipId), cooperative: lookupName(names.cooperatives, p.cooperativeId), notes: text(p.notes) }))),
    table("Interventions", [["type", "Type"], ["description", "Description"], ["date", "Delivered"], ["year", "Year"], ["value", "Value (RWF)"], ["location", "Location"], ["flagship", "Flagship"], ["cooperative", "Cooperative"], ["notes", "Notes"]],
      list<Intervention>(d.interventions).map((i) => ({ type: humanize(i.interventionType), description: text(i.description), date: date(i.deliveryDate), year: text(i.year), value: text(i.valueRwf), location: text(i.deliveryLocation), flagship: lookupName(names.flagships, i.flagshipId), cooperative: lookupName(names.cooperatives, i.cooperativeId), notes: text(i.notes) }))),
    table("Constraint feedback", [["type", "Constraint"], ["severity", "Severity"], ["description", "Description"], ["reported", "Reported"], ["year", "Year"], ["location", "Location"], ["flagship", "Flagship"], ["cooperative", "Cooperative"]],
      list<Feedback>(d.constraintFeedback).map((f) => ({ type: humanize(f.constraintType), severity: humanize(f.severity), description: text(f.description), reported: date(f.reportedDate), year: text(f.year), location: text(f.location), flagship: lookupName(names.flagships, f.flagshipId), cooperative: lookupName(names.cooperatives, f.cooperativeId) }))),
  ];
  return sections.filter((s): s is ExportSection => s !== null);
}

function referencesCooperatives(d: IndividualDetailResponse | undefined): boolean {
  if (!d) return false;
  const any = (rows: unknown, key: string) => Array.isArray(rows) && rows.some((r) => (r as Record<string, unknown>)[key] != null);
  return any(d.cooperatives, "cooperativeId") || any(d.employments, "cooperativeId") || any(d.productionRecords, "cooperativeId")
    || any(d.interventions, "cooperativeId") || any(d.constraintFeedback, "cooperativeId");
}

/** The individual's full record plus the names needed to show flagship / cooperative ids. */
export function useIndividualSections(individualId: number | null) {
  const detail = useQuery({ ...individualQueryOptions(individualId ?? 0), enabled: individualId != null && individualId > 0 });
  const flagships = useQuery({ ...flagshipSummaryQueryOptions, enabled: detail.data !== undefined });
  const cooperatives = useQuery({ ...cooperativesLookupQueryOptions, enabled: referencesCooperatives(detail.data) });

  const waiting = detail.isPending || flagships.isPending || (referencesCooperatives(detail.data) && cooperatives.isPending);
  const sections = detail.data
    ? buildIndividualSections(detail.data, {
        flagships: new Map((flagships.data ?? []).map((f) => [f.flagshipId, `${f.flagshipCode} — ${f.flagshipName}`])),
        cooperatives: new Map((cooperatives.data ?? []).map((c) => [c.cooperativeId, c.cooperativeName])),
      })
    : [];
  return { detail: detail.data, sections, isLoading: individualId != null && waiting && !detail.isError, isError: detail.isError, onRetry: () => void detail.refetch() };
}

export function individualFileBase(d: Pick<IndividualDetailResponse, "firstName" | "lastName" | "individualId">): string {
  const name = `${d.firstName}-${d.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `individual-${d.individualId}${name ? `-${name}` : ""}`;
}

export function exportIndividual(d: IndividualDetailResponse, sections: ExportSection[], format: ExportFormat) {
  return exportDocument({ format, title: `Individual — ${d.firstName} ${d.lastName}`.trim(), fileBase: individualFileBase(d), sections });
}

/** Download without opening the dialog (list row action): fetches whatever the dialog would show. */
export async function downloadIndividual(queryClient: QueryClient, individualId: number, format: ExportFormat) {
  const detail = await queryClient.fetchQuery(individualQueryOptions(individualId));
  const flagships = await queryClient.fetchQuery({ ...flagshipSummaryQueryOptions, staleTime: 60_000 });
  const cooperatives = referencesCooperatives(detail)
    ? await queryClient.fetchQuery({ ...cooperativesLookupQueryOptions, staleTime: 60_000 })
    : [];
  const sections = buildIndividualSections(detail, {
    flagships: new Map(flagships.map((f) => [f.flagshipId, `${f.flagshipCode} — ${f.flagshipName}`])),
    cooperatives: new Map(cooperatives.map((c) => [c.cooperativeId, c.cooperativeName])),
  });
  await exportIndividual(detail, sections, format);
}

/** Relational section titles from buildIndividualSections — fixed set so every exported row has the same columns. */
const RELATIONAL_SECTION_TITLES = [
  "Flagships",
  "Cooperatives",
  "Value chains",
  "Employment",
  "Land access",
  "Production records",
  "Interventions",
  "Constraint feedback",
] as const;

/** One relational section's rows, condensed into a single readable cell (one row's worth per "; "). */
function summarizeSection(section: ExportSection | undefined): string {
  if (!section || section.rows.length === 0) return "";
  return section.rows
    .map((row) => section.columns.map((c) => String(row[c.key] ?? "")).filter(Boolean).join(" · "))
    .join("; ");
}

/**
 * Flattens one individual's full sections (same ones the View dialog and single-record download
 * use) into a single export row. "Personal information"/"Location" fields become their own
 * columns; relational sections (which buildIndividualSections omits entirely when empty) are each
 * condensed into one column so every row has the same column set regardless of which sections a
 * given individual actually has data for.
 */
function flattenIndividualToExportRow(sections: ExportSection[]): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const byTitle = new Map(sections.map((s) => [s.title, s]));

  for (const section of sections) {
    if (section.title === "Personal information" || section.title === "Location") {
      for (const r of section.rows) {
        row[String(r.field)] = r.value;
      }
    }
  }
  for (const title of RELATIONAL_SECTION_TITLES) {
    row[title] = summarizeSection(byTitle.get(title));
  }
  return row;
}

const PERSONAL_AND_LOCATION_COLUMNS: ExportColumn[] = [
  { key: "Name", label: "Name" },
  { key: "National ID", label: "National ID" },
  { key: "Phone number", label: "Phone number" },
  { key: "Sex", label: "Sex" },
  { key: "Date of birth", label: "Date of birth" },
  { key: "Program entry age", label: "Program entry age" },
  { key: "Youth status", label: "Youth status" },
  { key: "Youth category", label: "Youth category" },
  { key: "Education level", label: "Education level" },
  { key: "Disability status", label: "Disability status" },
  { key: "Registration source", label: "Registration source" },
  { key: "Registered on", label: "Registered on" },
  { key: "Last updated", label: "Last updated" },
  { key: "Province", label: "Province" },
  { key: "District", label: "District" },
  { key: "Sector", label: "Sector" },
  { key: "Cell", label: "Cell" },
  { key: "Village", label: "Village" },
  { key: "Latitude", label: "Latitude" },
  { key: "Longitude", label: "Longitude" },
];

export const INDIVIDUAL_EXPORT_COLUMNS: ExportColumn[] = [
  ...PERSONAL_AND_LOCATION_COLUMNS,
  ...RELATIONAL_SECTION_TITLES.map((title) => ({ key: title, label: title })),
];

/** Runs `fn` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Bulk export data for the Individuals List "Export" button: fetches every individual's full
 * detail (same data the View dialog shows, not just the compact table columns) and flattens each
 * into one export row. Fetches run with limited concurrency to avoid flooding the backend when
 * exporting hundreds of records at once.
 */
export async function buildIndividualsExportData(
  queryClient: QueryClient,
  individuals: IndividualsPageItem[],
): Promise<{ columns: ExportColumn[]; rows: Record<string, unknown>[] }> {
  const flagships = await queryClient.fetchQuery({ ...flagshipSummaryQueryOptions, staleTime: 60_000 });
  const cooperatives = await queryClient.fetchQuery({ ...cooperativesLookupQueryOptions, staleTime: 60_000 });
  const names: Names = {
    flagships: new Map(flagships.map((f) => [f.flagshipId, `${f.flagshipCode} — ${f.flagshipName}`])),
    cooperatives: new Map(cooperatives.map((c) => [c.cooperativeId, c.cooperativeName])),
  };

  const rows = await mapWithConcurrency(individuals, 10, async (item) => {
    const detail = await queryClient.fetchQuery(individualQueryOptions(item.individualId));
    return flattenIndividualToExportRow(buildIndividualSections(detail, names));
  });

  return { columns: INDIVIDUAL_EXPORT_COLUMNS, rows };
}
