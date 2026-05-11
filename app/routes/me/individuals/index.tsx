import type { Route } from "./+types/index";
import IndividualsList from "~/components/pages/individuals/individuals-list";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Individuals | M&E" }];
}

export default function MeIndividualsPage() {
  return (
    <IndividualsList
      addPath="/me/individuals/add-individual"
      updatePath="/me/individuals/update"
    />
  );
}
