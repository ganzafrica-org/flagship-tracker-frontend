/**
 * Dummy data for flagship detail / dashboard UI (development only).
 * Chart colors align with theme tokens in app/app.css (accent, success, warning, danger).
 */

/** Chart strokes/fills use theme tokens from app.css (no ad-hoc hex). */
export const CHART = {
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  grid: "color-mix(in oklch, var(--border) 85%, transparent)",
  track: "color-mix(in oklch, var(--default) 92%, transparent)",
} as const;

/** One run of body copy; set `emphasis` for inline bold (e.g. value chains). */
export type FlagshipIntroSegment = { text: string; emphasis?: boolean };

export interface FlagshipDetailIntro {
  displayTitle: string;
  descriptionHeading: string;
  segments: FlagshipIntroSegment[];
}

/** Intro blocks keyed by flagship list / route `id` (same as `flagshipDummyData`). */
export const flagshipDetailIntroByListId: Record<number, FlagshipDetailIntro> = {
  1: {
    displayTitle: "Youth Empowerment in Protected Agriculture (YEPA)",
    descriptionHeading: "Project Description",
    segments: [
      {
        text: "The Youth Empowerment in Protected Agriculture (YEPA) project represents a transformative initiative that combines modern greenhouse technology with youth employment opportunities. Focusing on three key value chains: ",
      },
      { text: "tomato, cucumber, and chili,", emphasis: true },
      {
        text: " the project creates sustainable livelihoods while ensuring food security and promoting climate-smart agricultural practices. It serves as a model for scaling protected agriculture across Rwanda, demonstrating how technology and youth empowerment can drive agricultural transformation.",
      },
    ],
  },
  2: {
    displayTitle: "Empowering Youth in Poultry Value Chain Development For Enhanced Livelihoods (EYPDEL)",
    descriptionHeading: "Project Description",
    segments: [
      {
        text: "EYPDEL strengthens youth participation across the poultry value chain—from inputs and hatcheries to processing and market access. The programme prioritises ",
      },
      { text: "biosecurity, cooperative business models,", emphasis: true },
      {
        text: " and digital record-keeping so young producers can grow resilient enterprises and meet rising demand for affordable protein.",
      },
    ],
  },
  3: {
    displayTitle: "eMpowering Youth through commercial PIG farming (MYPIG)",
    descriptionHeading: "Project Description",
    segments: [
      {
        text: "MYPIG supports commercial pig production with emphasis on ",
      },
      { text: "breed improvement, feed efficiency, and sanitary slaughter routes", emphasis: true },
      {
        text: ". Youth-led farms receive technical coaching and links to finance, aiming for steady margins while improving local pork supply and rural employment.",
      },
    ],
  },
  4: {
    displayTitle: "YOUTH-led AGRICULTURE MECHANIZATION SERVICES (YAMS)",
    descriptionHeading: "Project Description",
    segments: [
      {
        text: "YAMS deploys shared mechanisation services—",
      },
      { text: "tillage, planting, and harvest equipment", emphasis: true },
      {
        text: "—bookable by smallholders and cooperatives. The flagship trains young service operators and maintains asset registers so costs stay transparent and downtime low.",
      },
    ],
  },
  5: {
    displayTitle: "YOUTH-LED SEED PRODUCTION HUB",
    descriptionHeading: "Project Description",
    segments: [
      {
        text: "This hub coordinates early-generation seed and quality planting material for ",
      },
      { text: "potato, rice, cassava, avocado, mango, and pineapple", emphasis: true },
      {
        text: " value chains. It links breeder plots to certified multipliers and trains youth in varietal maintenance, storage, and traceability.",
      },
    ],
  },
  6: {
    displayTitle: "Fodder Production (Conventional and Hydroponic)",
    descriptionHeading: "Project Description",
    segments: [
      {
        text: "The flagship scales year-round fodder using ",
      },
      { text: "rain-fed plots alongside hydroponic units", emphasis: true },
      {
        text: " to buffer dry seasons. Youth enterprises produce lucerne, napier, and mixed rations sold to dairy and small-ruminant keepers across partner districts.",
      },
    ],
  },
};

