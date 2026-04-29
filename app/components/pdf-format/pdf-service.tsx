import {
  Page,
  Text,
  View,
  Document,
  PDFViewer,
  PDFDownloadLink,
  Svg,
  Rect,
  G,
  Line,
  Path,
} from "@react-pdf/renderer";
import { styles } from "./style";
import type { ReportDownloadRow } from "~/components/pages/reports/report-download-utils";
import {
  flagshipDetailHighlights,
  flagshipDetailJobsByGender,
  flagshipDetailJobsCurrent,
  flagshipDetailJobsPerChain,
  flagshipDetailJobsTarget,
  flagshipDetailKpis,
  flagshipDetailLocations,
  flagshipDetailQuantitiesByChain,
  flagshipDetailRevenueByChain,
  getFlagshipDetailIntro,
} from "~/data/dummy-flagship-detail";

const PDF_THEME = {
  primary: "#1091C8",
  success: "#1B5E4F",
  warning: "#FF9F00",
  danger: "#D64045",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#D1D5DB",
  softBlue: "#E9F1F5",
  softGreen: "#DFF6F0",
  softOrange: "#F6E9D7",
};

const reportIntro = getFlagshipDetailIntro(1, "Youth Empowerment in Protected Agriculture (YEPA)");
const descriptionText = reportIntro.segments.map((segment) => segment.text).join("");
const latestRevenue = flagshipDetailRevenueByChain[flagshipDetailRevenueByChain.length - 1];
const latestQuantity = flagshipDetailQuantitiesByChain[flagshipDetailQuantitiesByChain.length - 1];
const femaleYouth = flagshipDetailJobsByGender.find((row) => row.name === "Female")?.value ?? 0;
const maleYouth = flagshipDetailJobsByGender.find((row) => row.name === "Male")?.value ?? 0;
const totalYouth = femaleYouth + maleYouth;
const youthCompletionRate = Math.round((flagshipDetailJobsCurrent / flagshipDetailJobsTarget) * 100);
const youthJobsTrend = flagshipDetailJobsPerChain.map((row) => ({
  year: row.year,
  total: row.tomato + row.cucumber + row.chili,
}));

const BarChart = () => {
  const width = 220;
  const height = 118;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barData = flagshipDetailJobsByGender.map((item) => ({
    ...item,
    color: item.name === "Female" ? PDF_THEME.primary : PDF_THEME.warning,
  }));
  const maxValue = Math.max(...barData.map((item) => item.value), 1);
  const barWidth = chartWidth / barData.length - 22;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={width} height={height}>
        {[0, 25, 50, 75, 100].map((tickPercent) => {
          const tickValue = Math.round((tickPercent / 100) * maxValue);
          return (
            <G key={tickPercent}>
              <Line
                x1={padding}
                y1={height - padding - (tickPercent / 100) * chartHeight}
                x2={width - padding}
                y2={height - padding - (tickPercent / 100) * chartHeight}
                stroke={PDF_THEME.border}
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <Text
                x={padding - 18}
                y={height - padding - (tickPercent / 100) * chartHeight + 3}
                style={{ fontSize: 7, color: PDF_THEME.muted }}
              >
                {String(tickValue)}
              </Text>
            </G>
          );
        })}

        {barData.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          return (
            <Rect
              key={item.name}
              x={padding + index * (barWidth + 22) + 12}
              y={height - padding - barHeight}
              width={barWidth}
              height={barHeight}
              fill={item.color}
              rx={3}
            />
          );
        })}

        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={PDF_THEME.muted}
          strokeWidth={1}
        />
      </Svg>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: PDF_THEME.warning }]} />
          <Text style={styles.chartLabel}>Male</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: PDF_THEME.primary }]} />
          <Text style={styles.chartLabel}>Female</Text>
        </View>
      </View>
    </View>
  );
};

