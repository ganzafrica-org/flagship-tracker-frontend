import { Navigate } from "react-router";

/** Value Chains, KPIs and Agencies pages were removed; keep old bookmarks working. */
export default function RemovedPageRedirect() {
  return <Navigate to="/senior/dashboard" replace />;
}
