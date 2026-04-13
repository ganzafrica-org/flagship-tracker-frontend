/**
 * Dummy data for development and UI prototyping.
 * All data in this file is fictional and for display purposes only.
 */

export const dummyFlagships = [
  {
    id: 1,
    name: "Clean Water Initiative",
    status: "On Track",
    progress: 72,
    lead: "Jane Doe",
    department: "Infrastructure",
  },
  {
    id: 2,
    name: "Digital Literacy Programme",
    status: "At Risk",
    progress: 45,
    lead: "John Smith",
    department: "Education",
  },
  {
    id: 3,
    name: "Rural Health Outreach",
    status: "Completed",
    progress: 100,
    lead: "Amara Nwosu",
    department: "Health",
  },
];

export const dummyDashboardStats = [
  {
    id: 1,
    label: "Total Flagships",
    value: 24,
    description: "Across all departments",
  },
  {
    id: 2,
    label: "On Track",
    value: 18,
    description: "75% of total flagships",
  },
  {
    id: 3,
    label: "At Risk",
    value: 4,
    description: "Require immediate attention",
  },
  {
    id: 4,
    label: "Completed",
    value: 2,
    description: "Closed this quarter",
  },
];

export type UserStatus = "Active" | "Pending" | "Inactive";

export interface DummyUserRow {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: "Admin" | "M & E";
  status: UserStatus;
}

export const dummyUserTabs = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "planning", label: "Planning" },
  { key: "inactive", label: "Inactive" },
];

export const dummyUsers: DummyUserRow[] = [
  {
    id: 1,
    fullName: "Jean-Claude Nkurunziza",
    email: "jnkurunziza@example.com",
    phone: "+250 788 123 456",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    fullName: "Aline Mukamana",
    email: "amukamana@example.com",
    phone: "+250 788 123 456",
    role: "Admin",
    status: "Active",
  },
  {
    id: 4,
    fullName: "Patrick Uwimana",
    email: "puwimana@example.com",
    phone: "+250 788 123 456",
    role: "Admin",
    status: "Active",
  },
  {
    id: 5,
    fullName: "Patrick Uwimana",
    email: "amukamana@example.com",
    phone: "+250 788 123 456",
    role: "M & E",
    status: "Pending",
  },
  {
    id: 6,
    fullName: "Jean-Claude Nkurunziza",
    email: "amukamana@example.com",
    phone: "+250 788 123 456",
    role: "M & E",
    status: "Pending",
  },
  {
    id: 7,
    fullName: "Jean-Claude Nkurunziza",
    email: "amukamana@example.com",
    phone: "+250 788 123 456",
    role: "M & E",
    status: "Inactive",
  },
  {
    id: 8,
    fullName: "Claude Ndayisenga",
    email: "cndayisenga@example.com",
    phone: "+250 788 111 222",
    role: "Admin",
    status: "Active",
  },
  {
    id: 9,
    fullName: "Olive Uwamahoro",
    email: "ouwamahoro@example.com",
    phone: "+250 788 333 444",
    role: "M & E",
    status: "Pending",
  },
  {
    id: 10,
    fullName: "Patrick Rwabukumba",
    email: "prwabukumba@example.com",
    phone: "+250 788 555 666",
    role: "Admin",
    status: "Active",
  },
  {
    id: 11,
    fullName: "Jane Mukandayisenga",
    email: "jmukandayisenga@example.com",
    phone: "+250 788 777 888",
    role: "M & E",
    status: "Inactive",
  },
  {
    id: 12,
    fullName: "Emmanuel Nkundabera",
    email: "enkundabera@example.com",
    phone: "+250 788 909 101",
    role: "Admin",
    status: "Active",
  },
  {
    id: 13,
    fullName: "Didier Mugabo",
    email: "dmugabo@example.com",
    phone: "+250 788 202 303",
    role: "M & E",
    status: "Pending",
  },
  {
    id: 14,
    fullName: "Marie Claire Uwera",
    email: "mcuwera@example.com",
    phone: "+250 788 404 505",
    role: "Admin",
    status: "Active",
  },
  {
    id: 15,
    fullName: "Ariane Nishimwe",
    email: "anishimwe@example.com",
    phone: "+250 788 606 707",
    role: "M & E",
    status: "Inactive",
  },
];

