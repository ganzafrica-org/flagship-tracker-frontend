import { Card, Dropdown } from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  IconCaretDownFilled,
  IconChartBar,
  IconCoin,
  IconDotsVertical,
  IconMapPin,
  IconRuler,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

import { PageTitleCard } from "~/components/page-title-card";
import { StatCard } from "~/components/stat-card";
import {
  CHART,
  flagshipDetailAcreageData,
  flagshipDetailFarmersByGender,
  flagshipDetailFarmersTotal,
  flagshipDetailGenderCardAccents,
  flagshipDetailHighlights,
  flagshipDetailInvestmentSplit,
  getHighlightRowBackground,
  getFlagshipDetailIntro,
  flagshipDetailJobsByGender,
  flagshipDetailJobsGauge,
  flagshipDetailJobsCurrent,
  flagshipDetailJobsPerChain,
  flagshipDetailJobsCreatedTotal,
  flagshipDetailJobsTarget,
  flagshipDetailKpis,
  flagshipDetailLocations,
  flagshipDetailQuantitiesByChain,
  flagshipDetailRevenueByChain,
  flagshipDetailTeam,
} from "~/data/dummy-flagship-detail";
import type { Flagship } from "~/lib/queries/flagships";

interface SingleFlagshipDetailsProps {
  flagship?: Flagship | null;
  /** Route param id from flagship list (`/flagships/:id`) — selects intro copy in `getFlagshipDetailIntro`. */
  flagshipPageId?: number;
  onViewSummaryPress?: () => void;
}

const motionFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

