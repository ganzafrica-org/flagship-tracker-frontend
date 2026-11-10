import type { Route } from "./+types/dashboard";
import IndividualsList from "~/components/pages/individuals/individuals-list";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard | Youth Profiles" }];
}

export default function AdminYouthDashboardPage() {
  return <IndividualsList overviewOnly readOnly />;
}
