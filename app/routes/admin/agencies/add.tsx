import type { Route } from "./+types/add";
import AgencyForm from "~/components/pages/admin/agency-form";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Agency | Admin" }];
}

export default function AdminAgencyAdd() {
  return <AgencyForm />;
}
