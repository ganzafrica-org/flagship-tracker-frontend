import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { Route } from "./+types/index";
import { queryClient } from "~/lib/query-client";
import { flagshipQueryOptions } from "~/lib/queries/flagships";
import { SingleFlagshipDetails } from "~/components/pages/flagships/single-flagship-details";
import FlagshipSummaryModal from "~/components/pages/flagships/flagship-summary-modal";

export async function loader({ params }: Route.LoaderArgs) {
  await queryClient.ensureQueryData(flagshipQueryOptions(Number(params.id)));
  return null;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagship | Admin" }];
}

export default function AdminFlagship({ params }: Route.ComponentProps) {
  const { data: flagship } = useQuery(flagshipQueryOptions(Number(params.id)));
  const pageId = Number(params.id);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  return (
    <>
      <SingleFlagshipDetails
        flagship={flagship ?? undefined}
        flagshipPageId={Number.isFinite(pageId) ? pageId : undefined}
        onViewSummaryPress={() => setIsSummaryOpen(true)}
      />
      <FlagshipSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        flagshipId={Number.isFinite(pageId) ? pageId : undefined}
        fallbackName={flagship?.name}
      />
    </>
  );
}