const DonutChart = () => {
  const width = 210;
  const height = 98;
  const cx = width / 2;
  const cy = 95;
  const radius = 70;
  const strokeWidth = 24;
  const percentage = Math.min(flagshipDetailJobsCurrent / flagshipDetailJobsTarget, 1);
  const endX = cx - radius * Math.cos(percentage * Math.PI);
  const endY = cy - radius * Math.sin(percentage * Math.PI);
  const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  const progressPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={width} height={height}>
        <Path d={bgPath} stroke={PDF_THEME.border} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        {percentage > 0 && (
          <Path
            d={progressPath}
            stroke={PDF_THEME.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        )}
        <Text
          x={cx - 20}
          y={cy - 22}
          style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: PDF_THEME.text }}
        >
          {`${Math.round(percentage * 100)}%`}
        </Text>
        <Text x={cx - 28} y={cy - 6} style={{ fontSize: 9, color: PDF_THEME.muted }}>
          {`${flagshipDetailJobsCurrent} / ${flagshipDetailJobsTarget}`}
        </Text>
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: PDF_THEME.primary }]} />
          <Text style={styles.chartLabel}>Actual jobs</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: PDF_THEME.border }]} />
          <Text style={styles.chartLabel}>Target jobs</Text>
        </View>
      </View>
    </View>
  );
};

