import type { Route } from "./+types/add";
import AgencyForm from "~/components/pages/admin/agency-form";

export function meta({}: Route.MetaArgs) { return [{ title: "Agency | Senior" }]; }
export default function SeniorAgencyView() { return <AgencyForm basePath="/senior" />; }
