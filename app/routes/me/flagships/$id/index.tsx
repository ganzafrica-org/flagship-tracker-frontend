import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

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
  const navigate = useNavigate();
  const { data: flagship, isPlaceholderData, isPending } = useQuery(flagshipQueryOptions(Number(params.id)));
  const pageId = Number(params.id);
  const detailsPath = `/me/flagships/${params.id}`;

  return (
    <SingleFlagshipDetails
      flagship={flagship ?? undefined}
      pending={isPlaceholderData || isPending}
      flagshipPageId={Number.isFinite(pageId) ? pageId : undefined}
      onUpdatePress={() =>
        navigate(
          `/me/flagships/add-flagship?editId=${encodeURIComponent(String(params.id))}&returnTo=${encodeURIComponent(detailsPath)}`,
          { viewTransition: true },
        )
      }
      onViewSummaryPress={(content) => {
        void generateFlagshipReport(content);
      }}
    />
  );
}
