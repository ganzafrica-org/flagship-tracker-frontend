import type { Route } from "./+types/index";
import SeniorDashboard from "~/components/pages/dashboard/senior-dashboard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard | Monitoring & Evaluation" }];
}

export default function MeDashboardPage() {
  return <SeniorDashboard flagshipBase="/me" />;
}
