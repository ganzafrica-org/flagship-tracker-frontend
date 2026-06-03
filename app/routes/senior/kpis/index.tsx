import type { Route } from "./+types/index";
import KpiDefinitionsManagement from "~/components/pages/admin/kpi-definitions-management";

export function meta({}: Route.MetaArgs) { return [{ title: "KPI Definitions | Senior" }]; }
export default function SeniorKpis() { return <KpiDefinitionsManagement basePath="/senior" readOnly />; }
