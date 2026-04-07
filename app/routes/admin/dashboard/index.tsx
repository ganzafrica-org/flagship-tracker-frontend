import { useQuery } from "@tanstack/react-query";
import { Card, Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import type { Route } from "./+types/index";
import { dashboardQueryOptions } from "~/lib/queries/dashboard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard | Admin" }];
}

const STAT_CARDS = [
  { key: "totalFlagships", label: "Total Flagships" },
  { key: "totalReports",   label: "Total Reports"   },
  { key: "totalUsers",     label: "Total Users"      },
  { key: "activeFlags",    label: "Active Flagships" },
] as const;

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery(dashboardQueryOptions);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          : STAT_CARDS.map(({ key, label }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.25 }}
              >
                <Card>
                  <Card.Content className="p-4 space-y-1">
                    <p className="text-(--muted) text-sm">{label}</p>
                    <p className="text-3xl font-bold">{stats?.[key] ?? "—"}</p>
                  </Card.Content>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Area chart — flagship & report growth */}
        <Card>
          <Card.Header>
            <Card.Title>Growth Trend</Card.Title>
            <Card.Description>Flagships and reports over the last 6 months</Card.Description>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-52 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats?.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFlagships" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="oklch(62.16% 0.1260 233.33)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(62.16% 0.1260 233.33)" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="oklch(73.29% 0.1942 148.35)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(73.29% 0.1942 148.35)" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(90% 0.002 233)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="flagships" stroke="oklch(62.16% 0.1260 233.33)" fill="url(#colorFlagships)" strokeWidth={2} />
                  <Area type="monotone" dataKey="reports"   stroke="oklch(73.29% 0.1942 148.35)" fill="url(#colorReports)"   strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>

        {/* Bar chart — monthly report count */}
        <Card>
          <Card.Header>
            <Card.Title>Monthly Reports</Card.Title>
            <Card.Description>Number of reports submitted per month</Card.Description>
          </Card.Header>
          <Card.Content className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-52 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(90% 0.002 233)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="reports" fill="oklch(62.16% 0.1260 233.33)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