export function getFlagshipDetailIntro(
  listId: number | undefined,
  apiName?: string | null,
): FlagshipDetailIntro {
  if (listId != null && Number.isFinite(listId) && flagshipDetailIntroByListId[listId]) {
    return flagshipDetailIntroByListId[listId];
  }
  return {
    displayTitle: apiName?.trim() || "Flagship project",
    descriptionHeading: "Project Description",
    segments: [
      {
        text: "This flagship profile is being loaded. A full project description and impact narrative will appear here when available.",
      },
    ],
  };
}

export const flagshipDetailLocations = [
  {
    id: "1",
    province: "Eastern Province",
    detail: "Rwamagana District, Kigabiro cell",
  },
  {
    id: "2",
    province: "Northern Province",
    detail: "Musanze District, Kinigi sector",
  },
  {
    id: "3",
    province: "Southern Province",
    detail: "Huye District, Tumba cell",
  },
];

/** KPI accent lines / icons — only app.css semantic colors. */
export const flagshipDetailStatColors = {
  blue: "var(--accent)",
  orange: "var(--warning)",
  green: "var(--forest)",
  red: "var(--danger)",
} as const;

/** Gender cards: solid icon color + pastel circle from app.css `*-icon-bg`. */
export const flagshipDetailGenderCardAccents = {
  jobs: {
    icon: "var(--warning)",
    iconSoft: "var(--warning-icon-bg)",
  },
  farmers: {
    icon: "var(--forest)",
    iconSoft: "var(--forest-icon-bg)",
  },
} as const;

/** Chart segments: female jobs = accent blue; farmers female = forest; male = warning (acreage orange). */
const genderJobsFemale = "var(--accent)";
const genderJobsMale = "var(--warning)";
const genderFarmersFemale = "var(--forest)";
const genderFarmersMale = "var(--warning)";

export const flagshipDetailKpis = [
  {
    id: "invest",
    stat: "15.3M",
    statSuffix: "(rwf)",
    label: "Total Investment",
    color: flagshipDetailStatColors.blue,
    iconBackground: "var(--accent-icon-bg)",
  },
  {
    id: "acreage",
    stat: "7 ha",
    label: "Acreage",
    color: flagshipDetailStatColors.orange,
    iconBackground: "var(--warning-icon-bg)",
  },
  {
    id: "revenue",
    stat: "$1.58M",
    label: "Revenue",
    color: flagshipDetailStatColors.green,
    iconBackground: "var(--forest-icon-bg)",
  },
  {
    id: "income",
    stat: "311k",
    statSuffix: "(rwf)",
    label: "Monthly net income for youth",
    color: flagshipDetailStatColors.red,
    iconBackground: "var(--danger-icon-bg)",
  },
] as const;

export const flagshipDetailJobsByGender = [
  { name: "Female", value: 3203, fill: genderJobsFemale },
  { name: "Male", value: 2120, fill: genderJobsMale },
];

export const flagshipDetailFarmersByGender = [
  { name: "Female", value: 1402, fill: genderFarmersFemale },
  { name: "Male", value: 951, fill: genderFarmersMale },
];

export const flagshipDetailJobsCreatedTotal = "5,323";
export const flagshipDetailFarmersTotal = "2,353";

export const flagshipDetailJobsTarget = 400;
export const flagshipDetailJobsCurrent = 256;

/** Half-donut “jobs for youth” gauge (actual vs target). */
export const flagshipDetailJobsGauge = {
  actualFill: "#1091c1",
  trackFill: "#f0f0f0",
} as const;

export const flagshipDetailAcreageData = [
  { name: "Used", value: 4, fill: CHART.warning },
  { name: "Remaining", value: 3, fill: CHART.track },
];

