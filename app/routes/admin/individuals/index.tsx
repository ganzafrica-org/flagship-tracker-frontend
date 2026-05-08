import type { Route } from "./+types/index";
import IndividualsList from "~/components/pages/individuals/individuals-list";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Individuals | Admin" }];
}

export default function AdminIndividualsPage() {
  return (
    <IndividualsList
      addPath="/admin/individuals/add-individual"
      updatePath="/admin/individuals/update"
    />
  );
}
