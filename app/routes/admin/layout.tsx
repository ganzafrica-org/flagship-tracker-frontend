import { useState } from "react";
import { Outlet } from "react-router";

import type { Route } from "./+types/layout";
import { queryClient } from "~/lib/query-client";
import { PageTransition } from "~/components/page-transition";
import { dashboardQueryOptions } from "~/lib/queries/dashboard";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import { reportsQueryOptions } from "~/lib/queries/reports";
import { usersQueryOptions } from "~/lib/queries/users";
import Navbar from "~/components/navigation/navbar";
import Sidebar from "~/components/navigation/sidebar";

export async function loader(_: Route.LoaderArgs) {
  queryClient.prefetchQuery(dashboardQueryOptions);
  queryClient.prefetchQuery(flagshipsQueryOptions);
  queryClient.prefetchQuery(reportsQueryOptions);
  queryClient.prefetchQuery(usersQueryOptions);
  return null;
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-(--background) text-(--foreground)">
      <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} userName="Admin User" />
      <div className="flex flex-1 min-h-0">
        <Sidebar role="admin" isOpen={sidebarOpen} />
        <main className="flex-1 p-6 overflow-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
