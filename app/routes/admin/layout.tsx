import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";

import type { Route } from "./+types/layout";
import { queryClient } from "~/lib/query-client";
import { PageTransition } from "~/components/page-transition";
import { dashboardQueryOptions } from "~/lib/queries/dashboard";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import { reportsQueryOptions } from "~/lib/queries/reports";
import { usersQueryOptions } from "~/lib/queries/users";
import Navbar from "~/components/navigation/navbar";
import Sidebar from "~/components/navigation/sidebar";
import { clearStoredDemoUser, getRoleHomePath, getStoredDemoUser } from "~/lib/demo-auth";

export async function loader(_: Route.LoaderArgs) {
  queryClient.prefetchQuery(dashboardQueryOptions);
  queryClient.prefetchQuery(flagshipsQueryOptions);
  queryClient.prefetchQuery(reportsQueryOptions);
  queryClient.prefetchQuery(usersQueryOptions);
  return null;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("Admin User");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredDemoUser();

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "admin") {
      navigate(getRoleHomePath(user.role), { replace: true });
      return;
    }

    setUserName(user.name);
    setReady(true);
  }, [navigate]);

  if (!ready) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-(--background) text-(--foreground)">
      <Navbar
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        userName={userName}
        onLogout={() => {
          clearStoredDemoUser();
          navigate("/login", { replace: true });
        }}
      />
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
