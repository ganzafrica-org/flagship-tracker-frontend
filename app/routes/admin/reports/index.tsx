import { useQuery } from "@tanstack/react-query";
import { Card, Skeleton } from "@heroui/react";

import type { Route } from "./+types/index";
import { reportsQueryOptions } from "~/lib/queries/reports";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Reports | Admin" }];
}

export default function AdminReports() {
  const { data: reports, isLoading } = useQuery(reportsQueryOptions);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))
          : reports?.map((r) => (
              <Card key={r.id}>
                <Card.Header>
                  <Card.Title>{r.title}</Card.Title>
                  <Card.Description>{r.createdAt}</Card.Description>
                </Card.Header>
              </Card>
            ))}
      </div>
    </div>
  );
}
