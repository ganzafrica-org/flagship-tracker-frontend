import type { Route } from "./+types/add";
import AddIndividual from "~/components/pages/individuals/add-individual";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Add Individual | Admin" }];
}

export default function AdminAddIndividualPage() {
  return <AddIndividual backPath="/admin/individuals" />;
}
