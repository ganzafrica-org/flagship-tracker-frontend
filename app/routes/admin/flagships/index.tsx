import type { Route } from "./+types/index";
import FlagshipsIndexPage from "~/components/pages/flagships/flagships-index-page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagships | Admin" }];
}

export default function AdminFlagships() {
  return (
    <FlagshipsIndexPage
      title="Flagship Projects Management"
      basePath="/admin/flagships"
      addFlagshipPath="/me/flagships/add-flagship"
    />
  );
}
