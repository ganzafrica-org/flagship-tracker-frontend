import { useState, Suspense, lazy } from "react";
import { Card, Separator, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconBriefcase,
  IconBuildingBank,
  IconCaretDownFilled,
  IconFlag,
  IconUsers,
} from "@tabler/icons-react";
import { Dropdown } from "@heroui/react";

import { PageTitleCard } from "~/components/page-title-card";
import { StatCard } from "~/components/stat-card";
import { dashboardQueryOptions } from "~/lib/queries/dashboard";
import { CHART } from "~/data/dummy-flagship-detail";
import {
  FLAGSHIP_BAR_COLORS,
  SENIOR_DASHBOARD_YEARS,
  investmentDisaggregation,
  investmentProgress,
  jobsCreatedByFlagshipForYear,
  jobsPerFlagshipByYear,
  seniorDashboardStats,
  youthEmploymentByYear,
} from "~/data/dummy-senior-dashboard";
import type { SeniorDashboardYear } from "~/data/dummy-senior-dashboard";

const RwandaMap = lazy(() => import("~/components/pages/dashboard/rwanda-map"));

// ---------------------------------------------------------------------------
// Year filter dropdown (reusable within this page)
// ---------------------------------------------------------------------------

function YearFilter({
  value,
  onChange,
  ariaLabel,
}: {
  value: SeniorDashboardYear;
  onChange: (year: SeniorDashboardYear) => void;
  ariaLabel: string;
}) {
  return (
    <Dropdown>
      <Dropdown.Trigger
        className="flex min-w-[88px] items-center justify-between gap-2 rounded-xl border border-(--separator) bg-(--surface) px-3 py-1.5 text-sm text-(--muted) hover:bg-(--default)"
        aria-label={ariaLabel}
      >
        <span>{value}</span>
        <IconCaretDownFilled size={14} className="shrink-0 text-(--muted)" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label={ariaLabel}
          selectionMode="single"
          selectedKeys={[value]}
          disallowEmptySelection
          onAction={(key) => onChange(key as SeniorDashboardYear)}
        >
          {SENIOR_DASHBOARD_YEARS.map((year) => (
            <Dropdown.Item key={year} id={year} textValue={year}>
              {year}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}


// ---------------------------------------------------------------------------
// Investment progress row
// ---------------------------------------------------------------------------

function InvestmentProgressList() {
  return (
    <div className="flex flex-col">
      {investmentProgress.map((item, index) => (
        <div key={item.id}>
          {index > 0 && <Separator />}
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--foreground)">{item.flagship}</p>
              <p className="text-xs text-(--muted)">Target: {item.targetLabel}</p>
            </div>
            <span
              className="shrink-0 text-sm font-bold"
              style={{ color: item.status === "percentage" ? "var(--accent)" : "var(--warning)" }}
            >
              {item.status === "percentage" ? `${item.value}%` : "Planning"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SeniorDashboard() {
  const { isLoading } = useQuery(dashboardQueryOptions);

  const lastYear = SENIOR_DASHBOARD_YEARS[SENIOR_DASHBOARD_YEARS.length - 1];
  const [genderYear, setGenderYear] = useState<SeniorDashboardYear>(lastYear);
  const [jobsPerFlagshipYear, setJobsPerFlagshipYear] = useState<SeniorDashboardYear>(lastYear);
  const [jobsCreatedYear, setJobsCreatedYear] = useState<SeniorDashboardYear>(lastYear);

  const genderData = youthEmploymentByYear[genderYear];
  const jobsPerFlagshipData = jobsPerFlagshipByYear[jobsPerFlagshipYear];
  const jobsCreatedData = jobsCreatedByFlagshipForYear(jobsCreatedYear);

  const totalInvestment = investmentDisaggregation.reduce((sum, d) => sum + d.value, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page title — no action */}
      <PageTitleCard title="Dashboard" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          color="var(--accent)"
          icon={<IconFlag size={20} />}
          stat={seniorDashboardStats.totalFlagships}
          label="Total Flagships"
        />
        <StatCard
          color="var(--warning)"
          icon={<IconBriefcase size={20} />}
          stat={seniorDashboardStats.totalJobsCreated.toLocaleString()}
          label="Total Jobs Created"
        />
        <StatCard
          color="var(--forest)"
          icon={<IconUsers size={20} />}
          stat={seniorDashboardStats.totalInvestors}
          label="Total Investors"
        />
        <StatCard
          color="var(--danger)"
          icon={<IconBuildingBank size={20} />}
          stat={seniorDashboardStats.totalInvestment}
          label="Total Investment"
          statDescription="(RWF)"
        />
      </div>

      {/* Charts 2×2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1 — Donut: Gender employment */}
        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Number of Youths Employed (Men vs. Women)</Card.Title>
            <YearFilter value={genderYear} onChange={setGenderYear} ariaLabel="Gender year filter" />
          </Card.Header>
          <Card.Content className="p-4 pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                >
                  {genderData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* 2 — Column: Jobs for Youth per Flagship */}
        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Number of Jobs for Youth per Flagship</Card.Title>
            <YearFilter value={jobsPerFlagshipYear} onChange={setJobsPerFlagshipYear} ariaLabel="Jobs per flagship year filter" />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={jobsPerFlagshipData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="jobs" name="Jobs" radius={[4, 4, 0, 0]}>
                  {jobsPerFlagshipData.map((entry, index) => (
                    <Cell key={entry.flagship} fill={FLAGSHIP_BAR_COLORS[index % FLAGSHIP_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* 3 — Column: Jobs Created by Flagships over years */}
        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Jobs Created by Flagships</Card.Title>
            <YearFilter value={jobsCreatedYear} onChange={setJobsCreatedYear} ariaLabel="Jobs created year filter" />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={jobsCreatedData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="jobs" name="Jobs" radius={[4, 4, 0, 0]}>
                  {jobsCreatedData.map((entry, index) => (
                    <Cell key={entry.flagship} fill={FLAGSHIP_BAR_COLORS[index % FLAGSHIP_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* 4 — Pie: Disaggregation of Total Investment */}
        <Card>
          <Card.Header>
            <Card.Title>Disaggregation of Total Investment</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                <Pie
                  data={investmentDisaggregation}
                  dataKey="value"
                  nameKey="name"
                  cx="40%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                >
                  {investmentDisaggregation.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="pt-2 text-sm text-(--foreground) text-center">
              <span className="font-semibold">{seniorDashboardStats.totalInvestment}</span>{" "}
              (RWF) investment in total
            </p>
          </Card.Content>
        </Card>
      </div>

      {/* Bottom section: map ~65% + investment progress ~35% */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[65fr_35fr]">
        {/* Rwanda map */}
        <Card>
          <Card.Header>
            <Card.Title>Flagships and Where They Are Being Implemented</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <Suspense fallback={<Skeleton className="h-[380px] rounded-xl" />}>
              <RwandaMap />
            </Suspense>
          </Card.Content>
        </Card>

        {/* Investment progress */}
        <Card>
          <Card.Header>
            <Card.Title>Investment Progress</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <InvestmentProgressList />
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
