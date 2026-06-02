import type { Route } from "./+types/index";
import KpiDefinitionsManagement from "~/components/pages/admin/kpi-definitions-management";

export function meta({}: Route.MetaArgs) {
  return [{ title: "KPI Definitions | Admin" }];
}

export default function AdminKpis() {
  return <KpiDefinitionsManagement />;
}
