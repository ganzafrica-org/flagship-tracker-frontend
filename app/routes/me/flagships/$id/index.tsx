import { useQuery } from "@tanstack/react-query";

import type { Route } from "./+types/index";
import { flagshipQueryOptions } from "~/lib/queries/flagships";
import { SingleFlagshipDetails } from "~/components/pages/flagships/single-flagship-details";
import { generateFlagshipReport } from "~/lib/generated-reports";

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

  return (
    <SingleFlagshipDetails
      flagship={flagship ?? undefined}
      pending={isPlaceholderData || isPending}
      flagshipPageId={Number.isFinite(pageId) ? pageId : undefined}
      onViewSummaryPress={(content) => {
        void generateFlagshipReport(content);
      }}
    />
  );
}
