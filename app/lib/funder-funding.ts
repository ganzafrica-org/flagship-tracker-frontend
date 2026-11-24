import type { FlagshipDetailResponse, FundingContribution } from "~/lib/queries/flagships";
import { parseFunderNames } from "~/lib/flagship-funders";

function sameName(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function funderFundsFlagship(flagship: FlagshipDetailResponse, funderName: string) {
  const contributions = flagship.fundingContributions ?? [];
  if (contributions.some((item) => sameName(item.name, funderName))) return true;
  return parseFunderNames(flagship.funders).some((name) => sameName(name, funderName));
}

function formatRwf(amount: number) {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} RWF`;
}

export function formatFundingCommitted(flagships: FlagshipDetailResponse[]) {
  const total = flagships.reduce((sum, flagship) => sum + (flagship.budgetTotalRwf ?? 0), 0);
  return total > 0 ? formatRwf(total) : "—";
}

function amountNumber(raw: string | null) {
  if (!raw?.trim()) return null;
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function contributionLabel(item: FundingContribution) {
  const amount = item.amount?.trim();
  if (!amount) return "";
  return [item.currency, amount].filter(Boolean).join(" ");
}

export function formatFundingProjected(flagships: FlagshipDetailResponse[], funderName: string) {
  const contributions = flagships.flatMap((flagship) =>
    (flagship.fundingContributions ?? []).filter((item) => sameName(item.name, funderName)),
  );
  if (contributions.length === 0) return "—";
  const currencies = new Set(contributions.map((item) => (item.currency ?? "RWF").toUpperCase()));
  const amounts = contributions.map((item) => amountNumber(item.amount));
  if (currencies.size === 1 && amounts.every((value) => value != null)) {
    const currency = [...currencies][0];
    const total = amounts.reduce((sum, value) => sum + (value ?? 0), 0);
    return `${total.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
  }
  return contributions.map(contributionLabel).filter(Boolean).join("; ") || "—";
}

export function funderFundingSummary(flagships: FlagshipDetailResponse[], funderName: string) {
  const linked = flagships.filter((flagship) => funderFundsFlagship(flagship, funderName));
  return {
    flagships: linked.map((flagship) => flagship.flagshipName).join(", ") || "—",
    fundingCommitted: formatFundingCommitted(linked),
    fundingProjected: formatFundingProjected(linked, funderName),
  };
}
