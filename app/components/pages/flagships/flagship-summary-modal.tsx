"use client";

import { Card, Chip } from "@heroui/react";
import { IconPointFilled, IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";

import {
  flagshipDetailFarmersByGender,
  flagshipDetailFarmersTotal,
  flagshipDetailHighlights,
  flagshipDetailInvestmentSplit,
  flagshipDetailJobsByGender,
  flagshipDetailJobsCreatedTotal,
  flagshipDetailJobsCurrent,
  flagshipDetailJobsTarget,
  flagshipDetailKpis,
  flagshipDetailLocations,
  flagshipDetailTeam,
  flagshipDummyData,
  getFlagshipDetailIntro,
} from "~/data/dummy-flagship-detail";

interface FlagshipSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  flagshipId?: number;
  fallbackName?: string | null;
}

function findKpi(id: "invest" | "revenue" | "income") {
  return flagshipDetailKpis.find((item) => item.id === id);
}

function getHighlightTone(tone: "accent" | "success" | "warning" | "muted") {
  if (tone === "accent") return { bg: "#f0fdf4", color: "#3f6212", marker: "✓" };
  if (tone === "success") return { bg: "#eff6ff", color: "#1d4ed8", marker: "✓" };
  if (tone === "warning") return { bg: "#fff7ed", color: "#9a3412", marker: "⚠" };
  return { bg: "#262a2f", color: "#d1d5db", marker: "•" };
}

