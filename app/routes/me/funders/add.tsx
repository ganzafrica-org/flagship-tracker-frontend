import type { Route } from "./+types/add";
import FunderForm from "~/components/pages/admin/funder-form";

export function meta({}: Route.MetaArgs) { return [{ title: "Funder | M&E" }]; }
export default function MeFunderAdd() { return <FunderForm basePath="/me" />; }
