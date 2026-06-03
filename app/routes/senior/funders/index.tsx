import type { Route } from "./+types/index";
import FundersManagement from "~/components/pages/admin/funders-management";

export function meta({}: Route.MetaArgs) { return [{ title: "Funders | Senior" }]; }
export default function SeniorFunders() { return <FundersManagement basePath="/senior" readOnly />; }
