import type { Route } from "./+types/add";
import KpiDefinitionForm from "~/components/pages/admin/kpi-definition-form";

export function meta({}: Route.MetaArgs) { return [{ title: "KPI Definition | Senior" }]; }
export default function SeniorKpiView() { return <KpiDefinitionForm basePath="/senior" />; }
