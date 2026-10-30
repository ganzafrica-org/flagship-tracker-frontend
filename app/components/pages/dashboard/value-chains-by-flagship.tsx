import { useState } from "react";
import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { ChartSkeleton } from "~/components/app-skeleton";
import { flagshipValueChainsQueryOptions, type FlagshipValueChain } from "~/lib/queries/visualizations";

const stageLabel = (stage: string) => stage.replace(/_/g, " ");

/** "label n" row with a share bar, where `total` is the whole the share is taken of. */
function SplitRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-(--muted)">{label}</span>
      <div className="h-1.5 min-w-0 flex-1 rounded-full bg-(--default)">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-20 shrink-0 text-right tabular-nums">
        {value.toLocaleString()} <span className="text-(--muted)">({pct.toFixed(0)}%)</span>
      </span>
    </div>
  );
}

function ValueChainCard({
  chain,
  flagshipName,
  individualsPath,
}: {
  chain: FlagshipValueChain;
  flagshipName: string;
  individualsPath: string;
}) {
  const total = chain.totalIndividuals;
  const href = `${individualsPath}?flagship=${encodeURIComponent(flagshipName)}&valueChain=${encodeURIComponent(chain.name)}`;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={href} className="text-base font-semibold text-(--accent) hover:underline">
            {chain.name}
          </Link>
          <p className="text-xs text-(--muted)">
            {total.toLocaleString()} {total === 1 ? "individual" : "individuals"}
          </p>
        </div>
        <Link to={href} className="shrink-0 text-xs text-(--accent) hover:underline">
          View individuals
        </Link>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs font-medium">Stages</p>
        {chain.stages.length === 0 ? (
          <p className="text-xs text-(--muted)">No individuals linked yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {chain.stages.map((s) => (
              <span key={s.stage} className="rounded-full bg-(--default) px-2.5 py-0.5 text-xs capitalize">
                {stageLabel(s.stage)}: <strong>{s.count.toLocaleString()}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium">Female vs male</p>
        <SplitRow label="Female" value={chain.female} total={total} color="var(--accent)" />
        <SplitRow label="Male" value={chain.male} total={total} color="var(--warning)" />
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium">Youth vs non-youth</p>
        <SplitRow label="Youth" value={chain.youth} total={total} color="var(--accent)" />
        <SplitRow label="Non-youth" value={chain.nonYouth} total={total} color="var(--warning)" />
        {chain.unknownYouth > 0 ? (
          <SplitRow label="Unknown" value={chain.unknownYouth} total={total} color="var(--muted)" />
        ) : null}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-(--separator) pt-3 text-xs">
        <div>
          <dt className="text-(--muted)">Cooperatives / organisations</dt>
          <dd className="text-base font-semibold tabular-nums">{chain.cooperatives.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-(--muted)">Jobs created</dt>
          <dd className="text-(--muted)">Not tracked per value chain</dd>
        </div>
      </dl>
    </Card>
  );
}

export default function ValueChainsByFlagship({ individualsPath = "/admin/individuals" }: { individualsPath?: string }) {
  const { data, isLoading, isError } = useQuery(flagshipValueChainsQueryOptions);
  const [selected, setSelected] = useState<string | null>(null);

  const flagships = data?.flagships ?? [];
  const active = flagships.find((f) => f.flagshipCode === selected) ?? flagships[0];

  return (
    <Card>
      <Card.Header>
        <Card.Title>Value chains by flagship</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-4 p-4 pt-0">
        {isLoading ? (
          <ChartSkeleton height="h-52" />
        ) : isError ? (
          <p className="text-sm text-(--danger)">Failed to load value chains by flagship</p>
        ) : flagships.length === 0 ? (
          <p className="text-sm text-(--muted)">No flagships yet</p>
        ) : (
          <>
            <div role="tablist" aria-label="Flagships" className="flex gap-2 overflow-x-auto pb-1">
              {flagships.map((f) => {
                const isActive = f.flagshipCode === active?.flagshipCode;
                return (
                  <button
                    key={f.flagshipId}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelected(f.flagshipCode)}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "border-(--accent) bg-(--accent) text-(--accent-foreground)"
                        : "border-(--separator) hover:bg-(--default)"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{f.flagshipCode}</span>
                    <span className={`block max-w-40 truncate text-xs ${isActive ? "opacity-90" : "text-(--muted)"}`}>
                      {f.flagshipName}
                    </span>
                  </button>
                );
              })}
            </div>

            {active ? (
              <div role="tabpanel" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <p>
                    <span className="font-semibold">{active.flagshipName}</span>{" "}
                    <span className="text-(--muted)">
                      · {active.linkedIndividuals.toLocaleString()} individuals linked to this flagship · jobs created
                      (flagship total):{" "}
                      {active.jobsCreated != null ? Math.round(active.jobsCreated).toLocaleString() : "—"}
                    </span>
                  </p>
                </div>

                {active.linkedIndividuals === 0 ? (
                  <p className="rounded-lg bg-(--default) px-3 py-2 text-xs text-(--muted)">
                    No individuals are linked to this flagship yet, so individual counts are 0. Only individuals
                    explicitly linked to the flagship are counted here, never registrations from other flagships.
                  </p>
                ) : null}

                {active.valueChains.length === 0 ? (
                  <p className="text-sm text-(--muted)">This flagship has no value chains set.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                    {active.valueChains.map((vc) => (
                      <ValueChainCard
                        key={vc.name}
                        chain={vc}
                        flagshipName={active.flagshipName}
                        individualsPath={individualsPath}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </Card.Content>
    </Card>
  );
}
