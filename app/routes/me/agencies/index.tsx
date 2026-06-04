import type { Route } from "./+types/index";
import AgenciesManagement from "~/components/pages/admin/agencies-management";

export function meta({}: Route.MetaArgs) { return [{ title: "Agencies | M&E" }]; }
export default function MeAgencies() { return <AgenciesManagement basePath="/me" />; }