export interface DummyReportRow {
  id: number;
  name: string;
  type: "Progress" | "Financial" | "Monitoring" | "Annual" | "Quarterly" | "Custom";
  periodOrDate: string;
  createdBy: string;
  status: "Auto-Generated" | "Generated";
}

export const dummyManageReports: DummyReportRow[] = [
  {
    id: 1,
    name: "Investment Impact Report",
    type: "Progress",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Auto-Generated",
  },
  {
    id: 2,
    name: "Progress Report",
    type: "Financial",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Auto-Generated",
  },
  {
    id: 4,
    name: "Progress Report",
    type: "Progress",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Auto-Generated",
  },
  {
    id: 5,
    name: "Patrick Uwimana",
    type: "Monitoring",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Generated",
  },
  {
    id: 6,
    name: "Investment Impact Report",
    type: "Financial",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Generated",
  },
  {
    id: 7,
    name: "Investment Impact Report",
    type: "Progress",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Generated",
  },
  {
    id: 8,
    name: "District Delivery Performance",
    type: "Monitoring",
    periodOrDate: "2025-09-09",
    createdBy: "2025-06-29",
    status: "Generated",
  },
  {
    id: 9,
    name: "Annual Budget Report",
    type: "Financial",
    periodOrDate: "2025-09-09",
    createdBy: "2025-06-29",
    status: "Auto-Generated",
  },
  {
    id: 10,
    name: "Program Outcome Dashboard",
    type: "Progress",
    periodOrDate: "2025-09-08",
    createdBy: "2025-06-28",
    status: "Auto-Generated",
  },
  {
    id: 11,
    name: "Capital Projects Utilization",
    type: "Financial",
    periodOrDate: "2025-09-08",
    createdBy: "2025-06-28",
    status: "Generated",
  },
  {
    id: 12,
    name: "Compliance and Risk Report",
    type: "Monitoring",
    periodOrDate: "2025-09-07",
    createdBy: "2025-06-27",
    status: "Auto-Generated",
  },
  {
    id: 13,
    name: "Service Delivery Snapshot",
    type: "Progress",
    periodOrDate: "2025-09-07",
    createdBy: "2025-06-27",
    status: "Generated",
  },
  {
    id: 14,
    name: "Public Investment Summary",
    type: "Financial",
    periodOrDate: "2025-09-06",
    createdBy: "2025-06-26",
    status: "Generated",
  },
  {
    id: 15,
    name: "Quarterly Monitoring Digest",
    type: "Monitoring",
    periodOrDate: "2025-09-06",
    createdBy: "2025-06-26",
    status: "Auto-Generated",
  },
];

export const dummyReportsList = [
  {
    id: 1,
    name: "Flagships Annual Country Outlook",
    type: "Annual",
    period: "2025",
    createdOn: "15/09/25",
    createdBy: "Patrick",
    origin: "Auto-Generated",
  },
  {
    id: 2,
    name: "Flagship Binding Constraints, Opportunities and Incentives",
    type: "Quarterly",
    period: "Q2 2025",
    createdOn: "16/09/25",
    createdBy: "Oliver",
    origin: "Auto-Generated",
  },
  {
    id: 4,
    name: "Gender-Disaggregated Report - YEPA (Q2 2025)",
    type: "Custom",
    period: "Q2 2025",
    createdOn: "18/06/23",
    createdBy: "Didier",
    origin: "Created Reports",
  },
  {
    id: 5,
    name: "Annual Flagship Report - YEPA (2024)",
    type: "Annual",
    period: "2024",
    createdOn: "23/03/23",
    createdBy: "Chantal",
    origin: "Created Reports",
  },
  {
    id: 6,
    name: "District Performance Report - YEPA (Gasabo Only)",
    type: "Custom",
    period: "2025",
    createdOn: "11/06/24",
    createdBy: "Patrick",
    origin: "Created Reports",
  },
  {
    id: 7,
    name: "Annual Flagship Report - YEPA (2023)",
    type: "Annual",
    period: "2023",
    createdOn: "06/07/25",
    createdBy: "Oliver",
    origin: "Created Reports",
  },
  {
    id: 8,
    name: "National Infrastructure Progress Report",
    type: "Quarterly",
    period: "Q1 2025",
    createdOn: "03/07/25",
    createdBy: "Patrick",
    origin: "Auto-Generated",
  },
  {
    id: 9,
    name: "Digital Services Accessibility Report",
    type: "Custom",
    period: "2025",
    createdOn: "29/06/25",
    createdBy: "Aline",
    origin: "Created Reports",
  },
  {
    id: 10,
    name: "Gender and Inclusion Monitoring Report",
    type: "Custom",
    period: "Q1 2025",
    createdOn: "20/06/25",
    createdBy: "Didier",
    origin: "Created Reports",
  },
  {
    id: 11,
    name: "Flagship Financial Health Summary",
    type: "Annual",
    period: "2024",
    createdOn: "15/06/25",
    createdBy: "Oliver",
    origin: "Auto-Generated",
  },
  {
    id: 12,
    name: "Program Delivery Accountability Report",
    type: "Quarterly",
    period: "Q4 2024",
    createdOn: "08/06/25",
    createdBy: "Patrick",
    origin: "Created Reports",
  },
  {
    id: 13,
    name: "Monitoring & Evaluation Consolidated Report",
    type: "Custom",
    period: "2025",
    createdOn: "30/05/25",
    createdBy: "Chantal",
    origin: "Auto-Generated",
  },
  {
    id: 14,
    name: "District Performance Benchmark Report",
    type: "Quarterly",
    period: "Q3 2024",
    createdOn: "22/05/25",
    createdBy: "Aline",
    origin: "Created Reports",
  },
  {
    id: 15,
    name: "Flagship Outcomes Tracking Report",
    type: "Annual",
    period: "2022",
    createdOn: "16/05/25",
    createdBy: "Didier",
    origin: "Auto-Generated",
  },
];

