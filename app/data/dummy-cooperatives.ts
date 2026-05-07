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
