import type { Route } from "./+types/add";
import KpiDefinitionForm from "~/components/pages/admin/kpi-definition-form";

export function meta({}: Route.MetaArgs) {
  return [{ title: "KPI Definition | Admin" }];
}

export default function AdminKpiAdd() {
  return <KpiDefinitionForm />;
}
