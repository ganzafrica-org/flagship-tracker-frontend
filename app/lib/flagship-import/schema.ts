/**
 * Single source of truth for the flagship import workbook (see ~/lib/import for the shared
 * machinery): the template is generated from it and the uploaded file is parsed against it. Sheets
 * and fields mirror the Add Flagship form steps.
 */

import type { ImportColumn } from "~/lib/import/schema";

export type SheetId = "basic" | "investment" | "kpis" | "location";

export const SHEET_NAMES: Record<SheetId, string> = {
  basic: "Basic Details",
  investment: "Investment",
  kpis: "KPIs",
  location: "Location",
};

export const SHEET_ORDER: SheetId[] = ["basic", "investment", "kpis", "location"];

const CODE_COLUMN: ImportColumn = {
  key: "flagshipCode",
  header: "Flagship Code",
  required: true,
  type: "text",
  width: 16,
  hint: "Must match a Flagship Code on the Basic Details sheet.",
};

export const SHEET_COLUMNS: Record<SheetId, ImportColumn[]> = {
  basic: [
    { key: "flagshipName", header: "Flagship Name", required: true, type: "text", width: 34, hint: "Full program name (max 200 characters)." },
    { key: "flagshipCode", header: "Flagship Code", required: true, type: "text", width: 16, hint: "Unique code, e.g. YEPA (max 20 characters). A code that already exists is rejected." },
    { key: "flagshipCluster", header: "Flagship Cluster", required: true, type: "list", list: "clusters", width: 20 },
    { key: "primaryValueChain", header: "Primary Value Chain", required: false, type: "list", list: "valueChains", width: 26, hint: "Must belong to the selected cluster (see the Lists sheet)." },
    { key: "description", header: "Description", required: false, type: "text", width: 40, hint: "Narrative description of the program." },
    { key: "funders", header: "Funder", required: false, type: "list", list: "funders", width: 24 },
    { key: "startDate", header: "Start Date", required: false, type: "date", width: 14, hint: "Date, e.g. 2026-01-31." },
    { key: "endDate", header: "End Date", required: false, type: "date", width: 14, hint: "Date on or after the start date." },
    { key: "status", header: "Status", required: true, type: "list", list: "statuses", width: 14 },
    { key: "implementingAgency", header: "Implementing Agency", required: false, type: "list", list: "agencies", width: 28 },
    { key: "managementModel", header: "Management Model", required: false, type: "text", width: 22, hint: "e.g. direct, contracted (max 100 characters)." },
    { key: "targetYouthCount", header: "Target Youth Count", required: false, type: "int", width: 18, hint: "Whole number, minimum 1." },
    { key: "budgetTotalRwf", header: "Budget Total (RWF)", required: false, type: "int", width: 20, hint: "Whole number, minimum 1." },
  ],
  investment: [
    CODE_COLUMN,
    { key: "amount", header: "Investment Amount", required: true, type: "decimal", width: 18, hint: "Greater than 0." },
    { key: "currency", header: "Currency", required: true, type: "list", list: "currencies", width: 12 },
    { key: "sourceType", header: "Source Type", required: true, type: "list", list: "sourceTypes", width: 18 },
    { key: "funderName", header: "Funder", required: true, type: "list", list: "funders", width: 24, hint: "The funder is required to save an investment (the form's Investor Name field is free text and is not saved)." },
    { key: "investmentDate", header: "Investment Date", required: false, type: "date", width: 16, hint: "Date, e.g. 2026-01-31. If given, its year must equal Year." },
    { key: "year", header: "Year", required: true, type: "int", width: 10, min: 2000, max: 2100, hint: "2000–2100." },
    { key: "disbursementType", header: "Disbursement Type", required: false, type: "list", list: "disbursementTypes", width: 20 },
    { key: "notes", header: "Notes", required: false, type: "text", width: 36 },
  ],
  kpis: [
    CODE_COLUMN,
    { key: "indicatorName", header: "KPI Indicator Name", required: true, type: "list", list: "kpiIndicators", width: 30, hint: "Must be an approved KPI for this flagship code (see KPI Definitions on the Lists sheet). Tier and value type are set automatically." },
    { key: "baselineValue", header: "Baseline Value", required: false, type: "decimal", width: 16, hint: "0 or more, up to 2 decimals." },
    { key: "targetValue", header: "Target Value", required: false, type: "decimal", width: 14, hint: "0 or more, up to 2 decimals." },
    { key: "actualValue", header: "Actual Value", required: false, type: "decimal", width: 14, hint: "0 or more, up to 2 decimals." },
    { key: "measurementPoint", header: "Measurement Point", required: true, type: "list", list: "measurementPoints", width: 20, hint: "A Midline or Endline needs a Baseline for the same indicator, year and period." },
    { key: "year", header: "Year", required: true, type: "int", width: 10, min: 2000, max: 2100, hint: "2000–2100." },
    { key: "reportingPeriod", header: "Reporting Period", required: true, type: "list", list: "reportingPeriods", width: 18 },
  ],
  location: [
    CODE_COLUMN,
    { key: "province", header: "Province", required: true, type: "list", list: "provinces", width: 16 },
    { key: "district", header: "District", required: true, type: "text", width: 20, hint: "Must match the province (see the Lists sheet)." },
    { key: "sector", header: "Sector", required: false, type: "text", width: 20 },
  ],
};

export const TEMPLATE_FILENAME = "flagship-import-template.xlsx";
export const MAX_FLAGSHIPS_PER_IMPORT = 200;
