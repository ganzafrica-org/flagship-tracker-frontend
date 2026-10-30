import type { Route } from "./+types/add";
import CooperativeForm from "~/components/pages/admin/cooperative-form";
import { redirectLegacyView } from "~/lib/legacy-view-redirect";

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  return redirectLegacyView(request, "/admin/cooperatives", { keep: ["type"] });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Cooperative | Admin" }];
}

export default function AdminCooperativeAdd() {
  return <CooperativeForm />;
}
