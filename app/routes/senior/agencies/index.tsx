import type { Route } from "./+types/index";
import AgenciesManagement from "~/components/pages/admin/agencies-management";

export function meta({}: Route.MetaArgs) { return [{ title: "Agencies | Senior" }]; }
export default function SeniorAgencies() { return <AgenciesManagement basePath="/senior" readOnly />; }
