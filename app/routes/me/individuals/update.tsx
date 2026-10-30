import type { Route } from "./+types/update";
import AddIndividual from "~/components/pages/individuals/add-individual";
import { redirectLegacyView } from "~/lib/legacy-view-redirect";

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  return redirectLegacyView(request, "/me/individuals");
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Update Individual | M&E" }];
}

export default function MeUpdateIndividualPage() {
  return <AddIndividual backPath="/me/individuals" />;
}
