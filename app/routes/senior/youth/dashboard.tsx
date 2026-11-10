import type { Route } from "./+types/dashboard";
import IndividualsList from "~/components/pages/individuals/individuals-list";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard | Youth Profiles" }];
}

export default function SeniorYouthDashboardPage() {
  return <IndividualsList overviewOnly readOnly />;
}
