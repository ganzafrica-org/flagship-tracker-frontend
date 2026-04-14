import { Button, Card } from "@heroui/react";
import { Link } from "react-router";
import {
  IconArrowRight,
  IconChartBar,
  IconFlag,
  IconLayoutDashboard,
  IconUsers,
} from "@tabler/icons-react";
import Navbar from "~/components/navigation/navbar";

export default function Index() {
  return (
    <main className="h-screen overflow-hidden bg-(--background) text-(--foreground)">
      <Navbar onMenuToggle={() => undefined} userName="Demo User" />
      <div className="h-[calc(100vh-4rem)] p-4 md:p-5">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4">
          <Card style={{ borderRadius: "8px" }} className="rounded-lg border border-(--separator) bg-(--surface)">
            <Card.Content className="p-5 md:p-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Flagship Tracker Platform
                </h1>
                <p className="max-w-3xl text-sm text-(--muted)">
                  Explore role-based pages and flows using the current UI mock data.
                </p>
              </div>
            </Card.Content>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card style={{ borderRadius: "8px" }} className="rounded-lg border border-(--separator) bg-(--surface)">
              <Card.Content className="p-4">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--accent-icon-bg) text-(--accent)">
                  <IconLayoutDashboard size={18} />
                </div>
                <p className="text-sm text-(--muted)">Admin</p>
                <p className="text-lg font-semibold">Dashboard + Management</p>
              </Card.Content>
            </Card>
            <Card style={{ borderRadius: "8px" }} className="rounded-lg border border-(--separator) bg-(--surface)">
              <Card.Content className="p-4">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--warning-icon-bg) text-(--warning)">
                  <IconChartBar size={18} />
                </div>
                <p className="text-sm text-(--muted)">Senior Officials</p>
                <p className="text-lg font-semibold">Analytics + Oversight</p>
              </Card.Content>
            </Card>
            <Card style={{ borderRadius: "8px" }} className="rounded-lg border border-(--separator) bg-(--surface)">
              <Card.Content className="p-4">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--forest-icon-bg) text-(--forest)">
                  <IconUsers size={18} />
                </div>
                <p className="text-sm text-(--muted)">M&amp;E Team</p>
                <p className="text-lg font-semibold">Data + Reporting Workflows</p>
              </Card.Content>
            </Card>
            <Card style={{ borderRadius: "8px" }} className="rounded-lg border border-(--separator) bg-(--surface)">
              <Card.Content className="p-4">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--danger-icon-bg) text-(--danger)">
                  <IconFlag size={18} />
                </div>
                <p className="text-sm text-(--muted)">Flagship Scope</p>
                <p className="text-lg font-semibold">Projects, Users, Reports</p>
              </Card.Content>
            </Card>
          </div>

          <Card style={{ borderRadius: "8px" }} className="rounded-lg border border-(--separator) bg-(--surface)">
            <Card.Header>
              <Card.Title>Open a Role Experience</Card.Title>
              <Card.Description>
                Jump directly to the pages you want to present.
              </Card.Description>
            </Card.Header>
            <Card.Content className="grid gap-3 p-4 pt-0 md:grid-cols-3">
              <Link to="/admin/dashboard">
                <Button variant="outline" fullWidth className="justify-between">
                  Admin Dashboard
                  <IconArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/senior/dashboard">
                <Button variant="outline" fullWidth className="justify-between">
                  Senior Dashboard
                  <IconArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/me/flagships">
                <Button variant="outline" fullWidth className="justify-between">
                  M&amp;E Dashboard
                  <IconArrowRight size={16} />
                </Button>
              </Link>
            </Card.Content>
          </Card>
        </div>
      </div>
    </main>
  );
}
