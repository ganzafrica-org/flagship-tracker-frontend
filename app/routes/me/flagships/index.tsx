import { useQuery } from "@tanstack/react-query";
import { Table, Skeleton, Virtualizer, Pagination } from "@heroui/react";
import { TableLayout } from "@heroui/react";
import { useSearchParams } from "react-router";

import type { Route } from "./+types/index";
import ActionDropdown from "~/components/action-dropdown";
import { flagshipsQueryOptions, type Flagship } from "~/lib/queries/flagships";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagships | M&E" }];
}

const PAGE_SIZE = 7;

const STATUS_CLASSES: Record<Flagship["status"], string> = {
  active:   "bg-success/10 text-success",
  inactive: "bg-default/40 text-(--muted)",
  pending:  "bg-warning/10 text-warning",
};

export default function MeFlagships() {
  const { data: flagships = [], isLoading } = useQuery(flagshipsQueryOptions);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Math.max(1, Number(searchParams.get("page") ?? 1));
  const totalPages = Math.ceil(flagships.length / PAGE_SIZE);
  const paged = flagships.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function setPage(page: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(page));
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Flagships</h1>

      <Virtualizer layout={TableLayout} layoutOptions={{ headingHeight: 42, rowHeight: 48 }}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Flagships" className="min-w-[680px]">
              <Table.Header>
                <Table.Column isRowHeader>Name</Table.Column>
                <Table.Column>Lead</Table.Column>
                <Table.Column>Progress</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column>Action</Table.Column>
              </Table.Header>
              <Table.Body>
                {paged.map((f) => (
                  <Table.Row key={f.id}>
                    <Table.Cell className="font-medium">{f.name}</Table.Cell>
                    <Table.Cell>{f.lead}</Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-(--default)">
                          <div className="h-full rounded-full bg-(--accent)" style={{ width: `${f.progress}%` }} />
                        </div>
                        <span className="text-xs text-(--muted) w-8 text-right">{f.progress}%</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_CLASSES[f.status]}`}>
                        {f.status}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <ActionDropdown
                        actions={[
                          { label: "View Details", onClick: () => undefined },
                          { label: "Update", onClick: () => undefined },
                          { label: "Delete", onClick: () => undefined, color: "danger" },
                        ]}
                      />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Virtualizer>

      <div className="flex items-center justify-between text-sm text-(--muted)">
        <span>
          Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, flagships.length)} of {flagships.length}
        </span>
        <Pagination>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous isDisabled={currentPage === 1} onPress={() => setPage(currentPage - 1)}>
                <Pagination.PreviousIcon />
                <span>Previous</span>
              </Pagination.Previous>
            </Pagination.Item>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Pagination.Item key={p}>
                <Pagination.Link isActive={p === currentPage} onPress={() => setPage(p)}>
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next isDisabled={currentPage === totalPages} onPress={() => setPage(currentPage + 1)}>
                <span>Next</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </div>
    </div>
  );
}
