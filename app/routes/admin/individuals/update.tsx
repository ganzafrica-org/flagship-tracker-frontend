import type { Route } from "./+types/update";
import AddIndividual from "~/components/pages/individuals/add-individual";
import { redirectLegacyView } from "~/lib/legacy-view-redirect";

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  return redirectLegacyView(request, "/admin/individuals");
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Update Individual | Admin" }];
}

export default function AdminUpdateIndividualPage() {
  return <AddIndividual backPath="/admin/individuals" />;
}
