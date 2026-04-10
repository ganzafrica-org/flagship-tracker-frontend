import { Outlet, useLocation } from "react-router";

import type { Route } from "./+types/layout";
import { queryClient } from "~/lib/query-client";
import { PageTransition } from "~/components/page-transition";
import { Tab } from "~/components/navigation/tab";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";

export async function loader(_: Route.LoaderArgs) {
  queryClient.prefetchQuery(flagshipsQueryOptions);
  return null;
}

const NAV_TABS = [
  { id: "flagships", label: "Flagships", href: "/me/flagships" },
];

export default function MeLayout() {
  const location = useLocation();
  const active = NAV_TABS.find((t) => location.pathname.startsWith(t.href))?.id ?? "flagships";

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <Tab tabs={NAV_TABS} activeKey={active} ariaLabel="M&E navigation" />
      <main className="p-6">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
