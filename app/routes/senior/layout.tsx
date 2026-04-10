import { Outlet, useLocation } from "react-router";

import type { Route } from "./+types/layout";
import { queryClient } from "~/lib/query-client";
import { PageTransition } from "~/components/page-transition";
import { Tab } from "~/components/navigation/tab";
import { dashboardQueryOptions } from "~/lib/queries/dashboard";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import { reportsQueryOptions } from "~/lib/queries/reports";

export async function loader(_: Route.LoaderArgs) {
  queryClient.prefetchQuery(dashboardQueryOptions);
  queryClient.prefetchQuery(flagshipsQueryOptions);
  queryClient.prefetchQuery(reportsQueryOptions);
  return null;
}

const NAV_TABS = [
  { id: "dashboard", label: "Dashboard", href: "/senior/dashboard" },
  { id: "flagships", label: "Flagships", href: "/senior/flagships" },
  { id: "reports",   label: "Reports",   href: "/senior/reports"   },
];

export default function SeniorLayout() {
  const location = useLocation();
  const active = NAV_TABS.find((t) => location.pathname.startsWith(t.href))?.id ?? "dashboard";

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <Tab tabs={NAV_TABS} activeKey={active} ariaLabel="Senior navigation" />
      <main className="p-6">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
