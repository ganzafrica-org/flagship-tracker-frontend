import { Outlet, useLocation } from "react-router";
import { Tabs } from "@heroui/react";

import type { Route } from "./+types/layout";
import { queryClient } from "~/lib/query-client";
import { PageTransition } from "~/components/page-transition";
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
      <header className="border-b border-(--border) bg-(--surface) px-6">
        <div className="flex items-center gap-8 h-14">
          <span className="font-bold text-base shrink-0">Flagship Tracker</span>
          <Tabs selectedKey={active}>
            <Tabs.ListContainer>
              <Tabs.List aria-label="Senior navigation">
                {NAV_TABS.map((tab) => (
                  <Tabs.Tab key={tab.id} id={tab.id} href={tab.href}>
                    {tab.label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      </header>
      <main className="p-6">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
