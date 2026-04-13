import type { Route } from "./+types/index";
import SeniorDashboard from "~/components/pages/dashboard/senior-dashboard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard | Senior Officials" }];
}

export default function SeniorDashboardPage() {
  return <SeniorDashboard />;
}
