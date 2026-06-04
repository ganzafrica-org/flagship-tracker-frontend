import type { Route } from "./+types/types";
import EnumTypeManagement from "~/components/pages/admin/enum-type-management";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Agency Types | Admin" }];
}

export default function AdminAgencyTypes() {
  return (
    <EnumTypeManagement
      enumGroup="agency_type"
      title="Agency Types"
      backHref="/admin/agencies"
      noun="agency type"
    />
  );
}