/** Same soft tints as KPI / team rows (`app.css` `*-icon-bg`), not saturated `bg-* /10`. */
function TeamRowActionsMenu({ memberName, memberId }: { memberName: string; memberId: string }) {
  return (
    <Dropdown>
      <Dropdown.Trigger
        className="flex h-8 w-8 cursor-default items-center justify-center rounded-md p-0 text-(--muted) outline-none hover:bg-black/5 hover:text-(--foreground) pressed:bg-black/10 dark:hover:bg-white/10 dark:pressed:bg-white/15"
        aria-label={`Actions for ${memberName}`}
      >
        <IconDotsVertical size={16} />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom end"
        offset={4}
        className="min-w-[11rem] rounded-lg border border-(--separator) bg-white p-1 shadow-lg outline-none dark:bg-(--field-background)"
      >
        <Dropdown.Menu
          aria-label={`Actions for ${memberName}`}
          onAction={(key) => {
            switch (key) {
              case "view-details":
                console.info("[Team]", memberId, "View details", memberName);
                break;
              case "update":
                console.info("[Team]", memberId, "Update", memberName);
                break;
              case "delete":
                if (
                  typeof window !== "undefined" &&
                  window.confirm(`Remove ${memberName} from this flagship team?`)
                ) {
                  console.info("[Team]", memberId, "Delete", memberName);
                }
                break;
              default:
                break;
            }
          }}
        >
          <Dropdown.Item id="view-details" textValue="View details">
            View details
          </Dropdown.Item>
          <Dropdown.Item id="update" textValue="Update">
            Update
          </Dropdown.Item>
          <Dropdown.Item id="delete" textValue="Delete" className="text-danger">
            Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function findKpi(id: (typeof flagshipDetailKpis)[number]["id"]) {
  const k = flagshipDetailKpis.find((x) => x.id === id);
  if (!k) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return k;
}

function KpiStatCard({
  k,
  className,
}: {
  k: (typeof flagshipDetailKpis)[number];
  className?: string;
}) {
  return (
    <StatCard
      className={className}
      color={k.color}
      iconBackground={k.iconBackground}
      icon={
        k.id === "invest" || k.id === "revenue" ? (
          <IconCoin size={20} />
        ) : k.id === "acreage" ? (
          <IconRuler size={20} />
        ) : (
          <IconChartBar size={20} />
        )
      }
      stat={k.stat}
      label={k.label}
      statDescription={"statSuffix" in k ? k.statSuffix : undefined}
    />
  );
}

export function SingleFlagshipDetails({
  flagship,
  flagshipPageId,
  onViewSummaryPress,
}: SingleFlagshipDetailsProps) {
  const intro = getFlagshipDetailIntro(flagshipPageId, flagship?.name);
  const jobsYears = flagshipDetailJobsPerChain.map((row) => row.year);
  const revenueYears = flagshipDetailRevenueByChain.map((row) => row.year);
  const quantityYears = flagshipDetailQuantitiesByChain.map((row) => row.year);
  const investmentYears = jobsYears;

  const [jobsYear, setJobsYear] = useState(jobsYears[jobsYears.length - 1] ?? "2026");
  const [investmentYear, setInvestmentYear] = useState(
    investmentYears[investmentYears.length - 1] ?? "2026",
  );
  const [revenueYear, setRevenueYear] = useState(revenueYears[revenueYears.length - 1] ?? "2026");
  const [quantityYear, setQuantityYear] = useState(quantityYears[quantityYears.length - 1] ?? "2026");

  const jobsChartData = useMemo(
    () => flagshipDetailJobsPerChain.filter((row) => Number(row.year) <= Number(jobsYear)),
    [jobsYear],
  );
  const revenueChartData = useMemo(
    () => flagshipDetailRevenueByChain.filter((row) => Number(row.year) <= Number(revenueYear)),
    [revenueYear],
  );
  const quantityChartData = useMemo(
    () => flagshipDetailQuantitiesByChain.filter((row) => Number(row.year) <= Number(quantityYear)),
    [quantityYear],
  );
  const investmentChartData = useMemo(() => {
    const multipliers: Record<string, number> = {
      "2020": 0.7,
      "2021": 0.82,
      "2022": 0.9,
      "2023": 1,
      "2024": 1.1,
      "2025": 1.2,
      "2026": 1.3,
    };
    const factor = multipliers[investmentYear] ?? 1;

    return flagshipDetailInvestmentSplit.map((row) => ({
      ...row,
      value: Math.round(row.value * factor),
    }));
  }, [investmentYear]);

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title={intro.displayTitle}
        actionLabel="Generate Report"
        onActionPress={onViewSummaryPress}
      />

      <motion.div
        {...motionFade}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:items-stretch"
      >
        {/* Left: 2×2 KPI block — height follows the gender cards on lg */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 lg:min-h-0 auto-rows-fr">
          <div className="min-h-0 flex flex-col">
            <KpiStatCard k={findKpi("invest")} className="h-full min-h-0" />
          </div>
          <div className="min-h-0 flex flex-col">
            <KpiStatCard k={findKpi("acreage")} className="h-full min-h-0" />
          </div>
          <div className="min-h-0 flex flex-col">
            <KpiStatCard k={findKpi("revenue")} className="h-full min-h-0" />
          </div>
          <div className="min-h-0 flex flex-col">
            <KpiStatCard k={findKpi("income")} className="h-full min-h-0" />
          </div>
        </div>
        <div className="lg:col-span-1 min-h-[240px] lg:min-h-0 flex flex-col">
          <GenderBigCard
            accent={flagshipDetailGenderCardAccents.jobs}
            stat={flagshipDetailJobsCreatedTotal}
            label="Jobs Created by Gender"
            data={flagshipDetailJobsByGender}
            variant="donut"
          />
        </div>
        <div className="lg:col-span-1 min-h-[240px] lg:min-h-0 flex flex-col">
          <GenderBigCard
            accent={flagshipDetailGenderCardAccents.farmers}
            stat={flagshipDetailFarmersTotal}
            label="Total Farmers by Gender"
            data={flagshipDetailFarmersByGender}
            variant="pie"
          />
        </div>
      </motion.div>

      <motion.div {...motionFade} transition={{ duration: 0.25, delay: 0.05 }}>
        <Card className="w-full min-w-0">
          <Card.Content className="flex w-full min-w-0 flex-col gap-6 p-6">
            <div className="w-full min-w-0 space-y-3">
              <h3 className="w-full text-base font-bold text-(--foreground)">
                {intro.descriptionHeading}
              </h3>
              <p className="w-full min-w-0 text-base leading-snug text-(--muted)">
                {intro.segments.map((segment, i) =>
                  segment.emphasis ? (
                    <strong key={i} className="font-semibold text-(--foreground)">
                      {segment.text}
                    </strong>
                  ) : (
                    <span key={i}>{segment.text}</span>
                  ),
                )}
              </p>
            </div>
            <div className="w-full min-w-0">
              <h3 className="mb-5 text-base font-bold text-(--foreground)">Implementation Locations</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
                {flagshipDetailLocations.map((loc) => (
                  <div key={loc.id} className="flex items-start gap-2.5">
                    <IconMapPin
                      size={20}
                      stroke={1.35}
                      className="mt-0.5 shrink-0 text-(--accent) opacity-80"
                      aria-hidden
                    />
                    <div className="min-w-0 text-sm font-normal leading-snug text-(--foreground)">
                      <p>{loc.province}</p>
                      <p>{loc.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        {...motionFade}
        transition={{ duration: 0.25, delay: 0.12 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <Card>
          <Card.Header>
            <Card.Title>Progress Vers Target: Jobs for Youth</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <div className="flex w-full min-w-0 flex-col items-stretch">
              <div className="relative h-[200px] w-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                    <Pie
                      data={[
                        {
                          name: "Actual Jobs for youth",
                          value: flagshipDetailJobsCurrent,
                          fill: flagshipDetailJobsGauge.actualFill,
                        },
                        {
                          name: "Total Target Jobs for youth",
                          value: Math.max(0, flagshipDetailJobsTarget - flagshipDetailJobsCurrent),
                          fill: flagshipDetailJobsGauge.trackFill,
                        },
                      ]}
                      dataKey="value"
                      stroke="none"
                      startAngle={180}
                      endAngle={0}
                      cx="50%"
                      cy="82%"
                      innerRadius={60}
                      outerRadius={108}
                    >
                      <Cell fill={flagshipDetailJobsGauge.actualFill} />
                      <Cell fill={flagshipDetailJobsGauge.trackFill} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute left-[calc(50%-106px)] top-[calc(82%-2px)] text-xs text-(--muted)">
                  0
                </div>
                <div className="pointer-events-none absolute left-[calc(50%+106px)] top-[calc(82%-2px)] -translate-x-full text-xs text-(--muted)">
                  {flagshipDetailJobsTarget}
                </div>
                <div
                  className="pointer-events-none absolute left-1/2 top-[82%] -translate-x-1/2 -translate-y-1/2 -mt-5"
                  aria-hidden
                >
                  <span className="text-3xl font-bold text-(--foreground)">
                    {flagshipDetailJobsCurrent}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-(--foreground)">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: flagshipDetailJobsGauge.trackFill }}
                    aria-hidden
                  />
                  Total Target Jobs for youth
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: flagshipDetailJobsGauge.actualFill }}
                    aria-hidden
                  />
                  Actual Jobs for youth
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Acreage Progress</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <div className="relative h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200} minWidth={0}>
                <PieChart>
                  <Pie
                    data={flagshipDetailAcreageData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {flagshipDetailAcreageData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-6">
                <span className="text-xl font-bold text-(--foreground)">4 ha</span>
              </div>
            </div>
            <p className="text-center text-xs text-(--muted)">of 7 ha total</p>
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        {...motionFade}
        transition={{ duration: 0.25, delay: 0.14 }}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Jobs created per value chain</Card.Title>
            <div className="flex items-center gap-2">
              <span className="text-xs text-(--muted)">Year</span>
              <YearDropdown value={jobsYear} options={jobsYears} onChange={setJobsYear} ariaLabel="Jobs year" />
            </div>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <LineChart data={jobsChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke={CHART.grid} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tomato" name="Tomato" stroke={CHART.accent} strokeWidth={2} />
                <Line type="monotone" dataKey="cucumber" name="Cucumber" stroke={CHART.warning} strokeWidth={2} />
                <Line type="monotone" dataKey="chili" name="Chili" stroke={CHART.success} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Disaggregation of Total Investment</Card.Title>
            <YearDropdown
              value={investmentYear}
              options={investmentYears}
              onChange={setInvestmentYear}
              ariaLabel="Investment year"
            />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <PieChart>
                <Pie
                  data={investmentChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {investmentChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Revenue by Value Chain over the Years</Card.Title>
            <YearDropdown
              value={revenueYear}
              options={revenueYears}
              onChange={setRevenueYear}
              ariaLabel="Revenue year"
            />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <LineChart data={revenueChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="tomato" name="Tomato" stroke={CHART.accent} strokeWidth={2} />
                <Line type="monotone" dataKey="cucumber" name="Cucumber" stroke={CHART.warning} strokeWidth={2} />
                <Line type="monotone" dataKey="chili" name="Chili" stroke={CHART.success} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Quantities produced per Value Chain</Card.Title>
            <YearDropdown
              value={quantityYear}
              options={quantityYears}
              onChange={setQuantityYear}
              ariaLabel="Quantity year"
            />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <BarChart data={quantityChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="tomato" name="Tomato" fill={CHART.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cucumber" name="Cucumber" fill={CHART.warning} radius={[4, 4, 0, 0]} />
                <Bar dataKey="chili" name="Chili" fill={CHART.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        {...motionFade}
        transition={{ duration: 0.25, delay: 0.16 }}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <Card>
          <Card.Header>
            <Card.Title>Team Managing the Flagship</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <div
              className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] items-center gap-2 px-1 pb-2 text-sm font-semibold text-(--foreground)"
            >
              <span>Profile</span>
              <span className="text-center">Email</span>
              <span className="w-10 shrink-0 text-right pr-0.5">Action</span>
            </div>
            <ul className="m-0 list-none space-y-2 p-0">
              {flagshipDetailTeam.map((member) => (
                <li
                  key={member.id}
                  className="rounded-xl border border-(--separator) shadow-sm"
                  style={{ backgroundColor: member.rowBackgroundColor }}
                >
                  <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none text-white"
                        style={{ backgroundColor: member.avatarColor }}
                        aria-hidden
                      >
                        {member.initials}
                      </div>
                      <span className="truncate text-sm font-semibold text-(--foreground)">{member.name}</span>
                    </div>
                    <div className="min-w-0 truncate text-center text-xs text-(--muted)">
                      {member.email}
                    </div>
                    <div className="flex justify-end">
                      <TeamRowActionsMenu memberName={member.name} memberId={String(member.id)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-row items-start justify-between gap-2">
            <Card.Title>Flagship Key Highlights and Binding constraints</Card.Title>
            <button
              type="button"
              className="p-1 rounded-md text-(--muted) hover:bg-(--default)"
              aria-label="Close"
            >
              <IconX size={18} />
            </button>
          </Card.Header>
          <Card.Content className="space-y-2 p-4 pt-0">
            {flagshipDetailHighlights.map((h) => (
              <div
                key={h.id}
                className="relative rounded-lg border border-(--separator) px-3 py-2 pr-9 text-sm leading-snug text-(--foreground)"
                style={{ backgroundColor: getHighlightRowBackground(h.tone) }}
              >
                {h.text}
                <button
                  type="button"
                  className="absolute top-1.5 right-1.5 rounded p-0.5 text-(--muted) hover:text-(--foreground)"
                  aria-label="Dismiss"
                >
                  <IconX size={14} />
                </button>
              </div>
            ))}
          </Card.Content>
        </Card>
      </motion.div>
    </div>
  );
}

function YearDropdown({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: string[];
  onChange: (year: string) => void;
  ariaLabel: string;
}) {
  return (
    <Dropdown>
      <Dropdown.Trigger
        className="flex min-w-[96px] items-center justify-between rounded-xl border border-(--separator) bg-(--surface) px-3 py-1.5 text-sm text-(--muted) hover:bg-(--default)"
        aria-label={ariaLabel}
      >
        <span>{value}</span>
        <IconCaretDownFilled size={16} className="shrink-0 text-(--muted)" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="rounded-xl border border-(--separator) bg-(--surface) p-0">
        <Dropdown.Menu
          aria-label={ariaLabel}
          className="py-1"
          selectedKeys={[value]}
          selectionMode="single"
          disallowEmptySelection
          onAction={(key) => onChange(String(key))}
        >
          {options.map((year) => (
            <Dropdown.Item
              key={year}
              id={year}
              textValue={year}
              className="min-h-0 px-3 py-1.5 text-sm leading-tight"
            >
              {year}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** Gender KPI + chart card (reference layout: icon + stat row, centered label, no side stripe). */
function GenderBigCard({
  accent,
  stat,
  label,
  data,
  variant,
}: {
  accent: { icon: string; iconSoft: string };
  stat: string;
  label: string;
  data: { name: string; value: number; fill: string }[];
  variant: "donut" | "pie";
}) {
  const innerRadius = variant === "donut" ? "48%" : 0;
  const outerRadius = "68%";

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl p-0">
      <div className="shrink-0 px-4 pt-3 pb-1">
        <div className="flex flex-row items-center gap-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: accent.iconSoft }}
          >
            <span style={{ color: accent.icon }}>
              <IconUsers size={18} stroke={2} />
            </span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-(--foreground)">{stat}</span>
        </div>
        <p className="mt-1 text-center text-xs text-(--muted) leading-snug">{label}</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-2 pb-3 pt-0 min-h-[132px]">
        <div className="h-[132px] w-full shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="40%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={variant === "donut" ? 1.5 : 0}
                stroke="none"
                label={(props: PieLabelRenderProps) => {
                  const { x, y, value, textAnchor, payload } = props;
                  if (value == null || x == null || y == null) return null;
                  const fill =
                    payload && typeof payload === "object" && "fill" in payload
                      ? String((payload as { fill: string }).fill)
                      : "#334155";
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={fill}
                      fontSize={10}
                      fontWeight={600}
                      textAnchor={textAnchor ?? "middle"}
                      dominantBaseline="central"
                    >
                      {String(value)}
                    </text>
                  );
                }}
                labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11, paddingLeft: 2, color: "var(--foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