export default function FlagshipSummaryModal({
  isOpen,
  onClose,
  flagshipId,
  fallbackName,
}: FlagshipSummaryModalProps) {
  if (!isOpen) return null;

  const listItem = flagshipDummyData.find((item) => Number(item.id) === Number(flagshipId));
  const intro = getFlagshipDetailIntro(flagshipId, fallbackName ?? listItem?.title);
  const investmentKpi = findKpi("invest");
  const revenueKpi = findKpi("revenue");
  const incomeKpi = findKpi("income");
  const jobsPercent = Math.max(0, Math.min(100, Math.round((flagshipDetailJobsCurrent / flagshipDetailJobsTarget) * 100)));
  const valueChains = (listItem?.valueChain ?? "Tomato, Cucumber, Chili")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/65 p-4 md:items-center">
      <Card className="w-full max-w-[1180px] rounded-2xl border border-white/10 bg-[#1f2226] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3 md:px-5">
          <div>
            <Chip size="sm" variant="flat" className="h-6 rounded-md bg-[color:var(--accent)]/25 px-2 text-[11px] text-white">
              Flagship Project
            </Chip>
            <h2 className="mt-2 text-2xl font-bold leading-tight md:text-[38px]">{intro.displayTitle}</h2>
            <p className="text-base font-semibold text-white/70">
              Rwanda · 2020-2026 · {valueChains.join(" & ")} value chains
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/20 p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close flagship summary"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-4 md:p-5">
          <SummaryKpi title="Total investment" value={investmentKpi?.stat} suffix="RWF" />
          <SummaryKpi title="Revenue" value={revenueKpi?.stat} suffix="" />
          <SummaryKpi title="Youth net income / mo" value={incomeKpi?.stat} suffix="RWF" />
          <SummaryKpi title="Acreage used" value="4" suffix="/ 7 ha" />
        </div>

        <div className="grid gap-3 px-4 pb-3 md:grid-cols-3 md:px-5">
          <SummaryBlock title="Gender breakdown">
            <StatLine label="Jobs - Female" value={`${flagshipDetailJobsByGender[0]?.value ?? 0}`} percent="60%" color="#0ea5e9" />
            <StatLine label="Jobs - Male" value={`${flagshipDetailJobsByGender[1]?.value ?? 0}`} percent="40%" color="#f59e0b" />
            <StatLine label="Farmers - Female" value={`${flagshipDetailFarmersByGender[0]?.value ?? 0}`} percent="60%" color="#14b8a6" />
            <StatLine label="Farmers - Male" value={`${flagshipDetailFarmersByGender[1]?.value ?? 0}`} percent="40%" color="#f59e0b" />
            <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-sm">
              <div className="text-white/80">Total jobs · {flagshipDetailJobsCreatedTotal}</div>
              <ProgressBar color="#f59e0b" width="100%" />
              <div className="text-white/80">Total farmers · {flagshipDetailFarmersTotal}</div>
              <ProgressBar color="#14b8a6" width="60%" />
            </div>
          </SummaryBlock>

          <SummaryBlock title="Progress & investment">
            <div className="flex items-center justify-between text-sm font-semibold text-white/90">
              <span>Youth jobs vs target</span>
              <span>
                {flagshipDetailJobsCurrent} / {flagshipDetailJobsTarget}
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar color="#0ea5e9" width={`${jobsPercent}%`} />
              <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                <span>0</span>
                <span>{jobsPercent}% achieved</span>
                <span>{flagshipDetailJobsTarget}</span>
              </div>
            </div>

            <h4 className="mt-4 text-sm font-semibold text-white/90">Investment sources</h4>
            <div className="mt-1.5 space-y-1.5">
              {flagshipDetailInvestmentSplit.map((row) => (
                <div key={row.name} className="grid grid-cols-[1fr_110px_auto] items-center gap-2 text-sm">
                  <span className="text-white/85">{row.name.replace(" investment", "")}</span>
                  <ProgressBar color={row.fill} width={`${row.value}%`} />
                  <span className="font-semibold text-white">{row.value}%</span>
                </div>
              ))}
            </div>
          </SummaryBlock>

          <SummaryBlock title="Highlights & constraints">
            <div className="space-y-2">
              {flagshipDetailHighlights.map((item) => {
                const tone = getHighlightTone(item.tone);
                return (
                  <div
                    key={item.id}
                    className="rounded-md border border-white/10 px-2.5 py-2 text-sm"
                    style={{ backgroundColor: tone.bg, color: tone.color }}
                  >
                    <span className="inline-flex items-start gap-1.5">
                      <span>{tone.marker}</span>
                      <span>{item.text}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </SummaryBlock>
        </div>

        <div className="grid gap-3 px-4 pb-4 md:grid-cols-3 md:px-5 md:pb-5">
          <SummaryBlock title="Value chains">
            <div className="flex flex-wrap gap-2">
              {valueChains.map((value, index) => (
                <Chip
                  key={value}
                  size="sm"
                  variant="flat"
                  className="rounded-full border px-2 text-sm"
                  style={{
                    borderColor: index === 0 ? "#f97316" : index === 1 ? "#84cc16" : "#f59e0b",
                    color: index === 0 ? "#f97316" : index === 1 ? "#84cc16" : "#f59e0b",
                    backgroundColor: "#fff",
                  }}
                >
                  {value}
                </Chip>
              ))}
            </div>
          </SummaryBlock>

          <SummaryBlock title="Implementation locations">
            <div className="space-y-2">
              {flagshipDetailLocations.slice(0, 3).map((row) => (
                <div key={row.id} className="rounded-md border border-white/20 px-2.5 py-2 leading-snug">
                  <p className="font-semibold text-white">{row.province}</p>
                  <p className="text-sm text-white/80">{row.detail}</p>
                </div>
              ))}
            </div>
          </SummaryBlock>

          <SummaryBlock title="Team">
            <div className="space-y-2">
              {flagshipDetailTeam.slice(0, 4).map((member) => (
                <div key={member.id} className="flex items-center gap-2 rounded-full bg-[#2a2d31] px-2.5 py-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e8f4ff] text-[11px] font-bold text-[#0f172a]">
                    {member.initials}
                  </span>
                  <span className="text-sm font-semibold text-white">{member.name}</span>
                </div>
              ))}
            </div>
          </SummaryBlock>
        </div>
      </Card>
    </div>
  );
}

function SummaryKpi({
  title,
  value,
  suffix,
}: {
  title: string;
  value?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#262a2f] p-3">
      <p className="text-sm text-white/80">{title}</p>
      <p className="mt-1 text-[38px] font-bold leading-none text-white">
        {value ?? "-"}
        {suffix ? <span className="ml-1 text-sm font-semibold text-white/70">{suffix}</span> : null}
      </p>
    </div>
  );
}

function SummaryBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#262a2f] p-3">
      <h3 className="mb-2 text-[26px] font-bold leading-none tracking-tight text-white/95">{title}</h3>
      {children}
    </div>
  );
}

function StatLine({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: string;
  percent: string;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 py-0.5 text-sm">
      <IconPointFilled size={14} style={{ color }} />
      <span className="text-white/80">{label}</span>
      <span className="text-xl font-bold leading-none" style={{ color }}>
        {value}
      </span>
      <span className="font-semibold text-white/80">{percent}</span>
    </div>
  );
}

function ProgressBar({ color, width }: { color: string; width: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-black/25">
      <div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
    </div>
  );
}
