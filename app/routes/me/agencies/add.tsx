import type { Route } from "./+types/add";
import AgencyForm from "~/components/pages/admin/agency-form";

export function meta({}: Route.MetaArgs) { return [{ title: "Agency | M&E" }]; }
export default function MeAgencyAdd() { return <AgencyForm basePath="/me" />; }
