import type { CreateFlagshipRequest } from "~/lib/queries/flagships";
export interface ImportInvestmentPayload {
  row: number;
  amount: number;
  currency: string;
  sourceType: string;
  funderName: string;
  investmentDate?: string;
  year: number;
  disbursementType?: string;
  notes?: string;
}

export interface ImportKpiPayload {
  row: number;
  indicatorName: string;
  baselineValue?: number;
  targetValue?: number;
  actualValue?: number;
  measurementPoint: number;
  year: number;
  reportingPeriod: string;
}

export interface ImportLocationPayload {
  row: number;
  province: string;
  district: string;
  sector?: string;
}

/** Request item for POST /api/flagships/import. */
export interface ImportRequestItem {
  row: number;
  basic: CreateFlagshipRequest;
  investments: ImportInvestmentPayload[];
  kpis: ImportKpiPayload[];
  locations: ImportLocationPayload[];
}

/** Raw response of POST /api/flagships/import. */
export interface ImportServerResult {
  row: number;
  flagshipCode: string | null;
  flagshipName: string | null;
  outcome: "VALID" | "CREATED" | "FAILED";
  flagshipId: number | null;
  errors: { sheet: string; row: number; field: string | null; message: string }[];
}

export interface ImportServerResponse {
  dryRun: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: ImportServerResult[];
}
