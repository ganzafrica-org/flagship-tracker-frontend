import { useQuery } from "@tanstack/react-query";

import type { Route } from "./+types/index";
import { queryClient } from "~/lib/query-client";
import { flagshipQueryOptions } from "~/lib/queries/flagships";
import { SingleFlagshipDetails } from "~/components/pages/flagships/single-flagship-details";

export async function loader({ params }: Route.LoaderArgs) {
  await queryClient.ensureQueryData(flagshipQueryOptions(Number(params.id)));
  return null;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagship | Senior Officials" }];
}

export default function SeniorFlagship({ params }: Route.ComponentProps) {
  const { data: flagship } = useQuery(flagshipQueryOptions(Number(params.id)));

  const pageId = Number(params.id);

  return (
    <SingleFlagshipDetails
      flagship={flagship ?? undefined}
      flagshipPageId={Number.isFinite(pageId) ? pageId : undefined}
      onViewSummaryPress={() => {
        // TODO: open summary modal or navigate to summary route
      }}
    />
  );
}
