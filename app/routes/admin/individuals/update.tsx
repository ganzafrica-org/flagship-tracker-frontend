import type { Route } from "./+types/update";
import AddIndividual from "~/components/pages/individuals/add-individual";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Update Individual | Admin" }];
}

export default function AdminUpdateIndividualPage() {
  return <AddIndividual backPath="/admin/individuals" />;
}
