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
    Circle,
    Path,
} from "@react-pdf/renderer";
import { styles } from "./style";
import { barChartData, revenueData, quantityData, donutData } from "./data";

const BarChart = () => {
    const width = 200;
    const height = 150;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = (chartWidth / barChartData.length) - 10;
    const maxValue = 100;

    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={width} height={height}>
                {/* Y Axis Grid Lines */}
                {[0, 20, 40, 60, 80, 100].map((tick) => (
                    <G key={tick}>
                        <Line
                            x1={padding}
                            y1={height - padding - (tick / maxValue) * chartHeight}
                            x2={width - padding}
                            y2={height - padding - (tick / maxValue) * chartHeight}
                            stroke="#E5E7EB"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                        />
                        <Text
                            x={padding - 5}
                            y={height - padding - (tick / maxValue) * chartHeight + 3}
                            fill="#6B7280"
                            style={{ fontSize: 8 }}
                        >
                            {String(tick)}
                        </Text>
                    </G>
                ))}

                {/* Bars */}
                {barChartData.map((item, index) => {
                    const barHeight = (item.value / maxValue) * chartHeight;
                    return (
                        <Rect
                            key={index}
                            x={padding + index * (barWidth + 10) + 5}
                            y={height - padding - barHeight}
                            width={barWidth}
                            height={barHeight}
                            fill={item.color}
                        />
                    );
                })}

                {/* X Axis */}
                <Line
                    x1={padding}
                    y1={height - padding}
                    x2={width - padding}
                    y2={height - padding}
                    stroke="#9CA3AF"
                    strokeWidth={1}
                />
            </Svg>
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#98D870' }]} />
                    <Text style={styles.chartLabel}>Male</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#61D2E4' }]} />
                    <Text style={styles.chartLabel}>Female</Text>
                </View>
            </View>
        </View>
    );
};

const DonutChart = () => {
    const width = 200;
    const height = 120;
    const cx = width / 2;
    const cy = 95;
    const radius = 70;
    const strokeWidth = 28;
    const percentage = Math.min(donutData.actual / donutData.target, 1);

    // Calculate the arc endpoint based on percentage
    const endX = cx - radius * Math.cos(percentage * Math.PI);
    const endY = cy - radius * Math.sin(percentage * Math.PI);
    const largeArc = 0;

    // Full top semicircle (left → top → right)
    const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

    // Partial arc from left, sweeping clockwise by percentage
    const progressPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;

    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={width} height={height}>
                {/* Background arc */}
                <Path
                    d={bgPath}
                    stroke="#D1D5DB"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Progress arc */}
                {percentage > 0 && (
                    <Path
                        d={progressPath}
                        stroke={donutData.actualColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                    />
                )}
                {/* Percentage label */}
                <Text
                    x={cx - 15}
                    y={cy - 22}
                    fill="#111"
                    style={{ fontSize: 20, fontFamily: 'Helvetica-Bold' }}
                >
                    {`${Math.round(percentage * 100)}%`}
                </Text>
                {/* Actual / Target */}
                <Text
                    x={cx - 18}
                    y={cy - 6}
                    fill="#6B7280"
                    style={{ fontSize: 9 }}
                >
                    {`${donutData.actual} / ${donutData.target}`}
                </Text>
            </Svg>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: donutData.actualColor }]} />
                    <Text style={styles.chartLabel}>Actual Jobs for youth</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#D1D5DB' }]} />
                    <Text style={styles.chartLabel}>Total Target Jobs for youth</Text>
                </View>
            </View>
        </View>
    );
};

export const ReportPDF = () => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Flagships Annual Country Outlook</Text>
                <View style={styles.titleUnderline} />
            </View>

            <View style={styles.mainGrid}>
                <View style={styles.leftCol}>
                    <Text style={styles.description}>
                        The Youth Empowerment in Protected Agriculture (YEPA) project represents a
                        transformative initiative that combines modern greenhouse technology with youth employment
                        opportunities. Focusing on three key value chains: tomato, cucumber, and chili, the project
                        creates sustainable livelihoods while ensuring food security and promoting climate-smart
                        agricultural practices. It serves as a model for scaling protected agriculture across Rwanda,
                        demonstrating how technology and youth empowerment can drive agricultural transformation.
                    </Text>
                    <Text style={styles.largeAmount}>$63,345,678</Text>
                </View>
                <View style={styles.rightCol}>
                    <View style={{ flexDirection: 'row', height: 150 }}>
                        <Text style={{
                            transform: 'rotate(-90deg)',
                            fontSize: 10,
                            color: '#6B7280',
                            position: 'absolute',
                            left: -80,
                            top: 60,
                            width: 150,
                            textAlign: 'center'
                        }}>
                            Flagship reports gender
                        </Text>
                        <BarChart />
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.mainGrid}>
                <View style={styles.leftCol}>
                    <Text style={styles.sectionTitle}>Revenue by Value Chain over the Years</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderCell}>Year</Text>
                            <Text style={styles.tableHeaderCell}>Youth</Text>
                            <Text style={styles.tableHeaderCell}>Revenue (rfw)</Text>
                        </View>
                        {revenueData.map((row, i) => (
                            <View key={i} style={[styles.tableRow, { backgroundColor: row.color, opacity: 0.8 }]}>
                                <Text style={styles.tableCell}>{row.year}</Text>
                                <Text style={styles.tableCell}>{row.youth}</Text>
                                <Text style={styles.tableCell}>{row.revenue}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Quantities produced per Value Chain</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderCell}>Year</Text>
                            <Text style={styles.tableHeaderCell}>Chilli</Text>
                            <Text style={styles.tableHeaderCell}>Tomato</Text>
                        </View>
                        {quantityData.map((row, i) => (
                            <View key={i} style={[styles.tableRow, { backgroundColor: row.color, opacity: 0.8 }]}>
                                <Text style={styles.tableCell}>{row.year}</Text>
                                <Text style={styles.tableCell}>{row.chilli}</Text>
                                <Text style={styles.tableCell}>{row.tomato}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ width: 1, backgroundColor: '#E5E7EB', height: '100%' }} />

                <View style={styles.rightCol}>
                    <Text style={styles.sectionTitle}>Progress Vers Target: Jobs for Youth</Text>
                    <DonutChart />
                </View>
            </View>
        </Page>
    </Document>
);

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