import { Card, Chip, Popover, Tooltip } from "@heroui/react";
import {
  IconBriefcase,
  IconCalendar,
  IconCoin,
  IconHomeFilled,
  IconPlant2,
  IconUsersGroup,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

import type { FlagshipListItem, FlagshipStatus, FundingContribution } from "~/lib/queries/flagships";
import AppAvatar, { AppAvatarGroup } from "~/components/app-avatar";
import AppProgressBar from "~/components/app-progress-bar";

/** Map flagship status to a progress-bar color. */
function statusToProgressColor(status: FlagshipStatus): "accent" | "success" | "warning" | "danger" {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  if (status === "planning") return "warning";
  return "accent";
}

export type FlagshipCardItem = FlagshipListItem & { icon?: ReactNode };

interface FlagshipsListProps {
  items?: FlagshipCardItem[];
  className?: string;
  cardClassName?: string;
  onViewMore?: (item: FlagshipCardItem) => void;
}

const CARD_CLASS =
  "group relative !rounded-4xl bg-(--surface) p-5 min-h-[300px] h-full shadow-none border border-(--separator) flex flex-col transition-shadow hover:shadow-md";

const STATUS_COLOR: Record<FlagshipStatus, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  planning: "warning",
  suspended: "danger",
  closed: "default",
};

function StatRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13.5px]">
      <span className="text-(--muted) shrink-0">{icon}</span>
      <span className="text-(--muted)">{label}</span>
      <span className="ml-auto font-medium text-(--foreground) truncate text-right">{value}</span>
    </div>
  );
}

/** Funder avatar stack + popover with the full contribution details. */
export function FunderAvatars({ funders }: { funders: FundingContribution[] }) {
  if (funders.length === 0) {
    return <span className="text-[12px] text-(--muted)">No funders recorded</span>;
  }

  return (
    <Popover>
      <Popover.Trigger
        className="inline-flex cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        aria-label={`${funders.length} funder(s) — view details`}
      >
        <AppAvatarGroup
          items={funders.map((f) => ({ name: f.name, color: f.color ?? undefined }))}
          max={3}
          size="sm"
        />
      </Popover.Trigger>
      <Popover.Content className="max-w-xs rounded-xl border border-(--separator) bg-(--surface) p-0 shadow-lg">
        <div className="border-b border-(--separator) px-4 py-2.5 text-sm font-semibold text-(--foreground)">
          Funders ({funders.length})
        </div>
        <ul className="m-0 max-h-64 list-none space-y-0 overflow-auto p-0">
          {funders.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-start gap-3 px-4 py-2.5">
              <AppAvatar name={f.name} size="sm" colorHex={f.color ?? undefined} />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug text-(--foreground)">{f.name}</p>
                {f.amount ? (
                  <p className="text-xs text-(--muted)">
                    {[f.currency, f.amount].filter(Boolean).join(" ")}
                  </p>
                ) : null}
                {f.description ? (
                  <p className="text-xs leading-snug text-(--muted)">{f.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Popover.Content>
    </Popover>
  );
}

function FlagshipListCard({
  item,
  cardClassName,
  onViewMore,
}: {
  item: FlagshipCardItem;
  cardClassName?: string;
  onViewMore?: (item: FlagshipCardItem) => void;
}) {
  return (
    <Card className={`${CARD_CLASS} ${cardClassName ?? ""}`}>
      {/* Header: icon + code/cluster, status chip */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: item.accentColor }}
          >
            {item.icon ?? <IconHomeFilled size={18} stroke={2} />}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-(--foreground) truncate">{item.code}</p>
            <p className="text-[11px] uppercase tracking-wide text-(--muted) truncate">{item.cluster}</p>
          </div>
        </div>
        <Chip size="sm" variant="soft" color={STATUS_COLOR[item.status] ?? "default"}>
          <Chip.Label className="capitalize">{item.status}</Chip.Label>
        </Chip>
      </div>

      {/* Title — clamped, full name in tooltip */}
      <Tooltip>
        <Tooltip.Trigger className="mt-3 block text-left">
          <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug text-(--foreground)">
            {item.title}
          </h3>
        </Tooltip.Trigger>
        <Tooltip.Content className="max-w-xs rounded-lg bg-(--foreground) px-2.5 py-1.5 text-xs text-(--surface)">
          {item.title}
        </Tooltip.Content>
      </Tooltip>

      {/* Stats */}
      <div className="mt-3 space-y-2">
        <StatRow icon={<IconBriefcase size={15} />} label="Jobs created" value={item.jobsCreated.toLocaleString()} />
        <StatRow icon={<IconCoin size={15} />} label="Total budget" value={item.totalBudget} />
        <StatRow icon={<IconPlant2 size={15} />} label="Value chain" value={item.valueChain} />
      </div>

      {/* Progress — its own row with clear spacing */}
      <div className="mt-4">
        <AppProgressBar value={item.progress} color={statusToProgressColor(item.status)} showLabel />
      </div>

      {/* Footer — funders (left) and date (right), balanced on one line */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <FunderAvatars funders={item.funderContributions ?? []} />
        <span className="inline-flex items-center gap-1 text-[11px] text-(--muted) shrink-0">
          <IconCalendar size={13} />
          {item.dateLabel}
        </span>
      </div>

      {/* Action — separated, full-width */}
      <button
        type="button"
        onClick={() => onViewMore?.(item)}
        className="mt-3 w-full rounded-lg border border-(--separator) py-2 text-[13px] font-medium transition-colors hover:bg-(--default)"
        style={{ color: item.accentColor }}
      >
        {item.viewMoreLabel ?? "View More"}
      </button>
    </Card>
  );
}

export default function FlagshipsList({
  items,
  className,
  cardClassName,
  onViewMore,
}: FlagshipsListProps) {
  const cards = items ?? [];

  return (
    <div className={`w-full max-w-full min-w-0 ${className ?? ""}`}>
      {cards.length === 0 ? (
        <p className="text-sm text-(--muted) py-8 text-center">No flagship programs found.</p>
      ) : null}
      <div className="w-full grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <FlagshipListCard
            key={item.id}
            item={item}
            cardClassName={cardClassName}
            onViewMore={onViewMore}
          />
        ))}
      </div>
    </div>
  );
}
