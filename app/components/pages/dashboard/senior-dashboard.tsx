import { useMemo, useState, Suspense, lazy } from "react";
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
  IconBuildingCommunity,
  IconCaretDownFilled,
  IconFlag,
  IconUsers,
} from "@tabler/icons-react";
import { Dropdown } from "@heroui/react";

import { PageTitleCard } from "~/components/page-title-card";
import { StatCard } from "~/components/stat-card";
import { dashboardQueryOptions } from "~/lib/queries/dashboard";
import { individualsQueryOptions } from "~/lib/queries/individuals";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import { CHART } from "~/data/dummy-flagship-detail";
import {
  FLAGSHIP_BAR_COLORS,
  SENIOR_DASHBOARD_YEARS,
  investmentDisaggregation,
  investmentProgress,
  jobsPerFlagshipByYear,
  jobsCreatedByFlagshipForYear,
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
  const flagshipsQuery = useQuery(flagshipsQueryOptions);
  const individualsQuery = useQuery(individualsQueryOptions);

  const lastYear = SENIOR_DASHBOARD_YEARS[SENIOR_DASHBOARD_YEARS.length - 1];
  const [genderYear, setGenderYear] = useState<SeniorDashboardYear>(lastYear);
  const [jobsCreatedYear, setJobsCreatedYear] = useState<SeniorDashboardYear>(lastYear);

  const flagships = flagshipsQuery.data ?? [];
  const individuals = individualsQuery.data ?? [];

  const dashboardStats = useMemo(() => {
    const totalFlagships = flagships.length || seniorDashboardStats.totalFlagships;
    const totalJobsCreated =
      flagships.reduce((sum, f) => sum + Math.max(0, f.jobsCreated ?? 0), 0) ||
      seniorDashboardStats.totalJobsCreated;

    const uniqueInvestors = new Set<string>();
    for (const flagship of flagships) {
      for (const inv of flagship.investments ?? []) {
        const investor = (inv.investorName ?? "").trim();
        if (investor) uniqueInvestors.add(investor.toLowerCase());
      }
      for (const contribution of flagship.fundingContributions ?? []) {
        const name = (contribution.name ?? "").trim();
        if (name) uniqueInvestors.add(name.toLowerCase());
      }
      const funderNames = (flagship.funders ?? "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      for (const name of funderNames) uniqueInvestors.add(name.toLowerCase());
    }

    const totalInvestors = uniqueInvestors.size || seniorDashboardStats.totalInvestors;
    const totalIndividualsRegistered = individuals.length || seniorDashboardStats.totalYouthRegistered;

    return {
      totalFlagships,
      totalJobsCreated,
      totalInvestors,
      totalIndividualsRegistered,
      totalCooperativesEngaged: seniorDashboardStats.totalCooperativesEngaged,
      totalInvestment: seniorDashboardStats.totalInvestment,
    };
  }, [flagships, individuals]);

  const genderData = useMemo(() => {
    if (individuals.length === 0) return youthEmploymentByYear[genderYear];

    const cutoffYear = Number(genderYear);
    let youth = 0;
    let nonYouth = 0;

    for (const individual of individuals) {
      const createdYear = Number((individual.createdAt ?? "").slice(0, 4));
      if (Number.isFinite(createdYear) && createdYear > cutoffYear) continue;

      const category = (individual.youthCategory ?? "").toLowerCase();
      if (category.includes("non")) nonYouth += 1;
      else youth += 1;
    }

    const total = youth + nonYouth;
    if (total === 0) return youthEmploymentByYear[genderYear];

    return [
      { name: "Youth", value: youth, fill: CHART.accent },
      { name: "Non-Youth", value: nonYouth, fill: CHART.warning },
    ];
  }, [genderYear, individuals]);

  const jobsCreatedData = useMemo(() => {
    if (flagships.length === 0) return jobsCreatedByFlagshipForYear(jobsCreatedYear);
    return flagships.map((item) => ({
      flagship: item.flagshipCode || item.flagshipName,
      jobs: Math.max(0, item.jobsCreated ?? 0),
    }));
  }, [flagships, jobsCreatedYear]);

  const jobsForYouthData = jobsPerFlagshipByYear[jobsCreatedYear];

  const investmentSplitData = useMemo(() => {
    if (flagships.length === 0) return investmentDisaggregation;

    const sourceTotals = new Map<string, number>();
    let totalAmount = 0;

    for (const flagship of flagships) {
      for (const inv of flagship.investments ?? []) {
        const source = (inv.sourceType ?? "other").trim() || "other";
        const amount = Number(inv.amountRwf ?? inv.amount ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        sourceTotals.set(source, (sourceTotals.get(source) ?? 0) + amount);
        totalAmount += amount;
      }
    }

    if (totalAmount <= 0 || sourceTotals.size === 0) return investmentDisaggregation;

    const entries = Array.from(sourceTotals.entries()).sort((a, b) => b[1] - a[1]);
    return entries.map(([source, amount], index) => ({
      name: source.charAt(0).toUpperCase() + source.slice(1),
      value: Math.round((amount / totalAmount) * 100),
      fill: FLAGSHIP_BAR_COLORS[index % FLAGSHIP_BAR_COLORS.length],
    }));
  }, [flagships]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
      <PageTitleCard title="Dashboard Overview" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          color="var(--accent)"
          icon={<IconFlag size={20} />}
          stat={dashboardStats.totalFlagships}
          label="Total Flagships"
        />
        <StatCard
          color="var(--warning)"
          icon={<IconBriefcase size={20} />}
          stat={dashboardStats.totalJobsCreated.toLocaleString()}
          label="Total Jobs Created"
        />
        <StatCard
          color="var(--forest)"
          icon={<IconUsers size={20} />}
          stat={dashboardStats.totalInvestors}
          label="Total Investors"
        />
        <StatCard
          color="var(--danger)"
          icon={<IconUsers size={20} />}
          stat={dashboardStats.totalIndividualsRegistered.toLocaleString()}
          label="Total Individuals Registered"
        />
        <StatCard
          color="var(--success)"
          icon={<IconBuildingCommunity size={20} />}
          stat={dashboardStats.totalCooperativesEngaged.toLocaleString()}
          label="Total Cooperatives Engaged"
        />
      </div>

      {/* Charts 2×2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1 — Donut: Youth vs non-youth participation */}
        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Youth vs Non-Youth Participation</Card.Title>
            <YearFilter value={genderYear} onChange={setGenderYear} ariaLabel="Gender year filter" />
          </Card.Header>
          <Card.Content className="p-4 pt-2">
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
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
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* 2 — Column: Jobs Created by Flagships */}
        <Card>
          <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Card.Title>Jobs Created by Flagships</Card.Title>
            <YearFilter value={jobsCreatedYear} onChange={setJobsCreatedYear} ariaLabel="Jobs created year filter" />
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <BarChart data={jobsCreatedData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                <Bar dataKey="jobs" name="Jobs" radius={[4, 4, 0, 0]}>
                  {jobsCreatedData.map((entry, index) => (
                    <Cell key={entry.flagship} fill={FLAGSHIP_BAR_COLORS[index % FLAGSHIP_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* 3 — Column: Number of jobs for youth per flagship */}
        <Card>
          <Card.Header>
            <Card.Title>Number of jobs for youth per flagship</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <BarChart data={jobsForYouthData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="flagship" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                <Bar dataKey="jobs" name="Youth Jobs" radius={[4, 4, 0, 0]}>
                  {jobsForYouthData.map((entry, index) => (
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
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                <Pie
                  data={investmentSplitData}
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
                  {investmentSplitData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value ?? 0)}%`} />
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
              <span className="font-semibold">{dashboardStats.totalInvestment}</span>{" "}
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
