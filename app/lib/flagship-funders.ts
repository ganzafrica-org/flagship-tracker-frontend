export interface FundingContributionLike {
  name?: string | null;
}

/** Split `funders` text into display names (comma-separated, paren- and dash-aware). */
export function parseFunderNames(funders: string | null | undefined): string[] {
  if (!funders?.trim()) return [];

  let text = funders.trim();
  const semiIdx = text.indexOf(";");
  if (semiIdx >= 0) {
    text = text.slice(0, semiIdx).trim();
  }

  const dashSplit = text.split(/\s[—–]\s/);
  text = dashSplit[0]?.trim() ?? text;

  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of text) {
    if (char === "(") depth++;
    else if (char === ")") depth = Math.max(0, depth - 1);
    else if (char === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());

  return parts
    .map((part) => {
      const parenIdx = part.indexOf("(");
      return (parenIdx >= 0 ? part.slice(0, parenIdx) : part).trim();
    })
    .filter(Boolean);
}

function contributionsLookReliable(contributions: FundingContributionLike[]): boolean {
  if (contributions.length === 0) return false;
  return !contributions.some((c) => {
    const name = c.name?.trim() ?? "";
    return name.includes("(") && !name.includes(")");
  });
}

function isCompositeFundingLine(funders: string): boolean {
  return /\([^)]*\b(USD|RWF|EUR|GBP)\b/i.test(funders);
}

/** Count funders for list cards (comma-separated names; ignores commas inside parentheses). */
export function countFunders(
  funders: string | null | undefined,
  contributions?: FundingContributionLike[],
): number {
  if (!funders?.trim()) {
    const fromContributions = (contributions ?? [])
      .map((c) => c.name?.trim())
      .filter((name): name is string => Boolean(name));

    if (fromContributions.length > 0 && contributionsLookReliable(contributions ?? [])) {
      return new Set(fromContributions).size;
    }
    return 0;
  }

  const parsed = parseFunderNames(funders);
  if (parsed.length === 0) return 1;

  if (parsed.length > 1 && isCompositeFundingLine(funders)) {
    return 1;
  }

  return parsed.length;
}
