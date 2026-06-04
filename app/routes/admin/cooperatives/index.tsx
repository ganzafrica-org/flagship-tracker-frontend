import type { Route } from "./+types/index";
import CooperativesManagement from "~/components/pages/admin/cooperatives-management";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Cooperatives | Admin" }];
}

export default function AdminCooperatives() {
  return <CooperativesManagement />;
}
