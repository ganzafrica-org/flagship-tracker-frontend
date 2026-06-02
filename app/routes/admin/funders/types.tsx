import type { Route } from "./+types/types";
import EnumTypeManagement from "~/components/pages/admin/enum-type-management";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Funder Types | Admin" }];
}

export default function AdminFunderTypes() {
  return (
    <EnumTypeManagement
      enumGroup="funder_type"
      title="Funder Types"
      backHref="/admin/funders"
      noun="funder type"
    />
  );
}
