import type { Route } from "./+types/index";
import KpiDefinitionsManagement from "~/components/pages/admin/kpi-definitions-management";

export function meta({}: Route.MetaArgs) { return [{ title: "KPI Definitions | M&E" }]; }
export default function MeKpis() { return <KpiDefinitionsManagement basePath="/me" />; }
