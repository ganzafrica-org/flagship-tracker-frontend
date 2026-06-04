import type { Route } from "./+types/add";
import FunderForm from "~/components/pages/admin/funder-form";

export function meta({}: Route.MetaArgs) { return [{ title: "Funder | Senior" }]; }
export default function SeniorFunderView() { return <FunderForm basePath="/senior" />; }
