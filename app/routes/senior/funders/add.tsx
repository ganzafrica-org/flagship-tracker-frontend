import { redirect } from "react-router";

import type { Route } from "./+types/add";
import { redirectLegacyView } from "~/lib/legacy-view-redirect";

// Senior is view-only: this page only ever showed a funder, which is now a dialog on the list.
export function clientLoader({ request }: Route.ClientLoaderArgs) {
  return redirectLegacyView(request, "/senior/funders", { always: true }) ?? redirect("/senior/funders");
}

export default function SeniorFunderAdd() {
  return null;
}
