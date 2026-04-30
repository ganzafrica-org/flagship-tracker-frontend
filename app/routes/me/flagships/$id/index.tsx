import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { Route } from "./+types/index";
import { queryClient } from "~/lib/query-client";
import { flagshipQueryOptions } from "~/lib/queries/flagships";
import { SingleFlagshipDetails } from "~/components/pages/flagships/single-flagship-details";
import ReportActionDialog, {
  type ReportDialogMode,
} from "~/components/pages/reports/report-action-dialog";
import type { ReportDownloadRow } from "~/components/pages/reports/report-download-utils";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  await queryClient.ensureQueryData(flagshipQueryOptions(Number(params.id)));
  return null;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagship | M&E" }];
}

export default function MeFlagship({ params }: Route.ComponentProps) {
  const { data: flagship } = useQuery(flagshipQueryOptions(Number(params.id)));
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
        flagshipPageId={Number.isFinite(pageId) ? pageId : undefined}
        onViewSummaryPress={() => setModalType("view")}
      />
      <ReportActionDialog mode={modalType} report={reportRow} onClose={() => setModalType(null)} />
    </>
  );
}
