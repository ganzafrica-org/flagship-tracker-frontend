import type { Route } from "./+types/add";
import KpiDefinitionForm from "~/components/pages/admin/kpi-definition-form";

export function meta({}: Route.MetaArgs) { return [{ title: "KPI Definition | M&E" }]; }
export default function MeKpiAdd() { return <KpiDefinitionForm basePath="/me" />; }
