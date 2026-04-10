import { Outlet, useLocation } from "react-router";
import { Tabs } from "@heroui/react";

import type { Route } from "./+types/layout";
import { queryClient } from "~/lib/query-client";
import { PageTransition } from "~/components/page-transition";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import Navbar from "~/components/navigation/navbar";
import Sidebar from "~/components/navigation/sidebar";
import { useState } from "react";

export async function loader(_: Route.LoaderArgs) {
  queryClient.prefetchQuery(flagshipsQueryOptions);
  return null;
}

const NAV_TABS = [
  { id: "flagships", label: "Flagships", href: "/me/flagships" },
];

export default function MeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-(--background) text-(--foreground)">
      <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} userName="M&E Officer" />
      <div className="flex flex-1 min-h-0">
        <Sidebar role="me" isOpen={sidebarOpen} />
        <main className="flex-1 p-6 overflow-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
