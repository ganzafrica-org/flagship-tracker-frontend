import { useQuery } from "@tanstack/react-query";
import { Table, Skeleton, Virtualizer } from "@heroui/react";
import { TableLayout } from "@heroui/react";

import type { Route } from "./+types/index";
import { usersQueryOptions, type User } from "~/lib/queries/users";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Users | Admin" }];
}

const ROLE_CLASSES: Record<User["role"], string> = {
  admin:  "bg-danger/10 text-danger",
  me:     "bg-warning/10 text-warning",
  senior: "bg-accent/10 text-(--accent)",
};

const ROLE_LABELS: Record<User["role"], string> = {
  admin:  "Admin",
  me:     "M&E",
  senior: "Senior Official",
};

export default function AdminUsers() {
  const { data: users = [], isLoading } = useQuery(usersQueryOptions);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-32 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <Virtualizer layout={TableLayout} layoutOptions={{ headingHeight: 42, rowHeight: 56 }}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Users" className="min-w-[520px] max-h-[600px] overflow-auto">
              <Table.Header>
                <Table.Column isRowHeader>Name</Table.Column>
                <Table.Column>Email</Table.Column>
                <Table.Column>Role</Table.Column>
              </Table.Header>
              <Table.Body>
                {users.map((u) => (
                  <Table.Row key={u.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-(--default) flex items-center justify-center text-sm font-medium">
                          {u.name[0]}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-(--muted)">{u.email}</Table.Cell>
                    <Table.Cell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_CLASSES[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Virtualizer>
    </div>
  );
}
