
import { useMemo, useState } from "react";
import type React from "react";
import { Button, Card, Chip, Label, ListBox, Pagination, SearchField, Select, Table } from "@heroui/react";
import { IconChevronsRight, IconChevronsLeft, IconX } from '@tabler/icons-react';

import ActionDropdown from "~/components/action-dropdown";
import { dummyManageReports, dummyUserTabs } from "~/data/dummy-data";

const ITEMS_PER_PAGE = 7;

type RowValue = string | number;

interface TableTab {
  key: string;
  label: string;
}

interface TableColumnDef {
  key: string;
  label: string;
  width?: string;
}

interface TableActionItem {
  label: string;
  onClick: () => void;
  color?: "default" | "danger";
}

export interface MultiSelectFilterDef {
  key: string;
  placeholder: string;
  options: { id: string; label: string }[];
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
  actions?: ((row: TableRowData) => TableActionItem[]) | undefined;
  multiSelectFilters?: MultiSelectFilterDef[];
}

export default function TableComponent({

  tableSectionTitle = "Recent reports",
  tableAriaLabel = "Manage table",
  columns = [
    { key: "id",           label: "#",           width: "50px"  },
    { key: "name",         label: "Report Name", width: "250px" },
    { key: "type",         label: "Report Type", width: "130px" },
    { key: "periodOrDate", label: "Period",       width: "120px" },
    { key: "createdOn",    label: "Created on",   width: "120px" },
    { key: "createdBy",    label: "Created By",   width: "120px" },
    { key: "action",       label: "Action",       width: "80px"  },
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
  multiSelectFilters = [],
}: TableComponentProps) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [multiSelections, setMultiSelections] = useState<Record<string, Set<string>>>({});

  function getSelection(key: string): Set<string> {
    return multiSelections[key] ?? new Set<string>();
  }

  function setSelection(key: string, selected: Set<string>) {
    setMultiSelections((prev) => ({ ...prev, [key]: selected }));
    setPage(1);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const searchMatch =
        term.length === 0 ||
        searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(term));

      const tabMatch = filterByTab(row, selectedTab);

      const multiMatch = multiSelectFilters.every((filter) => {
        const selected = multiSelections[filter.key];
        if (!selected || selected.size === 0) return true;
        return selected.has(String(row[filter.key] ?? ""));
      });

      return searchMatch && tabMatch && multiMatch;
    });
  }, [filterByTab, multiSelectFilters, multiSelections, rows, search, searchKeys, selectedTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const paginatedRows = filtered.slice(start, start + itemsPerPage);
  const MoveToFirstPage = () => setPage(1);
  const MoveToLastPage = () => setPage(totalPages);

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        {/* Title row: multiselect filters (left) + search (right) */}
        <div className="flex items-center justify-between gap-3 mx-5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-xl font-semibold shrink-0">{tableSectionTitle}</h1>

            {multiSelectFilters.map((filter) => {
              const selected = getSelection(filter.key);
              const triggerLabel =
                selected.size === 0
                  ? filter.placeholder
                  : selected.size === 1
                  ? (filter.options.find((o) => selected.has(o.id))?.label ?? "1 selected")
                  : `${selected.size} selected`;
              return (
                <Select
                  key={filter.key}
                  selectionMode="multiple"
                  selectedKeys={selected}
                  onSelectionChange={(keys) => setSelection(filter.key, new Set(Array.from(keys).map(String)))}
                  className="w-52"
                  placeholder={filter.placeholder}
                >
                  <Label className="sr-only">{filter.placeholder}</Label>
                  <Select.Trigger className="h-9 border border-default-300 rounded-full px-3 text-sm w-full flex items-center gap-2">
                    <Select.Value>
                      {() => <span className="truncate text-sm">{triggerLabel}</span>}
                    </Select.Value>
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="w-64">
                    <ListBox selectionMode="multiple">
                      {filter.options.map((opt) => (
                        <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                          {opt.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              );
            })}
          </div>

          <SearchField
            className="w-[30%]"
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
          >
            <SearchField.Group className="rounded-full border border-default-300" style={{ "--field-background": "var(--default)" } as React.CSSProperties}>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={searchPlaceholder} className="py-2 text-sm outline-none" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>

        {/* Selected chips row — right-aligned, newest on the right */}
        {multiSelectFilters.some((f) => getSelection(f.key).size > 0) && (
          <div className="flex flex-wrap justify-end gap-2 mx-5">
            {multiSelectFilters.flatMap((filter) =>
              Array.from(getSelection(filter.key)).map((id) => {
                const label = filter.options.find((o) => o.id === id)?.label ?? id;
                return (
                  <Chip key={`${filter.key}-${id}`} size="sm" variant="soft" color="accent">
                    <Chip.Label>{label}</Chip.Label>
                    <button
                      aria-label={`Remove ${label}`}
                      onClick={() => {
                        const next = new Set(getSelection(filter.key));
                        next.delete(id);
                        setSelection(filter.key, next);
                      }}
                      className="ml-1 flex items-center opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <IconX size={12} />
                    </button>
                  </Chip>
                );
              })
            )}
          </div>
        )}

          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={tableAriaLabel} className={minTableWidthClassName}>
                <Table.Header>
                  {columns.map((column) => (
                    <Table.Column key={column.key} style={{ width: column.width }}>
                      <span className="font-semibold text-sm text-black">{column.label}</span>
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
                              {actions && <ActionDropdown actions={actions(row)} />}
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
                  <Pagination.Link
                    isActive={page === p}
                    onPress={() => setPage(p)}
                    className={page === p ? "text-white" : "text-default-500"}
                    style={page === p ? { backgroundColor: "var(--accent)" } : undefined}
                  >
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
