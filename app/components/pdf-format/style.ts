import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    color: "#262626",
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: "18px 18px",
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  titleUnderline: {
    borderBottomWidth: 2,
    width: "60%",
    marginTop: 10,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 6,
    padding: 6,
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 7.5,
    color: "#4B5563",
  },
  mainGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  leftCol: {
    width: "48%",
  },
  rightCol: {
    width: "48%",
  },
  description: {
    fontSize: 8.5,
    lineHeight: 1.35,
    color: "#4B5563",
    textAlign: "justify",
  },
  largeAmount: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  table: {
    width: "100%",
    marginBottom: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    flex: 1,
    textAlign: "center",
  },
  verticalDivider: {
    width: 1,
    height: "100%",
  },
  chartLabel: {
    fontSize: 8,
    color: "#6B7280",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listItem: {
    fontSize: 8,
    color: "#4B5563",
    marginBottom: 2,
  },
  highlightRow: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 4,
    marginBottom: 3,
  },
  highlightText: {
    fontSize: 8,
    color: "#1F2937",
    lineHeight: 1.25,
  },
});