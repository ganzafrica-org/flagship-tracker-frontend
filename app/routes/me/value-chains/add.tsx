import type { Route } from "./+types/add";
import ValueChainForm from "~/components/pages/admin/value-chain-form";

export function meta({}: Route.MetaArgs) { return [{ title: "Value Chain | M&E" }]; }
export default function MeValueChainAdd() { return <ValueChainForm basePath="/me" />; }
