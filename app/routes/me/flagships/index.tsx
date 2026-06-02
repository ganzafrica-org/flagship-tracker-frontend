import type { Route } from "./+types/index";
import FlagshipsIndexPage from "~/components/pages/flagships/flagships-index-page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagships | M&E" }];
}

export default function MeFlagships() {
  return (
    <FlagshipsIndexPage
      title="Flagship Projects"
      basePath="/me/flagships"
      addFlagshipPath="/me/flagships/add-flagship"
    />
  );
}
