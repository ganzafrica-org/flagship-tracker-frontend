import { useQuery } from "@tanstack/react-query";
import { Card } from "@heroui/react";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";

import type { Route } from "./+types/index";
import { queryClient } from "~/lib/query-client";
import { flagshipQueryOptions } from "~/lib/queries/flagships";

export async function loader({ params }: Route.LoaderArgs) {
  await queryClient.ensureQueryData(flagshipQueryOptions(Number(params.id)));
  return null;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagship | Admin" }];
}

export default function AdminFlagship({ params }: Route.ComponentProps) {
  const { data: flagship } = useQuery(flagshipQueryOptions(Number(params.id)));

  const chartData = [{ name: "Progress", value: flagship?.progress ?? 0, fill: "var(--accent)" }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{flagship?.name ?? "Flagship"}</h1>
        <p className="text-(--muted) text-sm capitalize">{flagship?.status} · Led by {flagship?.lead}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Progress card with radial chart */}
        <Card>
          <Card.Header>
            <Card.Title>Overall Progress</Card.Title>
          </Card.Header>
          <Card.Content className="flex items-center justify-center p-4 pt-0">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--default)" }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{flagship?.progress ?? 0}%</span>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Details card */}
        <Card>
          <Card.Header>
            <Card.Title>Details</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 pt-0 space-y-3">
            <DetailRow label="Lead"     value={flagship?.lead} />
            <DetailRow label="Status"   value={flagship?.status} />
            <DetailRow label="Progress" value={`${flagship?.progress}%`} />
          </Card.Content>
        </Card>
      </div>
      {/* TODO: add reports, activities, etc. */}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex justify-between text-sm border-b border-(--separator) pb-2 last:border-0 last:pb-0">
      <span className="text-(--muted)">{label}</span>
      <span className="font-medium capitalize">{value ?? "—"}</span>
    </div>
  );
}
