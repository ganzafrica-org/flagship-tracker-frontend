import { useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Chip, Spinner } from "@heroui/react";

import AppAlertDialog from "~/components/app-alert-dialog";
import { toast } from "~/components/app-alert";
import type { DraftRecord } from "~/lib/offline-drafts/db";
import { useDrafts } from "~/lib/offline-drafts/use-drafts";
import { deleteDraft } from "~/lib/offline-drafts/repository";
import { replayCooperativeDraft, replayFlagshipDraft, replayIndividualDraft } from "~/lib/offline-drafts/replay";
import { cooperativeTypeNames } from "~/lib/queries/cooperatives";

interface DraftsTabContentProps {
  entityType: DraftRecord["entityType"];
  /** Add-form path to open for editing a draft, e.g. "/me/individuals/add-individual". */
  editPath: string;
  /** Cooperative drafts only: when set, shows just drafts whose groupType matches (e.g. "association"). */
  groupType?: string;
}

const ENTITY_LABEL: Record<DraftRecord["entityType"], string> = {
  individual: "Individual",
  flagship: "Flagship",
  cooperative: "Record",
};

function summarizeDraft(draft: DraftRecord): { title: string; subtitle: string } {
  if (draft.entityType === "individual") {
    const p = draft.payload;
    return {
      title: `${p.firstName} ${p.lastName}`.trim() || "Unnamed individual",
      subtitle: [p.phoneNumber, p.province, p.district].filter(Boolean).join(" · "),
    };
  }
  if (draft.entityType === "flagship") {
    const p = draft.payload;
    const kpiNote = draft.pendingKpis.length ? `${draft.pendingKpis.length} KPI(s)` : "";
    return {
      title: p.flagshipName || "Unnamed flagship",
      subtitle: [p.flagshipCode, p.flagshipCluster, kpiNote].filter(Boolean).join(" · "),
    };
  }
  const p = draft.payload;
  const typeLabel = p.groupType ? cooperativeTypeNames(p.groupType).singular : "";
  const flagshipNote = p.flagships?.length ? "Linked to a flagship" : "";
  return {
    title: p.cooperativeName || `Unnamed ${typeLabel.toLowerCase() || "record"}`,
    subtitle: [typeLabel, p.primaryValueChain, p.province, flagshipNote].filter(Boolean).join(" · "),
  };
}

/** Shared "Draft" tab body for M&E list pages (Flagships, Individuals, Cooperatives & Organisations …). */
export default function DraftsTabContent({ entityType, editPath, groupType }: DraftsTabContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [toDiscard, setToDiscard] = useState<DraftRecord | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const allDrafts = useDrafts(entityType);
  const drafts = groupType
    ? allDrafts?.filter((d) => d.entityType === "cooperative" && d.payload.groupType === groupType)
    : allDrafts;

  async function handleSubmitDraft(draft: DraftRecord) {
    setSubmittingId(draft.id!);
    try {
      let label = ENTITY_LABEL[draft.entityType];
      if (draft.entityType === "individual") {
        await replayIndividualDraft(draft, queryClient);
      } else if (draft.entityType === "flagship") {
        await replayFlagshipDraft(draft, queryClient);
      } else {
        label = cooperativeTypeNames(draft.payload.groupType).singular;
        await replayCooperativeDraft(draft, queryClient);
      }
      toast.success(`${label} submitted successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit draft");
    } finally {
      setSubmittingId(null);
    }
  }

  async function confirmDiscard() {
    if (!toDiscard) return;
    setIsDiscarding(true);
    try {
      await deleteDraft(toDiscard.id!);
      setToDiscard(null);
    } finally {
      setIsDiscarding(false);
    }
  }

  if (!drafts) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <p className="text-sm text-(--muted-foreground) py-12 text-center">
        No draft submissions. Items you save while offline will appear here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {drafts.map((draft) => {
        const { title, subtitle } = summarizeDraft(draft);
        const isSubmitting = submittingId === draft.id;
        return (
          <Card key={draft.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-(--foreground) truncate">{title}</h3>
              <Chip size="sm" variant="soft" color={draft.status === "error" ? "danger" : "warning"}>
                {draft.status === "error" ? "Needs attention" : "Pending review"}
              </Chip>
            </div>
            {subtitle ? <p className="text-xs text-(--muted-foreground)">{subtitle}</p> : null}
            {draft.lastError ? <p className="text-xs text-(--danger)">{draft.lastError}</p> : null}
            <p className="text-[11px] text-(--muted-foreground)">
              Saved {new Date(draft.createdAt).toLocaleString()}
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 !rounded-full"
                onPress={() =>
                  navigate(`${editPath}${editPath.includes("?") ? "&" : "?"}draftId=${draft.id}`, {
                    viewTransition: true,
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="flex-1 !rounded-full"
                isLoading={isSubmitting}
                isDisabled={isSubmitting}
                onPress={() => handleSubmitDraft(draft)}
              >
                Submit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="!rounded-full text-(--danger) border-(--danger)"
                isDisabled={isSubmitting}
                onPress={() => setToDiscard(draft)}
              >
                Discard
              </Button>
            </div>
          </Card>
        );
      })}

      <AppAlertDialog
        isOpen={toDiscard !== null}
        onOpenChange={(open) => !open && setToDiscard(null)}
        title="Discard this draft?"
        description="This cannot be undone."
        confirmLabel="Discard"
        isPending={isDiscarding}
        onConfirm={() => void confirmDiscard()}
      />
    </div>
  );
}
