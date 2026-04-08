import { useQuery } from "@tanstack/react-query";
import { Button, Card } from "@heroui/react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { IconFlag, IconAlertTriangle } from "@tabler/icons-react";

import { healthQueryOptions } from "~/lib/queries/health";
import { StatCard } from "~/components/stat-card";

export default function Index() {
  const { isSuccess, isError, isPending } = useQuery(healthQueryOptions);

  return (
    <main className="min-h-screen bg-(--background) text-(--foreground) flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Flagship Tracker</h1>
          <p className="text-(--muted)">Developer landing page</p>
        </div>

        {/* Stat card examples */}
        <div className="space-y-3">
          <StatCard
            color="#3b82f6"
            icon={<IconFlag size={20} />}
            stat={24}
            label="Total Flagships"
            statDescription="across all departments"
          />
          <StatCard
            color="#f97316"
            icon={<IconAlertTriangle size={20} />}
            stat={4}
            label="At Risk"
            statDescription="require attention"
          />
        </div>

        {/* Health status */}
        <Card>
          <Card.Header>
            <Card.Title>System Status</Card.Title>
            <Card.Description>Checking backend and database connection</Card.Description>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isPending ? (
              <div className="flex items-center gap-2 text-sm text-(--muted)">
                <span className="h-2 w-2 rounded-full bg-(--muted) animate-pulse" />
                Checking connection…
              </div>
            ) : isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-success"
              >
                <span className="h-2 w-2 rounded-full bg-success" />
                Backend and database connected — ready to start dev.
              </motion.div>
            ) : isError ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center gap-2 text-sm text-danger">
                  <span className="h-2 w-2 rounded-full bg-danger" />
                  Backend or database not connected.
                </div>
                <p className="text-xs text-(--muted) pl-4">
                  Check <code className="font-mono">.env</code> → <code className="font-mono">VITE_API_BASE_URL</code>, confirm the backend is running, or open the Network tab for details.
                </p>
              </motion.div>
            ) : null}
          </Card.Content>
        </Card>

        {/* Navigation shortcuts */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Navigation</Card.Title>
            <Card.Description>Jump to a section of the app</Card.Description>
          </Card.Header>
          <Card.Content className="p-4 pt-0 grid grid-cols-2 gap-3">
            <Link to="/login">
              <Button variant="outline" fullWidth>Login</Button>
            </Link>
            <Link to="/admin/dashboard">
              <Button variant="outline" fullWidth>Admin Dashboard</Button>
            </Link>
            <Link to="/senior/dashboard">
              <Button variant="outline" fullWidth>Senior Dashboard</Button>
            </Link>
            <Link to="/me/flagships">
              <Button variant="outline" fullWidth>M&amp;E Flagships</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    </main>
  );
}
