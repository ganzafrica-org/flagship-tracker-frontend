import type { Route } from "./+types/add";
import AddIndividual from "~/components/pages/individuals/add-individual";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Add Individual | M&E" }];
}

export default function MeAddIndividualPage() {
  return <AddIndividual backPath="/me/individuals" />;
}
