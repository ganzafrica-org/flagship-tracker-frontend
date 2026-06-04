import type { Route } from "./+types/types";
import EnumTypeManagement from "~/components/pages/admin/enum-type-management";

export function meta({}: Route.MetaArgs) { return [{ title: "Funder Types | M&E" }]; }
export default function MeFunderTypes() {
  return <EnumTypeManagement enumGroup="funder_type" title="Funder Types" backHref="/me/funders" noun="funder type" />;
}
