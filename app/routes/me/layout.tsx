import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";

import type { Route } from "./+types/layout";
import { queryClient } from "~/lib/query-client";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import Navbar from "~/components/navigation/navbar";
import Sidebar from "~/components/navigation/sidebar";
import { getStoredUser, clearUser, logout, getRoleHomePath } from "~/lib/auth";
import AuthLoading from "~/components/auth/auth-loading";

export async function clientLoader() {
  queryClient.prefetchQuery(flagshipsQueryOptions);
  return null;
}

export default function MeLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.mustChangePassword) {
      sessionStorage.setItem("mcp_email", user.email);
      navigate("/login/change-password", { replace: true });
      return;
    }

    if (user.role !== "MONITORING_OFFICER") {
      navigate(getRoleHomePath(user.role), { replace: true });
      return;
    }

    setUserName(user.fullName);
    setReady(true);
  }, [navigate]);

  async function handleLogout() {
    await logout().catch(() => {});
    clearUser();
    navigate("/login", { replace: true });
  }

  if (!ready) return <AuthLoading />;

  return (
    <div className="h-screen flex flex-col bg-(--background) text-(--foreground)">
      <Navbar
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        userName={userName}
        onLogout={handleLogout}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar role="me" isOpen={sidebarOpen} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
