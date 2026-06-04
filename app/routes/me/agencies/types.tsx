import type { Route } from "./+types/types";
import EnumTypeManagement from "~/components/pages/admin/enum-type-management";

export function meta({}: Route.MetaArgs) { return [{ title: "Agency Types | M&E" }]; }
export default function MeAgencyTypes() {
  return <EnumTypeManagement enumGroup="agency_type" title="Agency Types" backHref="/me/agencies" noun="agency type" />;
}
