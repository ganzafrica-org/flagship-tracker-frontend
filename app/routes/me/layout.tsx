import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";

import type { Route } from "./+types/layout";
import { queryClient } from "~/lib/query-client";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import Navbar from "~/components/navigation/navbar";
import Sidebar from "~/components/navigation/sidebar";
import { getStoredUser, clearUser, logout, getRoleHomePath, hasValidSession, layoutUser } from "~/lib/auth";
import AuthLoading from "~/components/auth/auth-loading";
import { toast } from "~/components/app-alert";
import { useOnlineStatus } from "~/lib/offline-drafts/use-online-status";
import { useDraftCount } from "~/lib/offline-drafts/use-drafts";

export async function clientLoader() {
  if (!hasValidSession()) return null;
  queryClient.prefetchQuery(flagshipsQueryOptions);
  return null;
}

export default function MeLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sessionUser = layoutUser("MONITORING_OFFICER");
  const [userName, setUserName] = useState(sessionUser?.fullName ?? "");

  useEffect(() => {
    if (sessionUser) return;

    const user = getStoredUser();
    if (!hasValidSession() || !user) {
      clearUser();
      navigate("/login", { replace: true });
      return;
    }

    if (user.mustChangePassword) {
      sessionStorage.setItem("mcp_email", user.email);
      navigate("/login/change-password", { replace: true });
      return;
    }

    navigate(getRoleHomePath(user.role), { replace: true });
  }, [navigate, sessionUser?.id, sessionUser?.role]);

  useEffect(() => {
    function syncUserName() {
      const user = getStoredUser();
      if (user) setUserName(user.fullName);
    }
    window.addEventListener("flagship-user-updated", syncUserName);
    return () => window.removeEventListener("flagship-user-updated", syncUserName);
  }, []);

  const { justReconnected, clearJustReconnected } = useOnlineStatus();
  const draftCount = useDraftCount();
  useEffect(() => {
    if (!justReconnected) return;
    if (draftCount > 0) {
      toast.info(
        `You're back online. You have ${draftCount} draft submission(s) waiting — check the Draft tab on Flagships or Individuals to review.`,
      );
    }
    clearJustReconnected();
  }, [justReconnected, draftCount, clearJustReconnected]);

  async function handleLogout() {
    await logout().catch(() => {});
    clearUser();
    navigate("/login", { replace: true });
  }

  if (!sessionUser) return <AuthLoading />;

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
