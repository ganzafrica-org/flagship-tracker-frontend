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
    id: 3,
    fullName: "Patrick Uwimana",
    email: "puwimana@example.com",
    phone: "+250 788 123 456",
    role: "Admin",
    status: "Active",
  },
  {
    id: 4,
    fullName: "Patrick Uwimana",
    email: "amukamana@example.com",
    phone: "+250 788 123 456",
    role: "M & E",
    status: "Pending",
  },
  {
    id: 5,
    fullName: "Jean-Claude Nkurunziza",
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
    status: "Inactive",
  },
  {
    id: 7,
    fullName: "Claude Ndayisenga",
    email: "cndayisenga@example.com",
    phone: "+250 788 111 222",
    role: "Admin",
    status: "Active",
  },
  {
    id: 8,
    fullName: "Olive Uwamahoro",
    email: "ouwamahoro@example.com",
    phone: "+250 788 333 444",
    role: "M & E",
    status: "Pending",
  },
  {
    id: 9,
    fullName: "Patrick Rwabukumba",
    email: "prwabukumba@example.com",
    phone: "+250 788 555 666",
    role: "Admin",
    status: "Active",
  },
  {
    id: 10,
    fullName: "Jane Mukandayisenga",
    email: "jmukandayisenga@example.com",
    phone: "+250 788 777 888",
    role: "M & E",
    status: "Inactive",
  },
  {
    id: 11,
    fullName: "Emmanuel Nkundabera",
    email: "enkundabera@example.com",
    phone: "+250 788 909 101",
    role: "Admin",
    status: "Active",
  },
  {
    id: 12,
    fullName: "Didier Mugabo",
    email: "dmugabo@example.com",
    phone: "+250 788 202 303",
    role: "M & E",
    status: "Pending",
  },
  {
    id: 13,
    fullName: "Marie Claire Uwera",
    email: "mcuwera@example.com",
    phone: "+250 788 404 505",
    role: "Admin",
    status: "Active",
  },
  {
    id: 14,
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
    id: 3,
    name: "Progress Report",
    type: "Progress",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Auto-Generated",
  },
  {
    id: 4,
    name: "Patrick Uwimana",
    type: "Monitoring",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Generated",
  },
  {
    id: 5,
    name: "Investment Impact Report",
    type: "Financial",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Generated",
  },
  {
    id: 6,
    name: "Investment Impact Report",
    type: "Progress",
    periodOrDate: "2025-09-10",
    createdBy: "2025-06-30",
    status: "Generated",
  },
  {
    id: 7,
    name: "District Delivery Performance",
    type: "Monitoring",
    periodOrDate: "2025-09-09",
    createdBy: "2025-06-29",
    status: "Generated",
  },
  {
    id: 8,
    name: "Annual Budget Report",
    type: "Financial",
    periodOrDate: "2025-09-09",
    createdBy: "2025-06-29",
    status: "Auto-Generated",
  },
  {
    id: 9,
    name: "Program Outcome Dashboard",
    type: "Progress",
    periodOrDate: "2025-09-08",
    createdBy: "2025-06-28",
    status: "Auto-Generated",
  },
  {
    id: 10,
    name: "Capital Projects Utilization",
    type: "Financial",
    periodOrDate: "2025-09-08",
    createdBy: "2025-06-28",
    status: "Generated",
  },
  {
    id: 11,
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

// ─── Individuals ──────────────────────────────────────────────────────────────

export type YouthCategory = "student" | "graduate" | "neet" | "employed" | "self_employed" | "other";
export type EducationLevel = "none" | "primary" | "lower_secondary" | "upper_secondary" | "tvet" | "university" | "other";
export type RegistrationSource = "flagship" | "walk-in" | "referral" | "survey";
export type IndividualSex = "Male" | "Female";

export interface DummyIndividual {
  id: number;
  national_id?: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  sex: IndividualSex;
  date_of_birth?: string;
  youth_category?: YouthCategory;
  education_level?: EducationLevel;
  disability_status?: boolean;
  registration_source: RegistrationSource;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  flagship_id?: number;
  flagship_name?: string;
  created_at: string;
}

export const dummyIndividuals: DummyIndividual[] = [
  { id: 1, national_id: "1199880012345678", phone_number: "+250 788 111 001", first_name: "Amina", last_name: "Uwimana", sex: "Female", date_of_birth: "1999-03-15", youth_category: "graduate", education_level: "university", disability_status: false, registration_source: "flagship", province: "Kigali City", district: "Gasabo", sector: "Kimironko", cell: "Bibare", village: "Nyagasambu", flagship_id: 1, flagship_name: "YEPA", created_at: "2025-01-10" },
  { id: 2, national_id: "1200090023456789", phone_number: "+250 788 111 002", first_name: "Jean Pierre", last_name: "Habimana", sex: "Male", date_of_birth: "2000-07-22", youth_category: "student", education_level: "upper_secondary", disability_status: false, registration_source: "walk-in", province: "Northern Province", district: "Rulindo", sector: "Base", cell: "Muyebe", village: "Cyunuzi", flagship_id: 2, flagship_name: "EYPDEL", created_at: "2025-01-12" },
  { id: 3, phone_number: "+250 788 111 003", first_name: "Claire", last_name: "Mukamana", sex: "Female", date_of_birth: "1998-11-05", youth_category: "neet", education_level: "lower_secondary", disability_status: false, registration_source: "referral", province: "Southern Province", district: "Huye", sector: "Tumba", cell: "Ngoma", village: "Agaciro", flagship_id: 3, flagship_name: "MYPIG", created_at: "2025-01-15" },
  { id: 4, national_id: "1199770034567890", phone_number: "+250 788 111 004", first_name: "Eric", last_name: "Niyonkuru", sex: "Male", date_of_birth: "1997-05-18", youth_category: "employed", education_level: "tvet", disability_status: false, registration_source: "survey", province: "Eastern Province", district: "Nyagatare", sector: "Karangazi", cell: "Munyaga", village: "Rwemiyaga", flagship_id: 1, flagship_name: "YEPA", created_at: "2025-01-18" },
  { id: 5, phone_number: "+250 788 111 005", first_name: "Grace", last_name: "Ineza", sex: "Female", date_of_birth: "2001-02-28", youth_category: "student", education_level: "university", disability_status: true, registration_source: "flagship", province: "Western Province", district: "Rubavu", sector: "Gisenyi", cell: "Kivumu", village: "Amahoro", flagship_id: 2, flagship_name: "EYPDEL", created_at: "2025-01-20" },
  { id: 6, national_id: "1200200045678901", phone_number: "+250 788 111 006", first_name: "Patrick", last_name: "Rwabukumba", sex: "Male", date_of_birth: "2002-09-14", youth_category: "graduate", education_level: "university", disability_status: false, registration_source: "walk-in", province: "Kigali City", district: "Kicukiro", sector: "Kanombe", cell: "Murama", village: "Kabeza", flagship_id: 3, flagship_name: "MYPIG", created_at: "2025-01-22" },
  { id: 7, phone_number: "+250 788 111 007", first_name: "Diane", last_name: "Nshimiyimana", sex: "Female", date_of_birth: "1999-06-30", youth_category: "self_employed", education_level: "tvet", disability_status: false, registration_source: "referral", province: "Northern Province", district: "Gicumbi", sector: "Byumba", cell: "Ruhunde", village: "Kabuye", flagship_id: 1, flagship_name: "YEPA", created_at: "2025-02-01" },
  { id: 8, national_id: "1199880056789012", phone_number: "+250 788 111 008", first_name: "Samuel", last_name: "Mugisha", sex: "Male", date_of_birth: "1998-12-01", youth_category: "employed", education_level: "upper_secondary", disability_status: false, registration_source: "survey", province: "Southern Province", district: "Muhanga", sector: "Shyogwe", cell: "Cyeza", village: "Gaseke", flagship_id: 2, flagship_name: "EYPDEL", created_at: "2025-02-05" },
  { id: 9, phone_number: "+250 788 111 009", first_name: "Solange", last_name: "Umubyeyi", sex: "Female", date_of_birth: "2000-04-17", youth_category: "neet", education_level: "primary", disability_status: false, registration_source: "flagship", province: "Eastern Province", district: "Rwamagana", sector: "Fumbwe", cell: "Gatare", village: "Ruharambuga", flagship_id: 3, flagship_name: "MYPIG", created_at: "2025-02-10" },
  { id: 10, national_id: "1200110067890123", phone_number: "+250 788 111 010", first_name: "David", last_name: "Ndayisenga", sex: "Male", date_of_birth: "2001-08-25", youth_category: "graduate", education_level: "university", disability_status: false, registration_source: "walk-in", province: "Western Province", district: "Rusizi", sector: "Kamembe", cell: "Muganza", village: "Bugarama", flagship_id: 1, flagship_name: "YEPA", created_at: "2025-02-14" },
  { id: 11, phone_number: "+250 788 111 011", first_name: "Laetitia", last_name: "Iradukunda", sex: "Female", date_of_birth: "1997-01-09", youth_category: "other", education_level: "none", disability_status: true, registration_source: "referral", province: "Northern Province", district: "Musanze", sector: "Kinigi", cell: "Bisoke", village: "Muhabura", flagship_id: 2, flagship_name: "EYPDEL", created_at: "2025-02-18" },
  { id: 12, national_id: "1199990078901234", phone_number: "+250 788 111 012", first_name: "Emmanuel", last_name: "Nkundimana", sex: "Male", date_of_birth: "1999-10-11", youth_category: "student", education_level: "upper_secondary", disability_status: false, registration_source: "survey", province: "Kigali City", district: "Nyarugenge", sector: "Nyamirambo", cell: "Biryogo", village: "Kimisagara", flagship_id: 3, flagship_name: "MYPIG", created_at: "2025-02-22" },
  { id: 13, phone_number: "+250 788 111 013", first_name: "Consolee", last_name: "Mukandekezi", sex: "Female", date_of_birth: "2003-05-20", youth_category: "student", education_level: "lower_secondary", disability_status: false, registration_source: "flagship", province: "Southern Province", district: "Nyanza", sector: "Busasamana", cell: "Rugendabari", village: "Kavumu", flagship_id: 1, flagship_name: "YEPA", created_at: "2025-03-01" },
  { id: 14, national_id: "1200030089012345", phone_number: "+250 788 111 014", first_name: "Alexis", last_name: "Tuyishime", sex: "Male", date_of_birth: "2000-12-03", youth_category: "self_employed", education_level: "tvet", disability_status: false, registration_source: "walk-in", province: "Eastern Province", district: "Bugesera", sector: "Juru", cell: "Nyamata", village: "Biharwe", flagship_id: 2, flagship_name: "EYPDEL", created_at: "2025-03-05" },
  { id: 15, phone_number: "+250 788 111 015", first_name: "Noella", last_name: "Uwera", sex: "Female", date_of_birth: "1996-07-07", youth_category: "employed", education_level: "university", disability_status: false, registration_source: "referral", province: "Western Province", district: "Ngororero", sector: "Muhanda", cell: "Gitwa", village: "Ruli", flagship_id: 3, flagship_name: "MYPIG", created_at: "2025-03-10" },
  { id: 16, national_id: "1199860090123456", phone_number: "+250 788 111 016", first_name: "Innocent", last_name: "Gahigi", sex: "Male", date_of_birth: "1998-03-29", youth_category: "graduate", education_level: "university", disability_status: false, registration_source: "survey", province: "Northern Province", district: "Gakenke", sector: "Coko", cell: "Buranga", village: "Nyamiyaga", flagship_id: 1, flagship_name: "YEPA", created_at: "2025-03-14" },
  { id: 17, phone_number: "+250 788 111 017", first_name: "Vestine", last_name: "Kayitesi", sex: "Female", date_of_birth: "2002-11-16", youth_category: "neet", education_level: "primary", disability_status: false, registration_source: "flagship", province: "Southern Province", district: "Kamonyi", sector: "Gacurabwenge", cell: "Bwisige", village: "Kirehe", flagship_id: 2, flagship_name: "EYPDEL", created_at: "2025-03-18" },
  { id: 18, national_id: "1200200101234567", phone_number: "+250 788 111 018", first_name: "Cedric", last_name: "Nzeyimana", sex: "Male", date_of_birth: "2002-01-24", youth_category: "student", education_level: "upper_secondary", disability_status: false, registration_source: "walk-in", province: "Eastern Province", district: "Kayonza", sector: "Mukarange", cell: "Nyagahanga", village: "Gikombe", flagship_id: 3, flagship_name: "MYPIG", created_at: "2025-03-22" },
  { id: 19, phone_number: "+250 788 111 019", first_name: "Prudence", last_name: "Nizeyimana", sex: "Female", date_of_birth: "1995-09-08", youth_category: "employed", education_level: "tvet", disability_status: true, registration_source: "referral", province: "Kigali City", district: "Gasabo", sector: "Remera", cell: "Rukiri", village: "Nyabisindu", flagship_id: 1, flagship_name: "YEPA", created_at: "2025-04-01" },
  { id: 20, national_id: "1199970112345678", phone_number: "+250 788 111 020", first_name: "Fabrice", last_name: "Manishimwe", sex: "Male", date_of_birth: "1997-04-13", youth_category: "other", education_level: "lower_secondary", disability_status: false, registration_source: "survey", province: "Western Province", district: "Karongi", sector: "Bwishyura", cell: "Kirambo", village: "Cyato", flagship_id: 2, flagship_name: "EYPDEL", created_at: "2025-04-05" },
];
