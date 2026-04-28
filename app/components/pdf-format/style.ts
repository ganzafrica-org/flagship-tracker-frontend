import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    page: {
        backgroundColor: "#fff",
        color: "#262626",
        fontFamily: "Helvetica",
        fontSize: 10,
        padding: "40px 40px",
    },
    header: {
        alignItems: "center",
        marginBottom: 30,
    },
    title: {
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
    },
    titleUnderline: {
        borderBottomWidth: 2,
        borderBottomColor: "#000",
        width: "60%",
        marginTop: 5,
    },
    mainGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    leftCol: {
        width: "45%",
    },
    rightCol: {
        width: "50%",
    },
    description: {
        fontSize: 9,
        lineHeight: 1.4,
        color: "#4B5563",
        textAlign: "justify",
    },
    largeAmount: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: "#98D870",
        marginTop: 15,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        marginBottom: 10,
    },
    table: {
        width: "100%",
        marginBottom: 20,
    },
    tableHeader: {
        backgroundColor: "#D1D5DB",
        flexDirection: "row",
    },
    tableHeaderCell: {
        padding: 6,
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        flex: 1,
    },
    tableRow: {
        flexDirection: "row",
    },
    tableCell: {
        padding: 6,
        fontSize: 9,
        flex: 1,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: "#E5E7EB",
        height: "100%",
    },
    chartContainer: {
        height: 180,
        width: "100%",
    },
    chartLabel: {
        fontSize: 8,
        color: "#6B7280",
    },
    legend: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        marginTop: 10,
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
});