/** M&E Data Management table — fictional sample data for UI prototyping. */
export interface DataManagementRow {
  id: number;
  totalInvestment: string;
  jobsCreated: number;
  revenueGenerated: string;
  createdOn: string;
  createdBy: string;
  [key: string]: string | number;
}

export const dummyDataManagementRows: DataManagementRow[] = [
  { id: 1, totalInvestment: "$750,000", jobsCreated: 150, revenueGenerated: "$750,000", createdOn: "15/09/25", createdBy: "Patrick" },
  { id: 2, totalInvestment: "$750,000", jobsCreated: 150, revenueGenerated: "$750,000", createdOn: "16/09/25", createdBy: "Oliver" },
  { id: 4, totalInvestment: "$750,000", jobsCreated: 25, revenueGenerated: "$750,000", createdOn: "18/06/23", createdBy: "Didier" },
  { id: 5, totalInvestment: "$750,000", jobsCreated: 25, revenueGenerated: "$750,000", createdOn: "23/03/23", createdBy: "Chantal" },
  { id: 6, totalInvestment: "$750,000", jobsCreated: 20, revenueGenerated: "$750,000", createdOn: "11/06/24", createdBy: "Patrick" },
  { id: 7, totalInvestment: "$750,000", jobsCreated: 150, revenueGenerated: "$750,000", createdOn: "06/07/25", createdBy: "Oliver" },
  { id: 8, totalInvestment: "$620,000", jobsCreated: 88, revenueGenerated: "$540,000", createdOn: "02/05/25", createdBy: "Aline" },
  { id: 9, totalInvestment: "$480,000", jobsCreated: 42, revenueGenerated: "$410,000", createdOn: "19/04/25", createdBy: "Patrick" },
  { id: 10, totalInvestment: "$910,000", jobsCreated: 120, revenueGenerated: "$890,000", createdOn: "28/03/25", createdBy: "Didier" },
  { id: 11, totalInvestment: "$330,000", jobsCreated: 18, revenueGenerated: "$295,000", createdOn: "14/02/25", createdBy: "Chantal" },
  { id: 12, totalInvestment: "$705,000", jobsCreated: 95, revenueGenerated: "$680,000", createdOn: "30/01/25", createdBy: "Oliver" },
  { id: 13, totalInvestment: "$560,000", jobsCreated: 60, revenueGenerated: "$520,000", createdOn: "11/12/24", createdBy: "Aline" },
  { id: 14, totalInvestment: "$440,000", jobsCreated: 35, revenueGenerated: "$400,000", createdOn: "03/11/24", createdBy: "Patrick" },
  { id: 15, totalInvestment: "$800,000", jobsCreated: 110, revenueGenerated: "$775,000", createdOn: "22/10/24", createdBy: "Didier" },
  { id: 16, totalInvestment: "$390,000", jobsCreated: 28, revenueGenerated: "$360,000", createdOn: "07/09/24", createdBy: "Chantal" },
];
