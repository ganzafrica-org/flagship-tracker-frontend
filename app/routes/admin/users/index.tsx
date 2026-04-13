import type { Route } from "./+types/index";
import UsersManagementPage from "~/components/pages/admin/users-management";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Users | Admin" }];
}

export default function AdminUsers() {
  return <UsersManagementPage />;
}