export const flagshipDetailJobsPerChain = [
  { year: "2020", target: 120, tomato: 40, cucumber: 30, chili: 25 },
  { year: "2021", target: 180, tomato: 55, cucumber: 48, chili: 38 },
  { year: "2022", target: 220, tomato: 70, cucumber: 62, chili: 50 },
  { year: "2023", target: 280, tomato: 85, cucumber: 78, chili: 65 },
  { year: "2024", target: 320, tomato: 95, cucumber: 88, chili: 72 },
  { year: "2025", target: 360, tomato: 112, cucumber: 98, chili: 83 },
  { year: "2026", target: 400, tomato: 128, cucumber: 112, chili: 97 },
];

export const flagshipDetailInvestmentSplit = [
  { name: "Government expenditure", value: 42, fill: CHART.accent },
  { name: "Bilateral investment", value: 35, fill: CHART.warning },
  { name: "Private investment", value: 23, fill: CHART.danger },
];

export const flagshipDetailRevenueByChain = [
  { year: "2020", tomato: 0.2, cucumber: 0.15, chili: 0.1 },
  { year: "2021", tomato: 0.35, cucumber: 0.28, chili: 0.18 },
  { year: "2022", tomato: 0.52, cucumber: 0.41, chili: 0.26 },
  { year: "2023", tomato: 0.68, cucumber: 0.55, chili: 0.34 },
  { year: "2024", tomato: 0.82, cucumber: 0.64, chili: 0.42 },
  { year: "2025", tomato: 0.98, cucumber: 0.76, chili: 0.51 },
  { year: "2026", tomato: 1.12, cucumber: 0.88, chili: 0.6 },
];

export const flagshipDetailQuantitiesByChain = [
  { year: "2020", tomato: 80, cucumber: 55, chili: 40 },
  { year: "2021", tomato: 120, cucumber: 90, chili: 60 },
  { year: "2022", tomato: 180, cucumber: 140, chili: 95 },
  { year: "2023", tomato: 240, cucumber: 190, chili: 130 },
  { year: "2024", tomato: 290, cucumber: 230, chili: 160 },
  { year: "2025", tomato: 320, cucumber: 260, chili: 185 },
  { year: "2026", tomato: 360, cucumber: 295, chili: 210 },
];

/** Team list UI: avatar + row tint (reference design, exact hex). */
/** Row tints for team list + highlight cards (single source of truth). */
export const flagshipDetailTeamRowPastels = {
  blue: "#E9F1F5",
  green: "#DFF6F0",
  orange: "#F6E9D7",
} as const;

/** Highlight tone maps to the same pastel as the matching team row color family. */
export function getHighlightRowBackground(
  tone: "accent" | "success" | "warning" | "muted",
): string {
  switch (tone) {
    case "accent":
      return flagshipDetailTeamRowPastels.blue;
    case "success":
      return flagshipDetailTeamRowPastels.green;
    case "warning":
      return flagshipDetailTeamRowPastels.orange;
    case "muted":
      return flagshipDetailTeamRowPastels.blue;
    default:
      return flagshipDetailTeamRowPastels.blue;
  }
}

export const flagshipDetailTeam = [
  {
    id: "1",
    name: "Patrick Uwimana",
    initials: "PU",
    email: "Patrick.uwimana@gmail.com",
    avatarColor: "#1091C8",
    rowBackgroundColor: flagshipDetailTeamRowPastels.blue,
  },
  {
    id: "2",
    name: "Olivier Niyonsaba",
    initials: "ON",
    email: "Olivier.niyonsaba@gmail.com",
    avatarColor: "#1B5E4F",
    rowBackgroundColor: flagshipDetailTeamRowPastels.green,
  },
  {
    id: "3",
    name: "Chantal Uwase",
    initials: "CU",
    email: "Chantal.Uwase@gmail.com",
    avatarColor: "#FF9F00",
    rowBackgroundColor: flagshipDetailTeamRowPastels.orange,
  },
  {
    id: "4",
    name: "Didier Rukundo",
    initials: "DR",
    email: "Didier.Rukundo@gmail.com",
    avatarColor: "#1091C8",
    rowBackgroundColor: flagshipDetailTeamRowPastels.blue,
  },
] as const;

