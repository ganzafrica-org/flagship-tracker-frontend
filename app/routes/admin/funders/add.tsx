import type { Route } from "./+types/add";
import FunderForm from "~/components/pages/admin/funder-form";
import { redirectLegacyView } from "~/lib/legacy-view-redirect";

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  return redirectLegacyView(request, "/admin/funders");
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Funder | Admin" }];
}

export default function AdminFunderAdd() {
  return <FunderForm />;
}
