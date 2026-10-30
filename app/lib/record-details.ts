import { useQuery } from "@tanstack/react-query";

import type { ExportSection } from "~/lib/export/table-export";
import {
  cooperativeQueryOptions,
  ENGAGEMENT_TYPE_OPTIONS,
  flagshipOptionsQueryOptions,
  maleMembers,
} from "~/lib/queries/cooperatives";
import { enumValuesQueryOptions, funderQueryOptions } from "~/lib/queries/lookups";
import { USER_ROLE_OPTIONS, usersListQueryOptions } from "~/lib/queries/users";

/** What RecordDetailsDialog needs from a record: spread it onto the dialog. */
export interface RecordView {
  title: string | null;
  sections: ExportSection[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const FIELD_COLUMNS = [
  { key: "field", label: "Field" },
  { key: "value", label: "Value" },
];

const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));
const showDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "—");
const labelFor = (options: { value: string; label: string }[], value: string | null | undefined) =>
  value ? (options.find((o) => o.value === value)?.label ?? value) : "—";

function fields(title: string, pairs: [string, unknown][]): ExportSection {
  return { title, columns: FIELD_COLUMNS, rows: pairs.map(([field, value]) => ({ field, value: show(value) })) };
}

export function useFunderRecord(id: number | null): RecordView {
  const funder = useQuery({ ...funderQueryOptions(id ?? 0), enabled: id != null });
  const types = useQuery({ ...enumValuesQueryOptions("funder_type"), enabled: id != null });
  const f = funder.data;
  return {
    title: f?.funderName ?? null,
    sections: f
      ? [
          fields("Funder", [
            ["Funder name", f.funderName],
            ["Type", labelFor(types.data ?? [], f.funderType)],
            ["Status", f.active ? "Active" : "Inactive"],
          ]),
        ]
      : [],
    isLoading: id != null && (funder.isPending || (types.isPending && !types.isError)) && !funder.isError,
    isError: funder.isError,
    onRetry: () => void funder.refetch(),
  };
}

/** The backend has no per-user endpoint, so the record comes from the full users list. */
export function useUserRecord(id: number | null): RecordView {
  const users = useQuery({ ...usersListQueryOptions, enabled: id != null });
  const u = users.data?.find((x) => x.id === id);
  return {
    title: u?.fullName ?? null,
    sections: u
      ? [
          fields("User", [
            ["Full name", u.fullName],
            ["Email", u.email],
            ["Role", labelFor(USER_ROLE_OPTIONS, u.role)],
            ["Status", u.active ? "Active" : "Inactive"],
            ["Password change required", u.mustChangePassword ? "Yes" : "No"],
            ["Created", showDate(u.createdAt)],
          ]),
        ]
      : [],
    isLoading: id != null && users.isPending,
    // A finished load that does not contain the id (deleted, or a bad link) is an error too.
    isError: users.isError || (users.isSuccess && id != null && !u),
    onRetry: () => void users.refetch(),
  };
}

export function useCooperativeRecord(id: number | null): RecordView {
  const coop = useQuery({ ...cooperativeQueryOptions(id ?? 0), enabled: id != null });
  const groupTypes = useQuery({ ...enumValuesQueryOptions("group_type"), enabled: id != null });
  const statuses = useQuery({ ...enumValuesQueryOptions("registration_status"), enabled: id != null });
  const c = coop.data;
  const hasFlagships = (c?.flagships?.length ?? 0) > 0;
  const flagshipNames = useQuery({ ...flagshipOptionsQueryOptions(), enabled: hasFlagships });

  const sections: ExportSection[] = [];
  if (c) {
    sections.push(
      fields("Basic information", [
        ["Name", c.cooperativeName],
        ["Code", c.cooperativeCode],
        ["Group type", labelFor(groupTypes.data ?? [], c.groupType)],
        ["Registration status", labelFor(statuses.data ?? [], c.registrationStatus)],
        ["Primary value chain", c.primaryValueChain],
        ["Cluster", c.cluster],
      ]),
      fields("Members", [
        ["Total members", c.totalMembers],
        ["Female members", c.femaleMembers],
        ["Male members", c.totalMembers != null ? maleMembers(c.totalMembers, c.femaleMembers) : null],
        ["Youth members", c.youthMembers],
      ]),
      fields("Location", [
        ["Province", c.province],
        ["District", c.district],
        ["Sector", c.sector],
      ]),
    );
    if (hasFlagships) {
      const names = new Map((flagshipNames.data ?? []).map((o) => [Number(o.value), o.label]));
      sections.push({
        title: "Flagship engagement",
        columns: [
          { key: "flagship", label: "Flagship" },
          { key: "engagementType", label: "Engagement type" },
          { key: "startDate", label: "Start date" },
          { key: "endDate", label: "End date" },
        ],
        rows: (c.flagships ?? []).map((f) => ({
          flagship: names.get(f.flagshipId) ?? `Flagship #${f.flagshipId}`,
          engagementType: labelFor(ENGAGEMENT_TYPE_OPTIONS, f.engagementType),
          startDate: showDate(f.startDate),
          endDate: showDate(f.endDate),
        })),
      });
    }
  }

  return {
    title: c?.cooperativeName ?? null,
    sections,
    isLoading:
      id != null &&
      !coop.isError &&
      (coop.isPending ||
        (groupTypes.isPending && !groupTypes.isError) ||
        (statuses.isPending && !statuses.isError) ||
        (hasFlagships && flagshipNames.isPending && !flagshipNames.isError)),
    isError: coop.isError,
    onRetry: () => void coop.refetch(),
  };
}
