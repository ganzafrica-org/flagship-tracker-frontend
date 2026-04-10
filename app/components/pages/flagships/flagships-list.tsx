import { Card } from "@heroui/react";
import { IconCalendar, IconHomeFilled, IconMapPin, IconUsers } from "@tabler/icons-react";
import type { ReactNode } from "react";
import {
  flagshipDummyData,
  type FlagshipListItem,
} from "~/data/dummy-flagship-detail";
import { themeIconSoftBackground } from "~/lib/theme-icon-bg";
export type FlagshipCardItem = FlagshipListItem & { icon?: ReactNode };

interface FlagshipsListProps {
  items?: FlagshipCardItem[];
  className?: string;
  cardClassName?: string;
  onViewMore?: (item: FlagshipCardItem) => void;
}

const CARD_WRAPPER_CLASS = "rounded-xl overflow-hidden bg-(--surface)";
const CARD_CLASS = "relative !rounded-xl bg-(--surface) p-5 min-h-[320px] h-full shadow-none flex flex-col";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
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
  const investors = item.investorNames ?? [];
  const visibleInvestors = investors.slice(0, 3);
  const extraInvestorsCount = Math.max(0, investors.length - visibleInvestors.length);
  const iconSoftBg = themeIconSoftBackground(item.accentColor);

  return (
    <div style={{ borderRadius: "12px" }} className={`${CARD_WRAPPER_CLASS} ${cardClassName ?? ""}`}>
      <Card className={CARD_CLASS}>
        <div className="flex items-start justify-between gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconSoftBg }}
          >
            <span style={{ color: item.accentColor }}>
              {item.icon ?? <IconHomeFilled size={18} />}
            </span>
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
          <p className="text-[14px] text-(--foreground)">Total Investment:&nbsp;&nbsp;{item.totalInvestment}</p>
          <p className="text-[14px] text-(--foreground)">Number of Investors: {item.numberOfInvestors}</p>
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
          <div className="flex -space-x-2">
            {visibleInvestors.map((name) => (
              <div
                key={name}
                className="w-8 h-8 rounded-full border-2 border-(--surface) text-[10px] font-semibold flex items-center justify-center"
                style={{
                  backgroundColor: iconSoftBg,
                  color: item.accentColor,
                }}
                title={name}
              >
                {getInitials(name)}
              </div>
            ))}
            {extraInvestorsCount > 0 ? (
              <div
                className="w-8 h-8 rounded-full border-2 border-(--surface) text-[10px] font-semibold flex items-center justify-center text-(--foreground) bg-(--default)"
                title={`${extraInvestorsCount} more people`}
              >
                +{extraInvestorsCount}
              </div>
            ) : investors.length === 0 ? (
              <div
                className="w-8 h-8 rounded-full border-2 border-(--surface) flex items-center justify-center text-(--muted) bg-(--default)"
                title="No people assigned"
              >
                <IconUsers size={14} />
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 text-[12px] text-(--muted)">
            <span className="inline-flex items-center gap-1">
              <IconCalendar size={14} />
              {item.dateLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconMapPin size={14} />
              {item.location}
            </span>
          </div>
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
  const cards = items?.length ? items : flagshipDummyData;

  return (
    <div className={`w-full max-w-full min-w-0 ${className ?? ""}`}>
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
