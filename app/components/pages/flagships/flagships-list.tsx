import { Avatar, Card } from "@heroui/react";
import { IconCalendar, IconHomeFilled } from "@tabler/icons-react";
import { useEffect, useState, type ReactNode } from "react";
import type { FlagshipListItem } from "~/lib/queries/flagships";

export type FlagshipCardItem = FlagshipListItem & { icon?: ReactNode };

interface FlagshipsListProps {
  items?: FlagshipCardItem[];
  className?: string;
  cardClassName?: string;
  onViewMore?: (item: FlagshipCardItem) => void;
}

const CARD_WRAPPER_CLASS = "rounded-xl overflow-hidden bg-(--surface)";
const CARD_CLASS = "relative !rounded-xl bg-(--surface) p-5 min-h-[320px] h-full shadow-none flex flex-col";

/** A small palette of bg/text pairs for avatar variety within a group. */
const AVATAR_PALETTE: { bg: string; color: string }[] = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fef9c3", color: "#a16207" },
  { bg: "#fce7f3", color: "#be185d" },
  { bg: "#ede9fe", color: "#6d28d9" },
  { bg: "#ffedd5", color: "#c2410c" },
];


function FlagshipListCard({
  item,
  cardClassName,
  onViewMore,
}: {
  item: FlagshipCardItem;
  cardClassName?: string;
  onViewMore?: (item: FlagshipCardItem) => void;
}) {
  const funders = item.funderNames ?? [];
  const visibleFunders = funders.slice(0, 3);
  const extraFunders = funders.slice(3);
  const extraFundersCount = extraFunders.length;
  const [funderLabel, setFunderLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!funderLabel) return;
    const close = () => setFunderLabel(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [funderLabel]);

  return (
    <div style={{ borderRadius: "12px" }} className={`${CARD_WRAPPER_CLASS} ${cardClassName ?? ""}`}>
      <Card className={CARD_CLASS}>
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: item.accentColor }}
          >
            {item.icon ?? <IconHomeFilled size={18} stroke={2} />}
          </div>
          <button
            type="button"
            onClick={() => onViewMore?.(item)}
            className="text-[14px] font-medium hover:underline"
            style={{ color: item.accentColor }}
          >
            {item.viewMoreLabel ?? "View More"}
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          <h3 className="text-[17px] font-semibold text-(--foreground) leading-[1.45]">
            {item.title}
          </h3>

          <p className="text-[14px] text-(--foreground)">Jobs Created: {item.jobsCreated}</p>
          <p className="text-[14px] text-(--foreground)">Total Budget:&nbsp;&nbsp;{item.totalBudget}</p>
          <p className="text-[14px] text-(--foreground)">Number of Funders: {item.numberOfFunders}</p>
          <p className="text-[14px] text-(--foreground)">Value Chain: {item.valueChain}</p>

          <div className="pt-1">
            <div className="flex items-center justify-end text-[12px] text-(--muted) mb-0.5">
              <span>{item.progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-(--default)">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, item.progress))}%`, backgroundColor: item.accentColor }}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <div className="relative flex -space-x-2">
            {funderLabel ? (
              <div
                role="status"
                className="absolute bottom-full left-0 z-10 mb-2 max-w-[min(100%,16rem)] rounded-lg bg-(--foreground) px-2.5 py-1.5 text-xs font-medium leading-snug text-(--surface) shadow-md"
              >
                {funderLabel}
              </div>
            ) : null}
            {visibleFunders.map((name, i) => {
              const palette = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
              const label = name.trim();
              const initials = label.split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <button
                  key={`${label}-${i}`}
                  type="button"
                  title={label}
                  aria-label={`Funder: ${label}`}
                  aria-expanded={funderLabel === label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFunderLabel((prev) => (prev === label ? null : label));
                  }}
                  className="inline-flex cursor-pointer rounded-full ring-2 ring-(--surface) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
                >
                  <Avatar
                    size="sm"
                    style={{ backgroundColor: palette.bg, color: palette.color }}
                  >
                    <Avatar.Fallback style={{ backgroundColor: palette.bg, color: palette.color }}>
                      {initials}
                    </Avatar.Fallback>
                  </Avatar>
                </button>
              );
            })}
            {extraFundersCount > 0 ? (
              <button
                type="button"
                aria-label={`${extraFundersCount} more funders`}
                aria-expanded={funderLabel === extraFunders.join(", ")}
                onClick={(e) => {
                  e.stopPropagation();
                  const label = extraFunders.join(", ");
                  setFunderLabel((prev) => (prev === label ? null : label));
                }}
                className="inline-flex cursor-pointer rounded-full ring-2 ring-(--surface) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              >
                <Avatar size="sm">
                  <Avatar.Fallback className="text-xs bg-(--default) text-(--foreground)">
                    +{extraFundersCount}
                  </Avatar.Fallback>
                </Avatar>
              </button>
            ) : null}
          </div>

          <span className="inline-flex items-center gap-1 text-[12px] text-(--muted)">
            <IconCalendar size={14} />
            {item.dateLabel}
          </span>
        </div>
      </Card>
    </div>
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