const YouthJobsTrendChart = () => {
  const width = 220;
  const height = 94;
  const padding = 20;
  const maxValue = Math.max(...youthJobsTrend.map((d) => d.total), 1);
  const stepX = youthJobsTrend.length > 1 ? (width - padding * 2) / (youthJobsTrend.length - 1) : 0;

  const points = youthJobsTrend
    .map((d, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (d.total / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={width} height={height}>
        {[0, 25, 50, 75, 100].map((tick) => (
          <Line
            key={tick}
            x1={padding}
            y1={height - padding - (tick / 100) * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - (tick / 100) * (height - padding * 2)}
            stroke={PDF_THEME.border}
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        ))}
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={PDF_THEME.muted}
          strokeWidth={1}
        />
        <Path d={`M ${points}`} stroke={PDF_THEME.primary} strokeWidth={2} fill="none" />
        {youthJobsTrend.map((d, i) => {
          const x = padding + i * stepX;
          const y = height - padding - (d.total / maxValue) * (height - padding * 2);
          return (
            <G key={d.year}>
              <Rect x={x - 2.5} y={y - 2.5} width={5} height={5} fill={PDF_THEME.warning} rx={2} />
              <Text x={x - 8} y={height - 6} style={{ fontSize: 7, color: PDF_THEME.muted }}>
                {d.year.slice(-2)}
              </Text>
            </G>
          );
        })}
      </Svg>
      <Text style={{ fontSize: 8, color: PDF_THEME.muted }}>Jobs Created for Youth Trend (by year)</Text>
    </View>
  );
};

export const ReportPDF = ({ report }: { report?: ReportDownloadRow | null }) => {
  const reportTitle = report?.name?.trim() || "Flagship Report";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{reportTitle}</Text>
        <View style={[styles.titleUnderline, { borderBottomColor: PDF_THEME.primary }]} />
      </View>

      <View style={styles.kpiRow}>
        {flagshipDetailKpis.map((kpi, index) => (
          <View
            key={kpi.id}
            style={[
              styles.kpiCard,
              { backgroundColor: index % 2 === 0 ? PDF_THEME.softBlue : PDF_THEME.softGreen },
            ]}
          >
            <Text style={[styles.kpiValue, { color: PDF_THEME.text }]}>{kpi.stat}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mainGrid}>
        <View style={styles.leftCol}>
          <Text style={styles.sectionTitle}>Project Description</Text>
          <Text style={styles.description}>{descriptionText}</Text>
          <Text style={[styles.largeAmount, { color: PDF_THEME.success }]}>
            Revenue (2026): ${(latestRevenue.tomato + latestRevenue.cucumber + latestRevenue.chili).toFixed(2)}M
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.sectionTitle}>Jobs Created by Gender</Text>
          <BarChart />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.mainGrid}>
        <View style={styles.leftCol}>
          <Text style={styles.sectionTitle}>Progress Versus Target: Jobs for Youth</Text>
          <DonutChart />
          <Text style={[styles.sectionTitle, { marginTop: 6, marginBottom: 4 }]}>
            Jobs Created for Youth (Trend)
          </Text>
          <YouthJobsTrendChart />
          <Text style={[styles.sectionTitle, { marginTop: 6, marginBottom: 4 }]}>Youth Impact Snapshot</Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: PDF_THEME.success }]}>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Metric</Text>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Value</Text>
            </View>
            <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softGreen }]}>
              <Text style={styles.tableCell}>Total youth reached</Text>
              <Text style={styles.tableCell}>{totalYouth}</Text>
            </View>
            <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softBlue }]}>
              <Text style={styles.tableCell}>Female youth</Text>
              <Text style={styles.tableCell}>{femaleYouth}</Text>
            </View>
            <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softOrange }]}>
              <Text style={styles.tableCell}>Male youth</Text>
              <Text style={styles.tableCell}>{maleYouth}</Text>
            </View>
            <View style={[styles.tableRow, { backgroundColor: "#F3F4F6" }]}>
              <Text style={styles.tableCell}>Jobs target completion</Text>
              <Text style={styles.tableCell}>{youthCompletionRate}%</Text>
            </View>
          </View>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: PDF_THEME.border }]} />

        <View style={styles.rightCol}>
          <Text style={styles.sectionTitle}>Revenue by Value Chain (Latest Year)</Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: PDF_THEME.primary }]}>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Year</Text>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Tomato</Text>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Cucumber</Text>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Chili</Text>
            </View>
            <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softBlue }]}>
              <Text style={styles.tableCell}>{latestRevenue.year}</Text>
              <Text style={styles.tableCell}>{latestRevenue.tomato}M</Text>
              <Text style={styles.tableCell}>{latestRevenue.cucumber}M</Text>
              <Text style={styles.tableCell}>{latestRevenue.chili}M</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quantities Produced (Latest Year)</Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: PDF_THEME.warning }]}>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Year</Text>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Tomato</Text>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Cucumber</Text>
              <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Chili</Text>
            </View>
            <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softOrange }]}>
              <Text style={styles.tableCell}>{latestQuantity.year}</Text>
              <Text style={styles.tableCell}>{latestQuantity.tomato}</Text>
              <Text style={styles.tableCell}>{latestQuantity.cucumber}</Text>
              <Text style={styles.tableCell}>{latestQuantity.chili}</Text>
            </View>
          </View>
          <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 4 }]}>Implementation Locations</Text>
          {flagshipDetailLocations.map((location) => (
            <Text key={location.id} style={styles.listItem}>
              • {location.province} - {location.detail}
            </Text>
          ))}
          <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 4 }]}>Key Highlights</Text>
          {flagshipDetailHighlights.slice(0, 3).map((highlight, idx) => (
            <View
              key={highlight.id}
              style={[
                styles.highlightRow,
                {
                  backgroundColor:
                    idx === 0 ? PDF_THEME.softBlue : idx === 1 ? PDF_THEME.softGreen : PDF_THEME.softOrange,
                },
              ]}
            >
              <Text style={styles.highlightText}>{highlight.text}</Text>
            </View>
          ))}
        </View>
      </View>
      </Page>
    </Document>
  );
};

export default function Report2() {
  return (
    <div className="max-w-2xl mx-auto my-10">
      <div className="w-full h-[500px]">
        <PDFViewer width="100%" height="100%">
          <ReportPDF />
        </PDFViewer>
      </div>
      <div className="mt-6 flex justify-center">
        <PDFDownloadLink document={<ReportPDF />} fileName="pdf-service.pdf">
          {/* @ts-ignore */}
          {({ loading }) => (
            <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300">
              {loading ? "Preparing PDF..." : "Download PDF"}
            </button>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  );
}