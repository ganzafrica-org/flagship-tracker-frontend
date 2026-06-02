import type { Route } from "./+types/add";
import CooperativeForm from "~/components/pages/admin/cooperative-form";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Cooperative | Admin" }];
}

export default function AdminCooperativeAdd() {
  return <CooperativeForm />;
}
