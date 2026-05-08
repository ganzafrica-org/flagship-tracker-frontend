import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Button,
  Card,
  Label,
  ListBox,
  SearchField,
  Select,
} from "@heroui/react";
import {
  IconEdit,
  IconUserPlus,
} from "@tabler/icons-react";

import { dummyIndividuals, type DummyIndividual } from "~/data/dummy-data";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { PageTitleCard } from "~/components/page-title-card";

// ─── Pagination helpers ───────────────────────────────────────────────────────

const PAGE_SIZE = 8;

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  flagship: "bg-blue-100 text-blue-700",
  "walk-in": "bg-green-100 text-green-700",
  referral: "bg-purple-100 text-purple-700",
  survey: "bg-orange-100 text-orange-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  student: "Student",
  graduate: "Graduate",
  neet: "NEET",
  employed: "Employed",
  self_employed: "Self-Employed",
  other: "Other",
};

// ─── Individual row card ──────────────────────────────────────────────────────

function IndividualRow({ individual, onEdit, readOnly }: { individual: DummyIndividual; onEdit: () => void; readOnly?: boolean }) {
  const fullName = `${individual.first_name} ${individual.last_name}`;
  const location = [individual.district, individual.province].filter(Boolean).join(", ");
  const sourceBadge = SOURCE_COLORS[individual.registration_source] ?? "bg-gray-100 text-gray-600";
  const categoryLabel = individual.youth_category ? CATEGORY_LABELS[individual.youth_category] : null;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-(--border) last:border-0 hover:bg-(--default)/40 transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-(--accent)/15 text-(--accent) flex items-center justify-center text-sm font-semibold shrink-0">
          {individual.first_name[0]}{individual.last_name[0]}
        </div>

        {/* Name + meta */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-(--foreground) truncate">{fullName}</p>
          <p className="text-xs text-(--muted-foreground) truncate">{individual.phone_number}</p>
        </div>
      </div>

      {/* Sex */}
      <div className="hidden sm:block w-16 shrink-0 text-xs text-(--muted-foreground)">
        {individual.sex}
      </div>

      {/* Category */}
      <div className="hidden md:block w-24 shrink-0">
        {categoryLabel && (
          <span className="inline-block text-xs bg-(--default) text-(--foreground) px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>
        )}
      </div>

      {/* Flagship */}
      <div className="hidden lg:block w-28 shrink-0 text-xs text-(--muted-foreground) truncate">
        {individual.flagship_name ?? "—"}
      </div>

      {/* Location */}
      <div className="hidden lg:block w-36 shrink-0 text-xs text-(--muted-foreground) truncate">
        {location}
      </div>

      {/* Source badge */}
      <div className="hidden xl:block w-20 shrink-0">
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${sourceBadge}`}>
          {individual.registration_source}
        </span>
      </div>

      {/* Edit */}
      {!readOnly && (
        <button
          onClick={onEdit}
          className="text-(--muted-foreground) hover:text-(--accent) transition-colors shrink-0 p-1"
          aria-label="Edit individual"
        >
          <IconEdit size={16} />
        </button>
      )}
      {readOnly && <div className="w-6 shrink-0" />}
    </div>
  );
}

// ─── Column header ────────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className="flex items-center gap-4 px-5 py-2 border-b border-(--border) bg-(--default)/30">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-9 shrink-0" />
        <span className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wide">Name</span>
      </div>
      <span className="hidden sm:block w-16 text-xs font-semibold text-(--muted-foreground) uppercase tracking-wide shrink-0">Sex</span>
      <span className="hidden md:block w-24 text-xs font-semibold text-(--muted-foreground) uppercase tracking-wide shrink-0">Category</span>
      <span className="hidden lg:block w-28 text-xs font-semibold text-(--muted-foreground) uppercase tracking-wide shrink-0">Flagship</span>
      <span className="hidden lg:block w-36 text-xs font-semibold text-(--muted-foreground) uppercase tracking-wide shrink-0">Location</span>
      <span className="hidden xl:block w-20 text-xs font-semibold text-(--muted-foreground) uppercase tracking-wide shrink-0">Source</span>
      <div className="w-6 shrink-0" />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationBarProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

function PaginationBar({ page, totalPages, onPage }: PaginationBarProps) {
  if (totalPages <= 1) return null;
  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-xs rounded-3xl border border-(--border) disabled:opacity-40 hover:bg-(--default) transition-colors"
      >
        Previous
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-xs text-(--muted-foreground)">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 text-xs rounded-full transition-colors ${
              p === page
                ? "bg-(--accent) text-(--accent-foreground)"
                : "hover:bg-(--default) text-(--foreground)"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-xs rounded-3xl border border-(--border) disabled:opacity-40 hover:bg-(--default) transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// ─── Main list component ──────────────────────────────────────────────────────

interface IndividualsListProps {
  addPath?: string;
  updatePath?: string;
  readOnly?: boolean;
}

export default function IndividualsList({ addPath, updatePath, readOnly = false }: IndividualsListProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-backed state ──
  const search = searchParams.get("q") ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const flagshipParam = searchParams.get("flagships") ?? "";
  const selectedFlagshipIds = useMemo(
    () => new Set(flagshipParam ? flagshipParam.split(",").filter(Boolean) : []),
    [flagshipParam]
  );

  // ── Local filter state (flagship multiselect) ──
  const flagshipOptions = useMemo(
    () => flagshipDummyData.map((f) => ({ id: String(f.id), label: f.title })),
    []
  );

  function setSearch(q: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (q) next.set("q", q); else next.delete("q");
      next.set("page", "1");
      return next;
    });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    });
  }

  function setFlagships(keys: Set<string>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (keys.size > 0) next.set("flagships", Array.from(keys).join(","));
      else next.delete("flagships");
      next.set("page", "1");
      return next;
    });
  }

  // ── Filtering ──
  const filtered = useMemo(() => {
    let rows: DummyIndividual[] = dummyIndividuals;

    if (selectedFlagshipIds.size > 0) {
      rows = rows.filter((r) =>
        r.flagship_id != null && selectedFlagshipIds.has(String(r.flagship_id))
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
          r.phone_number.includes(q) ||
          (r.national_id ?? "").includes(q) ||
          (r.district ?? "").toLowerCase().includes(q)
      );
    }

    return rows;
  }, [search, selectedFlagshipIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Flagship multiselect trigger label ──
  const flagshipTriggerLabel =
    selectedFlagshipIds.size === 0
      ? "Filter by flagship"
      : selectedFlagshipIds.size === 1
      ? (flagshipOptions.find((f) => selectedFlagshipIds.has(f.id))?.label ?? "1 flagship")
      : `${selectedFlagshipIds.size} flagships`;

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title="Individuals"
        actionSlot={
          readOnly ? undefined : (
            <div className="flex gap-3">
              {updatePath && (
                <Button
                  variant="outline"
                  className="!rounded-3xl font-medium"
                  onPress={() => navigate(updatePath, { viewTransition: true })}
                >
                  <IconEdit size={16} />
                  Update
                </Button>
              )}
              {addPath && (
                <Button
                  variant="primary"
                  className="!rounded-3xl font-medium"
                  onPress={() => navigate(addPath, { viewTransition: true })}
                >
                  <IconUserPlus size={16} />
                  Add Individual
                </Button>
              )}
            </div>
          )
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <SearchField
            className="flex-1 min-w-52"
            value={search}
            onChange={setSearch}
          >
            <Label className="sr-only">Search individuals</Label>
            <SearchField.Group className="h-10 border border-(--border) rounded-3xl px-3 flex items-center gap-2 bg-(--surface)">
              <SearchField.SearchIcon className="text-(--muted-foreground)" />
              <SearchField.Input
                placeholder="Search by name, phone, ID, district…"
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-(--muted-foreground)"
              />
              <SearchField.ClearButton className="text-(--muted-foreground) hover:text-(--foreground)" />
            </SearchField.Group>
          </SearchField>

          {/* Flagship multiselect */}
          <Select
            selectionMode="multiple"
            selectedKeys={selectedFlagshipIds}
            onSelectionChange={(keys) => setFlagships(new Set(Array.from(keys).map(String)))}
            className="w-60"
            placeholder="Filter by flagship"
          >
            <Label className="sr-only">Filter by flagship</Label>
            <Select.Trigger className="h-10 border border-(--border) rounded-3xl px-3 text-sm text-(--foreground) w-full flex items-center gap-2">
              <Select.Value>
                {() => <span className="truncate text-sm">{flagshipTriggerLabel}</span>}
              </Select.Value>
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="w-80">
              <ListBox selectionMode="multiple">
                {flagshipOptions.map((opt) => (
                  <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                    {opt.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {/* Result count */}
          <span className="text-xs text-(--muted-foreground) self-center">
            {filtered.length} {filtered.length === 1 ? "individual" : "individuals"}
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <TableHeader />
        {pageRows.length === 0 ? (
          <div className="py-16 text-center text-sm text-(--muted-foreground)">
            No individuals match your filters.
          </div>
        ) : (
          pageRows.map((ind) => (
            <IndividualRow
              key={ind.id}
              individual={ind}
              readOnly={readOnly}
              onEdit={() => updatePath ? navigate(`${updatePath}?editId=${ind.id}`, { viewTransition: true }) : undefined}
            />
          ))
        )}
        <PaginationBar page={safePage} totalPages={totalPages} onPage={setPage} />
      </Card>
    </div>
  );
}
