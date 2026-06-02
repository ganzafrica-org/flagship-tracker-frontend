import type { Route } from "./+types/add";
import ValueChainForm from "~/components/pages/admin/value-chain-form";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Value Chain | Admin" }];
}

export default function AdminValueChainAdd() {
  return <ValueChainForm />;
}
