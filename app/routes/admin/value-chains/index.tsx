import type { Route } from "./+types/index";
import ValueChainsManagement from "~/components/pages/admin/value-chains-management";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Value Chains | Admin" }];
}

export default function AdminValueChains() {
  return <ValueChainsManagement />;
}
