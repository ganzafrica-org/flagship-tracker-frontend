import type { Route } from "./+types/index";
import FundersManagement from "~/components/pages/admin/funders-management";

export function meta({}: Route.MetaArgs) { return [{ title: "Funders | M&E" }]; }
export default function MeFunders() { return <FundersManagement basePath="/me" />; }
