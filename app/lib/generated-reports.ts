import { createElement, useSyncExternalStore } from "react";
import { pdf } from "@react-pdf/renderer";

import { ReportPDF } from "~/components/pdf-format/pdf-service";
import type { FlagshipReportContent, ReportDownloadRow } from "~/components/pages/reports/report-download-utils";
import { getStoredUser } from "~/lib/auth";

const STORAGE_KEY = "flagship_generated_reports";
const EVENT = "flagship-reports-updated";
const EMPTY: ReportDownloadRow[] = [];

type StoredReport = ReportDownloadRow & { ownerId: number };

function readAll(): StoredReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredReport[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function notify() {
  window.dispatchEvent(new Event(EVENT));
}

export function saveGeneratedReport(input: {
  ownerId: number;
  createdBy: string;
  content: FlagshipReportContent;
}): ReportDownloadRow {
  const stored: StoredReport = {
    id: Date.now(),
    ownerId: input.ownerId,
    name: input.content.title,
    type: "Flagship",
    period: "Current",
    createdOn: new Date().toLocaleDateString("en-GB"),
    createdBy: input.createdBy,
    origin: "Created Reports",
    content: input.content,
  };
  const next = [stored, ...readAll()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
  const { ownerId: _ownerId, ...row } = stored;
  return row;
}

let cache: { key: string; rows: ReportDownloadRow[] } = { key: "", rows: EMPTY };

export function reportsForUser(ownerId: number): ReportDownloadRow[] {
  const raw = typeof window === "undefined" ? "" : window.localStorage.getItem(STORAGE_KEY) ?? "";
  const key = `${ownerId}:${raw}`;
  if (cache.key === key) return cache.rows;
  const rows = readAll()
    .filter((report) => report.ownerId === ownerId)
    .map(({ ownerId: _ownerId, ...row }) => row);
  cache = { key, rows };
  return rows;
}

export function subscribeReports(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useMyGeneratedReports(ownerId: number): ReportDownloadRow[] {
  return useSyncExternalStore(
    subscribeReports,
    () => reportsForUser(ownerId),
    () => EMPTY,
  );
}

export async function generateFlagshipReport(content: FlagshipReportContent) {
  const user = getStoredUser();
  const report = saveGeneratedReport({
    ownerId: user?.id ?? 0,
    createdBy: user?.fullName?.trim() || user?.email || "Unknown",
    content,
  });
  await downloadReportPdf(report);
}

export async function downloadReportPdf(report: ReportDownloadRow) {
  const blob = await pdf(createElement(ReportPDF, { report })).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = report.name.replace(/[^\w-]+/g, "_") || "flagship-report";
  link.href = url;
  link.download = `${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
