import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { Route } from "./+types/index";
import { flagshipQueryOptions } from "~/lib/queries/flagships";
import { SingleFlagshipDetails } from "~/components/pages/flagships/single-flagship-details";
import ReportActionDialog, {
  type ReportDialogMode,
} from "~/components/pages/reports/report-action-dialog";
import type { ReportDownloadRow } from "~/components/pages/reports/report-download-utils";

/** Present so navigation has a result. It does not wait on the database; the page loads that itself. */
export function clientLoader() {
  return null;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagship | M&E" }];
}

export default function MeFlagship({ params }: Route.ComponentProps) {
  const { data: flagship, isPlaceholderData, isPending } = useQuery(flagshipQueryOptions(Number(params.id)));
  const pageId = Number(params.id);
  const [modalType, setModalType] = useState<ReportDialogMode>(null);

  const reportRow: ReportDownloadRow | null = flagship
    ? {
        id: flagship.id,
        name: flagship.name,
        type: "Custom",
        period: "Current",
        createdOn: "Today",
        createdBy: flagship.lead,
        origin: "Flagship Details",
      }
    : null;

  return (
    <>
      <SingleFlagshipDetails
        flagship={flagship ?? undefined}
        pending={isPlaceholderData || isPending}
        flagshipPageId={Number.isFinite(pageId) ? pageId : undefined}
        onViewSummaryPress={() => setModalType("view")}
      />
      <ReportActionDialog mode={modalType} report={reportRow} onClose={() => setModalType(null)} />
    </>
  );
}