export const flagshipDetailHighlights = [
  {
    id: "1",
    text: "Strong uptake of protected agriculture training among youth cooperatives in Eastern Province.",
    tone: "accent" as const,
  },
  {
    id: "2",
    text: "Value chain linkages with regional markets improved quarter over quarter.",
    tone: "success" as const,
  },
  {
    id: "3",
    text: "Seasonal input costs remain a pressure point for smallest producers.",
    tone: "warning" as const,
  },
  {
    id: "4",
    text: "Monitoring data quality for remote sites needs reinforcement.",
    tone: "muted" as const,
  },
];

/* ─── Flagship list / card grid (senior flagships index + FlagshipsList fallback) ─── */

export interface FlagshipListItem {
  id: number | string;
  status: "active" | "planning" | "closed";
  title: string;
  jobsCreated: number;
  totalInvestment: string;
  numberOfInvestors: number;
  valueChain: string;
  progress: number;
  location: string;
  dateLabel: string;
  accentColor: string;
  investorNames?: string[];
  viewMoreLabel?: string;
}

export const flagshipDummyData: FlagshipListItem[] = [
  {
    id: 1,
    status: "active",
    title: "Youth Empowerment in Protected Agriculture (YEPA)",
    jobsCreated: 400,
    totalInvestment: "$1.95M",
    numberOfInvestors: 8,
    valueChain: "Tomato, Cucumber, Chili",
    progress: 25,
    location: "Rurindo",
    dateLabel: "10/10/2025",
    accentColor: "var(--accent)",
    investorNames: ["Alice Doe", "Brian K.", "Chloe M.", "Daniel O.", "Esther P."],
  },
  {
    id: 2,
    status: "planning",
    title: "Empowering Youth in Poultry Value Chain Development For Enhanced Livelihoods (EYPDEL)",
    jobsCreated: 400,
    totalInvestment: "$1.95M",
    numberOfInvestors: 8,
    valueChain: "Chickens",
    progress: 25,
    location: "Rurindo",
    dateLabel: "10/10/2025",
    accentColor: "var(--warning)",
    investorNames: ["Dami A.", "Eric P.", "Fatima O.", "George N."],
  },
  {
    id: 3,
    status: "active",
    title: "eMpowering Youth through commercial PIG farming (MYPIG)",
    jobsCreated: 400,
    totalInvestment: "$1.95M",
    numberOfInvestors: 8,
    valueChain: "Pig",
    progress: 25,
    location: "Rurindo",
    dateLabel: "10/10/2025",
    accentColor: "var(--forest)",
    investorNames: ["Grace W.", "Henry B.", "Irene N."],
  },
  {
    id: 4,
    status: "closed",
    title: "YOUTH-led AGRICULTURE MECHANIZATION SERVICES (YAMS)",
    jobsCreated: 400,
    totalInvestment: "$1.95M",
    numberOfInvestors: 8,
    valueChain: "Mechanization",
    progress: 25,
    location: "Rurindo",
    dateLabel: "10/10/2025",
    accentColor: "var(--danger)",
    investorNames: ["John T.", "Kemi F.", "Lina A."],
  },
  {
    id: 5,
    status: "planning",
    title: "YOUTH-LED SEED PRODUCTION HUB",
    jobsCreated: 400,
    totalInvestment: "$1.95M",
    numberOfInvestors: 8,
    valueChain: "Potato, rice, cassava, avocado, mango, pineapple",
    progress: 25,
    location: "Rurindo",
    dateLabel: "10/10/2025",
    accentColor: "var(--forest)",
    investorNames: ["Mona C.", "Noah L.", "Olive R."],
  },
  {
    id: 6,
    status: "active",
    title: "Fodder Production (Conventional and Hydroponic)",
    jobsCreated: 400,
    totalInvestment: "$1.95M",
    numberOfInvestors: 8,
    valueChain: "Mechanization",
    progress: 25,
    location: "Rurindo",
    dateLabel: "10/10/2025",
    accentColor: "var(--accent)",
    investorNames: ["Paul M.", "Queenie S.", "Rina T."],
  },
];
