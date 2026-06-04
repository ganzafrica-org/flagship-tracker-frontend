import type { Route } from "./+types/index";
import AgenciesManagement from "~/components/pages/admin/agencies-management";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Agencies | Admin" }];
}

export default function AdminAgencies() {
  return <AgenciesManagement />;
}
