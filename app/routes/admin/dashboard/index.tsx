import type { Route } from "./+types/index";
import AdminDashboard from "~/components/pages/dashboard/admin-dashboard";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Dashboard | Admin" }];
}

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
