import { CHART } from "~/data/dummy-flagship-detail";

export interface CooperativeListItem {
  id: number;
  cooperativeName: string;
  cooperativeCode?: string;
  groupType: "cooperative" | "farmer_group" | "mpc" | "savings_group" | "other";
  registrationStatus?: "registered" | "pending" | "informal";
  primaryValueChain?: string;
  cluster?: string;
  totalMembers?: number;
  femaleMembers?: number;
  youthMembers?: number;
  province?: string;
  district?: string;
  sector?: string;
}

export const cooperativeDummyData: CooperativeListItem[] = [
  {
    id: 1,
    cooperativeName: "Kigabiro Youth Farmers Cooperative",
    cooperativeCode: "KIG-YFC-001",
    groupType: "cooperative",
    registrationStatus: "registered",
    primaryValueChain: "Tomato",
    cluster: "horticulture",
    totalMembers: 120,
    femaleMembers: 64,
    youthMembers: 98,
    province: "Eastern Province",
    district: "Rwamagana",
    sector: "Kigabiro",
  },
  {
    id: 2,
    cooperativeName: "Musanze Poultry Youth Group",
    cooperativeCode: "MUS-PYG-014",
    groupType: "farmer_group",
    registrationStatus: "pending",
    primaryValueChain: "Poultry",
    cluster: "livestock",
    totalMembers: 48,
    femaleMembers: 19,
    youthMembers: 45,
    province: "Northern Province",
    district: "Musanze",
    sector: "Kinigi",
  },
];

// ---------------------------------------------------------------------------
// Overview KPI cards (C.1–C.5)
// ---------------------------------------------------------------------------

export const cooperativeOverviewStats = {
  totalCooperatives: 142,
  linkedToFlagships: 98,
  notLinkedToFlagships: 44,
  totalMembers: 18_340,
  totalFemaleMembers: 7_820,
};

// ---------------------------------------------------------------------------
// Donut chart — Flagship vs non-flagship proportion (C.6)
// ---------------------------------------------------------------------------

export const cooperativeFlagshipProportionData = [
  { name: "Linked to Flagship", value: 98, fill: CHART.accent },
  { name: "Not Linked", value: 44, fill: CHART.warning },
];

// ---------------------------------------------------------------------------
// Bar chart — Cooperative Members by Flagship (C.7)
// ---------------------------------------------------------------------------

export const cooperativeMembersByFlagship = [
  { flagship: "YEPA",   members: 4_200 },
  { flagship: "EYPDEL", members: 3_100 },
  { flagship: "MYPIG",  members: 2_800 },
  { flagship: "YAMS",   members: 2_400 },
  { flagship: "HINGA",  members: 1_950 },
  { flagship: "SEED",   members: 1_600 },
];

// ---------------------------------------------------------------------------
// Stacked bar — Engagement type per flagship (C.8)
// implementing_partner | beneficiary_group | service_provider
// ---------------------------------------------------------------------------

export interface EngagementTypeRow {
  flagship: string;
  implementing_partner: number;
  beneficiary_group: number;
  service_provider: number;
}

export const engagementTypeByFlagship: EngagementTypeRow[] = [
  { flagship: "YEPA",   implementing_partner: 8,  beneficiary_group: 22, service_provider: 5  },
  { flagship: "EYPDEL", implementing_partner: 12, beneficiary_group: 18, service_provider: 3  },
  { flagship: "MYPIG",  implementing_partner: 6,  beneficiary_group: 14, service_provider: 7  },
  { flagship: "YAMS",   implementing_partner: 10, beneficiary_group: 9,  service_provider: 4  },
  { flagship: "HINGA",  implementing_partner: 4,  beneficiary_group: 11, service_provider: 2  },
  { flagship: "SEED",   implementing_partner: 7,  beneficiary_group: 8,  service_provider: 1  },
];

// ---------------------------------------------------------------------------
// Bar chart — Female & Youth members share (C.9)
// Values are percentages of total_members
// ---------------------------------------------------------------------------

export interface InclusionShareRow {
  flagship: string;
  femaleShare: number;
  youthShare: number;
}

export const inclusionShareByFlagship: InclusionShareRow[] = [
  { flagship: "YEPA",   femaleShare: 52, youthShare: 71 },
  { flagship: "EYPDEL", femaleShare: 47, youthShare: 68 },
  { flagship: "MYPIG",  femaleShare: 41, youthShare: 79 },
  { flagship: "YAMS",   femaleShare: 55, youthShare: 62 },
  { flagship: "HINGA",  femaleShare: 38, youthShare: 74 },
  { flagship: "SEED",   femaleShare: 49, youthShare: 66 },
];

// ---------------------------------------------------------------------------
// Bar chart — Cooperatives enrolled per flagship (C.10)
// ---------------------------------------------------------------------------

export const cooperativesPerFlagship = [
  { flagship: "YEPA",   cooperatives: 35 },
  { flagship: "EYPDEL", cooperatives: 28 },
  { flagship: "MYPIG",  cooperatives: 22 },
  { flagship: "YAMS",   cooperatives: 19 },
  { flagship: "HINGA",  cooperatives: 17 },
  { flagship: "SEED",   cooperatives: 14 },
];

export const COOP_BAR_COLORS = [
  CHART.accent,
  CHART.warning,
  CHART.success,
  CHART.danger,
] as const;
