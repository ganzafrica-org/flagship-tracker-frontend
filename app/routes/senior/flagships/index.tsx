import type { Route } from "./+types/index";
import FlagshipsIndexPage from "~/components/pages/flagships/flagships-index-page";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Flagships | Senior Officials" }];
}

export default function SeniorFlagships() {
  return <FlagshipsIndexPage title="Flagship Projects" basePath="/senior/flagships" />;
}
