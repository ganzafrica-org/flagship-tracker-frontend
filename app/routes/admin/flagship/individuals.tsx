import type { Route } from "./+types/individuals";
import IndividualsList from "~/components/pages/individuals/individuals-list";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Individuals | Flagship" }];
}

export default function AdminFlagshipIndividualsPage() {
  return <IndividualsList empty readOnly />;
}
