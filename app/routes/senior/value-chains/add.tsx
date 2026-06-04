import type { Route } from "./+types/add";
import ValueChainForm from "~/components/pages/admin/value-chain-form";

export function meta({}: Route.MetaArgs) { return [{ title: "Value Chain | Senior" }]; }
export default function SeniorValueChainView() { return <ValueChainForm basePath="/senior" />; }
