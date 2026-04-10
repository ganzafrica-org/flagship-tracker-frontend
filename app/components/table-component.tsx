"use client";

import { useMemo, useState } from "react";
import { Button, Card, Chip, Pagination, Table, Virtualizer } from "@heroui/react";
import { ChevronDownIcon } from "@heroui/shared-icons";
import { IconChevronsRight, IconChevronsLeft  } from '@tabler/icons-react';
import { TableLayout } from "@heroui/react";

import ActionDropdown from "~/components/action-dropdown";
import { dummyManageReports, dummyUserTabs } from "~/data/dummy-data";
import { IconSearch } from "@tabler/icons-react";

const ITEMS_PER_PAGE = 7;

type RowValue = string | number;

interface TableTab {
  key: string;
  label: string;
}

interface TableColumnDef {
  key: string;
  label: string;
}

interface TableActionItem {
  label: string;
  onClick: () => void;
  color?: "default" | "danger";
}

type TableRowData = {
  id: RowValue;
  [key: string]: unknown;
};

interface TableComponentProps {
  tableSectionTitle?: string;
  tableAriaLabel?: string;
  tabs?: TableTab[];
  columns?: TableColumnDef[];
  rows?: TableRowData[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  itemsPerPage?: number;
  minTableWidthClassName?: string;
  filterByTab?: (row: TableRowData, selectedTab: string) => boolean;
  statusColumnKey?: string;
  statusColorMap?: Record<string, "default" | "success" | "warning" | "danger" | "accent">;
  actions?: (row: TableRowData) => TableActionItem[];
}

export default function TableComponent({

  tableSectionTitle = "Recent reports",
  tableAriaLabel = "Manage table",
  columns = [
    { key: "id", label: "#" },
    { key: "name", label: "Report Name" },
    { key: "type", label: "Report Type" },
    { key: "periodOrDate", label: "Date Created" },
    { key: "createdBy", label: "Created By" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" },
  ],
  rows = dummyManageReports as unknown as TableRowData[],
  searchPlaceholder = "Search",
  searchKeys = ["name", "type"],
  itemsPerPage = ITEMS_PER_PAGE,
  minTableWidthClassName = "min-w-[900px]",
  filterByTab = (row, selectedTab) => {
    const status = String(row.status ?? "");
    if (selectedTab === "all") return true;
    if (selectedTab === "active") return status === "Generated";
    if (selectedTab === "planning") return status === "Auto-Generated";
    if (selectedTab === "inactive") return status === "Generated";
    return true;
  },
  statusColumnKey = "status",
  statusColorMap = {
    "Auto-Generated": "success",
    Generated: "default",
  },
  actions = () => [
    { label: "View Details", onClick: () => undefined },
    { label: "Update", onClick: () => undefined },
    { label: "Delete", onClick: () => undefined, color: "danger" },
  ],
}: TableComponentProps) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const searchMatch =
        term.length === 0 ||
        searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(term));

      const tabMatch = filterByTab(row, selectedTab);
      return searchMatch && tabMatch;
    });
  }, [filterByTab, rows, search, searchKeys, selectedTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const paginatedRows = filtered.slice(start, start + itemsPerPage);
  const MoveToFirstPage = () => setPage(1);
  const MoveToLastPage = () => setPage(totalPages);

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <div className="flex justify-between mx-5">
          <h1 className="text-xl font-semibold">{tableSectionTitle}</h1>

          <div className="w-[30%] rounded-full border border-default-300 bg-white px-3 py-3 text-sm flex gap-2">
            <IconSearch stroke={2} className="w-5 h-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full outline-none"
            />
          </div>
        </div>

        <Virtualizer layout={TableLayout} layoutOptions={{ headingHeight: 42, rowHeight: 54 }}>
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={tableAriaLabel} className={minTableWidthClassName}>
                <Table.Header>
                  {columns.map((column) => (
                    <Table.Column key={column.key}>
                      <span className="font-bold text-lg text-black">{column.label}</span>
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body>
                  {paginatedRows.map((row) => (
                    <Table.Row key={String(row.id)}>
                      {columns.map((column) => {
                        if (column.key === "action") {
                          return (
                            <Table.Cell key={`${row.id}-action`}>
                              <ActionDropdown actions={actions(row)} />
                            </Table.Cell>
                          );
                        }

                        if (column.key === statusColumnKey) {
                          const value = String(row[column.key] ?? "");
                          return (
                            <Table.Cell key={`${row.id}-${column.key}`}>
                              <Chip size="sm" variant="soft" color={statusColorMap[value] ?? "default"}>
                                {value}
                              </Chip>
                            </Table.Cell>
                          );
                        }

                        return <Table.Cell key={`${row.id}-${column.key}`}>{String(row[column.key] ?? "")}</Table.Cell>;
                      })}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Virtualizer>

        <div className="flex justify-between border-t border-default-200 pt-4 text-sm">
          <p className="text-sm text-default-500">
            Showing {paginatedRows.length} out of {filtered.length} entries
          </p>
          <Pagination className="w-[30%] flex justify-end items-center">
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous isDisabled={page === 1} onPress={() => setPage(page - 1)}>
                  <IconChevronsLeft stroke={2} onClick={MoveToFirstPage} />
                  <Pagination.PreviousIcon />
                </Pagination.Previous>
              </Pagination.Item>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Pagination.Item key={p}>
                  <Pagination.Link isActive={page === p} onPress={() => setPage(p)} className={`${page === p ? "bg-blue-400 text-white" : "text-default-500"}`}>
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next isDisabled={page === totalPages} onPress={() => setPage(page + 1)}>
                  <Pagination.NextIcon />
                  <IconChevronsRight stroke={2} onClick={MoveToLastPage} />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      </Card>
    </div>
  );
}
