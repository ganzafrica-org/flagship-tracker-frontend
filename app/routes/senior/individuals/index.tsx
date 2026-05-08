import type { Route } from "./+types/index";
import IndividualsList from "~/components/pages/individuals/individuals-list";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Individuals | Senior" }];
}

export default function SeniorIndividualsPage() {
  return <IndividualsList readOnly />;
}
