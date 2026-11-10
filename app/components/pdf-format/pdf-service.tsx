import {
  Document,
  G,
  Line,
  Page,
  Path,
  PDFDownloadLink,
  PDFViewer,
  Rect,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import type { FlagshipReportContent, ReportDownloadRow } from "~/components/pages/reports/report-download-utils";
import { styles } from "./style";

const PDF_THEME = {
  primary: "#1091C8",
  success: "#1B5E4F",
  warning: "#FF9F00",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#D1D5DB",
  softBlue: "#E9F1F5",
  softGreen: "#DFF6F0",
  softOrange: "#F6E9D7",
};

const KPI_TONES = [PDF_THEME.softBlue, PDF_THEME.softGreen, PDF_THEME.softOrange];

const emptyContent: FlagshipReportContent = {
  title: "Flagship report",
  stats: [],
  jobsCreated: 0,
  jobsTarget: null,
  jobsPercent: null,
  jobsByYear: [],
  genderTotal: null,
  gender: [],
  description: "",
  startDate: null,
  endDate: null,
  locations: [],
  notes: [],
  valueChains: "",
  funders: [],
};

function BarChart({ slices }: { slices: { name: string; value: number }[] }) {
  const width = 220;
  const height = 118;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barData = slices.map((item) => ({
    ...item,
    color: item.name === "Female" ? PDF_THEME.primary : PDF_THEME.warning,
  }));
  const maxValue = Math.max(...barData.map((item) => item.value), 1);
  const barWidth = chartWidth / Math.max(barData.length, 1) - 22;

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
              height={Math.max(barHeight, 0)}
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
}

function DonutChart({ current, target }: { current: number; target: number }) {
  const width = 210;
  const height = 98;
  const cx = width / 2;
  const cy = 95;
  const radius = 70;
  const strokeWidth = 24;
  const percentage = target > 0 ? Math.min(current / target, 1) : 0;
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
          {target > 0 ? `${Math.round(percentage * 100)}%` : "—"}
        </Text>
        <Text x={cx - 28} y={cy - 6} style={{ fontSize: 9, color: PDF_THEME.muted }}>
          {`${current} / ${target > 0 ? target : "—"}`}
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
}

function YouthJobsTrendChart({ points: series }: { points: { year: string; total: number }[] }) {
  const width = 220;
  const height = 94;
  const padding = 20;
  const maxValue = Math.max(...series.map((d) => d.total), 1);
  const stepX = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
  const points = series
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
        {series.length > 1 ? <Path d={`M ${points}`} stroke={PDF_THEME.primary} strokeWidth={2} fill="none" /> : null}
        {series.map((d, i) => {
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
      <Text style={{ fontSize: 8, color: PDF_THEME.muted }}>Jobs created over the years</Text>
    </View>
  );
}

export const ReportPDF = ({ report }: { report?: ReportDownloadRow | null }) => {
  const content = { ...emptyContent, ...report?.content, jobsByYear: report?.content?.jobsByYear ?? [], gender: report?.content?.gender ?? [] };
  const reportTitle = content.title || report?.name?.trim() || "Flagship Report";
  const female = content.gender.find((row) => row.name === "Female")?.value ?? 0;
  const male = content.gender.find((row) => row.name === "Male")?.value ?? 0;
  const revenueStat = content.stats.find((stat) => /revenue/i.test(stat.label));
  const highlightNotes = content.notes.slice(0, 3);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{reportTitle}</Text>
          <View style={[styles.titleUnderline, { borderBottomColor: PDF_THEME.primary }]} />
        </View>

        <View style={styles.kpiRow}>
          {(content.stats.length > 0 ? content.stats : [{ label: "No figures recorded", value: "—" }]).map((kpi, index) => (
            <View
              key={kpi.label}
              style={[styles.kpiCard, { backgroundColor: KPI_TONES[index % KPI_TONES.length] }]}
            >
              <Text style={[styles.kpiValue, { color: PDF_THEME.text }]}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.mainGrid}>
          <View style={styles.leftCol}>
            <Text style={styles.sectionTitle}>Project Description</Text>
            <Text style={styles.description}>
              {content.description || "No description is recorded for this flagship."}
            </Text>
            {content.startDate ? <Text style={styles.listItem}>Start: {content.startDate}</Text> : null}
            {content.endDate ? <Text style={styles.listItem}>End: {content.endDate}</Text> : null}
            {revenueStat ? (
              <Text style={[styles.largeAmount, { color: PDF_THEME.success }]}>
                {revenueStat.label}: {revenueStat.value}
              </Text>
            ) : null}
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.sectionTitle}>Jobs Created by Gender</Text>
            {content.gender.length > 0 ? (
              <BarChart slices={content.gender} />
            ) : (
              <Text style={styles.listItem}>Jobs are not split by gender for this flagship.</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.mainGrid}>
          <View style={styles.leftCol}>
            <Text style={styles.sectionTitle}>Progress Versus Target: Jobs for Youth</Text>
            <DonutChart current={content.jobsCreated} target={content.jobsTarget ?? 0} />
            {content.jobsByYear.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 6, marginBottom: 4 }]}>
                  Jobs Created for Youth (Trend)
                </Text>
                <YouthJobsTrendChart points={content.jobsByYear} />
              </>
            ) : null}
            <Text style={[styles.sectionTitle, { marginTop: 6, marginBottom: 4 }]}>Youth Impact Snapshot</Text>
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: PDF_THEME.success }]}>
                <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Metric</Text>
                <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Value</Text>
              </View>
              <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softGreen }]}>
                <Text style={styles.tableCell}>Jobs created</Text>
                <Text style={styles.tableCell}>{content.jobsCreated.toLocaleString("en-US")}</Text>
              </View>
              <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softBlue }]}>
                <Text style={styles.tableCell}>Female</Text>
                <Text style={styles.tableCell}>{female.toLocaleString("en-US")}</Text>
              </View>
              <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softOrange }]}>
                <Text style={styles.tableCell}>Male</Text>
                <Text style={styles.tableCell}>{male.toLocaleString("en-US")}</Text>
              </View>
              <View style={[styles.tableRow, { backgroundColor: "#F3F4F6" }]}>
                <Text style={styles.tableCell}>Jobs target completion</Text>
                <Text style={styles.tableCell}>{content.jobsPercent == null ? "—" : `${content.jobsPercent}%`}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.verticalDivider, { backgroundColor: PDF_THEME.border }]} />

          <View style={styles.rightCol}>
            <Text style={styles.sectionTitle}>Value chain</Text>
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: PDF_THEME.primary }]}>
                <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Value chain</Text>
              </View>
              <View style={[styles.tableRow, { backgroundColor: PDF_THEME.softBlue }]}>
                <Text style={styles.tableCell}>{content.valueChains || "None recorded"}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Funders</Text>
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: PDF_THEME.warning }]}>
                <Text style={[styles.tableHeaderCell, { color: "#FFFFFF" }]}>Funder</Text>
              </View>
              {(content.funders.length > 0 ? content.funders : ["None recorded"]).map((name, index) => (
                <View
                  key={name}
                  style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? PDF_THEME.softOrange : PDF_THEME.softGreen }]}
                >
                  <Text style={styles.tableCell}>{name}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 4 }]}>Implementation Locations</Text>
            {content.locations.length === 0 ? (
              <Text style={styles.listItem}>No locations are recorded for this flagship.</Text>
            ) : (
              content.locations.map((location) => (
                <Text key={location.province} style={styles.listItem}>
                  • {location.province} - {location.districts}
                </Text>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 4 }]}>Progress notes</Text>
            {highlightNotes.length === 0 ? (
              <Text style={styles.listItem}>No progress note is recorded for this flagship.</Text>
            ) : (
              highlightNotes.map((note, idx) => (
                <View
                  key={`${note.when}-${idx}`}
                  style={[
                    styles.highlightRow,
                    {
                      backgroundColor:
                        idx === 0 ? PDF_THEME.softBlue : idx === 1 ? PDF_THEME.softGreen : PDF_THEME.softOrange,
                    },
                  ]}
                >
                  <Text style={styles.highlightText}>
                    {note.when ? `${note.when} — ` : ""}{note.text}
                  </Text>
                </View>
              ))
            )}
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
