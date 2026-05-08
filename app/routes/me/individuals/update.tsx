import type { Route } from "./+types/update";
import AddIndividual from "~/components/pages/individuals/add-individual";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Update Individual | M&E" }];
}

export default function MeUpdateIndividualPage() {
  return <AddIndividual backPath="/me/individuals" />;
}
