import { api } from "~/lib/api";
import { buildCreateFlagshipRequest, createFlagship } from "~/lib/queries/flagships";
import { createIndividual, type CreateIndividualRequest } from "~/lib/queries/individuals";
import type { Agency, EnumValue, Funder, ValueChain } from "~/lib/queries/lookups";
import type { UserRole } from "~/lib/queries/users";
import {
  importMappedRows,
  matchOption,
  pickCell,
  toIsoDate,
  type SpreadsheetImportOutcome,
  type SpreadsheetRow,
} from "~/lib/spreadsheet";

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Senior Official", value: "SENIOR" },
  { label: "Monitoring Officer", value: "MONITORING_OFFICER" },
];

const SEX_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const YOUTH_CATEGORY_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "graduate", label: "Graduate" },
  { value: "neet", label: "NEET" },
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "other", label: "Other" },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: "none", label: "None" },
  { value: "primary", label: "Primary" },
  { value: "lower_secondary", label: "Lower Secondary" },
  { value: "upper_secondary", label: "Upper Secondary" },
  { value: "tvet", label: "TVET" },
  { value: "university", label: "University" },
  { value: "other", label: "Other" },
];

const REGISTRATION_SOURCE_OPTIONS = [
  { value: "flagship", label: "Flagship" },
  { value: "walk-in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "survey", label: "Survey" },
];

const YOUTH_STATUS_OPTIONS = [
  { value: "youth", label: "Youth" },
  { value: "non_youth", label: "Non-youth" },
];

const DISABILITY_OPTIONS = [
  { value: "false", label: "No disability" },
  { value: "true", label: "Has registered disability" },
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

function preferOptions<T extends { label: string; value: string }>(apiOptions: T[], fallback: T[]): T[] {
  return apiOptions.length > 0 ? apiOptions : fallback;
}

async function loadEnumOptions(enumGroup: string) {
  const items = await api.get<EnumValue[]>("/api/lookups/enum-values/by-group", {
    enumGroup,
    active: true,
  });
  return items.map((item) => ({ label: item.label, value: item.value }));
}

function toNum(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function importAgenciesFromSheet(rows: SpreadsheetRow[]): Promise<SpreadsheetImportOutcome> {
  return loadEnumOptions("agency_type").then((typeOptions) =>
    importMappedRows({
      rows,
      alwaysCreate: true,
      mapRow: (row) => ({
        agencyName: pickCell(row, ["Agency Name", "Name", "Agency"]),
        agencyType: matchOption(pickCell(row, ["Agency Type", "Type"]), typeOptions),
      }),
      isUsable: (value) => Boolean(value.agencyName.trim() && value.agencyType),
      missingMessage: "Each row needs Agency Name and Agency Type.",
      create: (value) =>
        api.post("/api/lookups/implementing-agencies", {
          agencyName: value.agencyName.trim(),
          agencyType: value.agencyType,
        }),
    }),
  );
}

export function importFundersFromSheet(rows: SpreadsheetRow[]): Promise<SpreadsheetImportOutcome> {
  return loadEnumOptions("funder_type").then((typeOptions) =>
    importMappedRows({
      rows,
      alwaysCreate: true,
      mapRow: (row) => ({
        funderName: pickCell(row, ["Funder Name", "Name", "Funder"]),
        funderType: matchOption(pickCell(row, ["Funder Type", "Type"]), typeOptions),
      }),
      isUsable: (value) => Boolean(value.funderName.trim() && value.funderType),
      missingMessage: "Each row needs Funder Name and Funder Type.",
      create: (value) =>
        api.post("/api/lookups/funders", {
          funderName: value.funderName.trim(),
          funderType: value.funderType,
        }),
    }),
  );
}

export function importValueChainsFromSheet(rows: SpreadsheetRow[]): Promise<SpreadsheetImportOutcome> {
  return loadEnumOptions("flagship_cluster").then((clusterOptions) =>
    importMappedRows({
      rows,
      alwaysCreate: true,
      mapRow: (row) => ({
        cluster: matchOption(pickCell(row, ["Cluster"]), clusterOptions),
        valueChain: pickCell(row, ["Value Chain", "ValueChain", "Name"]),
      }),
      isUsable: (value) => Boolean(value.cluster && value.valueChain.trim()),
      missingMessage: "Each row needs Cluster and Value Chain.",
      create: (value) =>
        api.post("/api/lookups/value-chains", {
          cluster: value.cluster,
          valueChain: value.valueChain.trim(),
        }),
    }),
  );
}

export async function importKpiDefinitionsFromSheet(rows: SpreadsheetRow[]): Promise<SpreadsheetImportOutcome> {
  const [tierOptions, valueTypeOptions, page] = await Promise.all([
    loadEnumOptions("indicator_tier"),
    loadEnumOptions("indicator_value_type"),
    api.get<{ content: { flagshipCode: string; flagshipName: string }[] }>("/api/flagships"),
  ]);
  const flagshipOptions = page.content.map((flagship) => ({
    label: `${flagship.flagshipCode} — ${flagship.flagshipName}`,
    value: flagship.flagshipCode,
  }));

  return importMappedRows({
    rows,
    alwaysCreate: true,
    mapRow: (row) => {
      const flagshipRaw = pickCell(row, ["Flagship Code", "Flagship", "Code"]);
      const byName = page.content.find(
        (flagship) => flagship.flagshipName.trim().toLowerCase() === flagshipRaw.trim().toLowerCase(),
      );
      return {
        flagshipCode: matchOption(flagshipRaw, flagshipOptions) || byName?.flagshipCode || "",
        indicatorName: pickCell(row, ["Indicator Name", "Indicator", "KPI", "Name"]),
        indicatorTier: matchOption(pickCell(row, ["Indicator Tier", "Tier"]), tierOptions),
        indicatorValueType: matchOption(pickCell(row, ["Value Type", "Indicator Value Type"]), valueTypeOptions),
      };
    },
    isUsable: (value) =>
      Boolean(value.flagshipCode && value.indicatorName.trim() && value.indicatorTier && value.indicatorValueType),
    missingMessage: "Each row needs Flagship, Indicator Name, Indicator Tier, and Value Type.",
    create: (value) =>
      api.post("/api/lookups/kpi-definitions", {
        flagshipCode: value.flagshipCode,
        indicatorName: value.indicatorName.trim(),
        indicatorTier: value.indicatorTier,
        indicatorValueType: value.indicatorValueType,
      }),
  });
}

export async function importCooperativesFromSheet(rows: SpreadsheetRow[]): Promise<SpreadsheetImportOutcome> {
  const [groupOptions, statusOptions] = await Promise.all([
    loadEnumOptions("group_type"),
    loadEnumOptions("registration_status"),
  ]);

  return importMappedRows({
    rows,
    alwaysCreate: true,
    mapRow: (row) => ({
      cooperativeName: pickCell(row, ["Cooperative Name", "Name"]),
      cooperativeCode: pickCell(row, ["Cooperative Code", "Code"]) || undefined,
      groupType: matchOption(pickCell(row, ["Group Type", "Type"]), groupOptions),
      registrationStatus: matchOption(pickCell(row, ["Registration Status", "Status"]), statusOptions) || undefined,
      primaryValueChain: pickCell(row, ["Primary Value Chain", "Value Chain"]) || undefined,
      cluster: pickCell(row, ["Cluster"]) || undefined,
      totalMembers: toNum(pickCell(row, ["Total Members", "Members"])),
      femaleMembers: toNum(pickCell(row, ["Female Members", "Female"])),
      youthMembers: toNum(pickCell(row, ["Youth Members", "Youth"])),
      province: pickCell(row, ["Province"]) || undefined,
      district: pickCell(row, ["District"]) || undefined,
      sector: pickCell(row, ["Sector"]) || undefined,
    }),
    isUsable: (value) => Boolean(value.cooperativeName.trim() && value.groupType),
    missingMessage: "Each row needs Cooperative Name and Group Type.",
    create: (value) =>
      api.post("/api/cooperatives", {
        ...value,
        cooperativeName: value.cooperativeName.trim(),
      }),
  });
}

export function importUsersFromSheet(rows: SpreadsheetRow[]): Promise<SpreadsheetImportOutcome> {
  return importMappedRows({
    rows,
    alwaysCreate: true,
    mapRow: (row) => ({
      fullName: pickCell(row, ["Full Name", "Name"]),
      email: pickCell(row, ["Email", "Email Address"]),
      role: matchOption(pickCell(row, ["Role"]), ROLE_OPTIONS) as UserRole,
    }),
    isUsable: (value) =>
      Boolean(
        value.fullName.trim() &&
          value.email.trim() &&
          value.role &&
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.email.trim()),
      ),
    missingMessage: "Each row needs Full Name, a valid Email, and Role (Admin, Senior Official, or Monitoring Officer).",
    create: (value) =>
      api.post("/api/users", {
        email: value.email.trim(),
        fullName: value.fullName.trim(),
        role: value.role,
      }),
  });
}

export async function importFlagshipsFromSheet(rows: SpreadsheetRow[]): Promise<SpreadsheetImportOutcome> {
  const [clusterOptions, statusOptions, chains, agencies, funders] = await Promise.all([
    loadEnumOptions("flagship_cluster"),
    loadEnumOptions("flagship_status"),
    api.get<ValueChain[]>("/api/lookups/value-chains", { active: true }),
    api.get<Agency[]>("/api/lookups/implementing-agencies", { active: true }),
    api.get<Funder[]>("/api/lookups/funders", { active: true }),
  ]);
  const valueChainOptions = chains.map((row) => ({ label: row.valueChain, value: row.valueChain }));
  const agencyOptions = agencies.map((row) => ({ label: row.agencyName, value: row.agencyName }));
  const funderOptions = funders.map((row) => ({ label: row.funderName, value: row.funderName }));

  return importMappedRows({
    rows,
    alwaysCreate: true,
    mapRow: (row) => ({
      flagshipName: pickCell(row, ["Flagship Name", "Name"]),
      flagshipCode: pickCell(row, ["Flagship Code", "Code"]),
      description: pickCell(row, ["Description"]),
      startDate: toIsoDate(pickCell(row, ["Start Date"])),
      endDate: toIsoDate(pickCell(row, ["End Date"])),
      implementingAgency: matchOption(pickCell(row, ["Implementing Agency", "Agency"]), agencyOptions),
      managementModel: pickCell(row, ["Management Model"]),
      targetYouthCount: pickCell(row, ["Target Youth Count", "Target Youth", "Youth"]),
      budgetTotalRwf: pickCell(row, ["Budget Total RWF", "Budget", "Budget Total"]),
      flagshipCluster: matchOption(pickCell(row, ["Flagship Cluster", "Cluster"]), clusterOptions),
      status: matchOption(pickCell(row, ["Status", "Flagship Status"]), statusOptions),
      primaryValueChain: matchOption(pickCell(row, ["Primary Value Chain", "Value Chain"]), valueChainOptions),
      funder: matchOption(pickCell(row, ["Funder", "Funders"]), funderOptions),
    }),
    isUsable: (value) =>
      Boolean(value.flagshipName.trim() && value.flagshipCode.trim() && value.flagshipCluster && value.status),
    missingMessage: "Each row needs Flagship Name, Flagship Code, Cluster, and Status.",
    create: (value) =>
      createFlagship(
        buildCreateFlagshipRequest({
          flagshipName: value.flagshipName,
          flagshipCode: value.flagshipCode,
          flagshipCluster: value.flagshipCluster,
          status: value.status,
          description: value.description,
          primaryValueChain: value.primaryValueChain,
          startDate: value.startDate || undefined,
          endDate: value.endDate || undefined,
          implementingAgency: value.implementingAgency,
          managementModel: value.managementModel,
          targetYouthCount: value.targetYouthCount,
          budgetTotalRwf: value.budgetTotalRwf,
          funders: value.funder || undefined,
        }),
      ).then(() => undefined),
  });
}

export async function importIndividualsFromSheet(rows: SpreadsheetRow[]): Promise<SpreadsheetImportOutcome> {
  const [sexOptions, youthOptions, educationOptions, sourceOptions] = await Promise.all([
    loadEnumOptions("sex"),
    loadEnumOptions("youth_category"),
    loadEnumOptions("education_level"),
    loadEnumOptions("registration_source"),
  ]);

  return importMappedRows<CreateIndividualRequest>({
    rows,
    alwaysCreate: true,
    mapRow: (row) => {
      const latitude = pickCell(row, ["Latitude"]);
      const longitude = pickCell(row, ["Longitude"]);
      const disability = matchOption(pickCell(row, ["Disability Status", "Disability"]), DISABILITY_OPTIONS);
      const latitudeNumber = latitude ? Number(latitude) : undefined;
      const longitudeNumber = longitude ? Number(longitude) : undefined;
      return {
        nationalId: pickCell(row, ["National ID", "NID"]) || undefined,
        phoneNumber: pickCell(row, ["Phone Number", "Phone"]),
        firstName: pickCell(row, ["First Name"]),
        lastName: pickCell(row, ["Last Name"]),
        sex: matchOption(pickCell(row, ["Sex", "Gender"]), preferOptions(sexOptions, SEX_OPTIONS)),
        youthStatus: matchOption(pickCell(row, ["Youth Status", "Youth"]), YOUTH_STATUS_OPTIONS),
        dateOfBirth: toIsoDate(pickCell(row, ["Date of Birth", "DOB"])) || undefined,
        youthCategory:
          matchOption(pickCell(row, ["Youth Category"]), preferOptions(youthOptions, YOUTH_CATEGORY_OPTIONS)) ||
          undefined,
        educationLevel:
          matchOption(pickCell(row, ["Education Level", "Education"]), preferOptions(educationOptions, EDUCATION_LEVEL_OPTIONS)) ||
          undefined,
        disabilityStatus: disability === "" ? undefined : disability === "true",
        registrationSource: matchOption(
          pickCell(row, ["Registration Source", "Source"]),
          preferOptions(sourceOptions, REGISTRATION_SOURCE_OPTIONS),
        ),
        province: pickCell(row, ["Province"]),
        district: pickCell(row, ["District"]),
        sector: pickCell(row, ["Sector"]),
        cell: pickCell(row, ["Cell"]),
        village: pickCell(row, ["Village"]),
        latitude: latitudeNumber != null && Number.isFinite(latitudeNumber) ? latitudeNumber : undefined,
        longitude: longitudeNumber != null && Number.isFinite(longitudeNumber) ? longitudeNumber : undefined,
      };
    },
    isUsable: (value) =>
      Boolean(
        value.phoneNumber.trim() &&
          value.firstName.trim() &&
          value.lastName.trim() &&
          value.sex &&
          value.youthStatus &&
          value.registrationSource &&
          value.province &&
          value.district &&
          value.sector,
      ),
    missingMessage:
      "Each row needs Phone Number, First Name, Last Name, Sex, Youth Status, Registration Source, Province, District, and Sector.",
    create: (value) => createIndividual(value).then(() => undefined),
  });
}
