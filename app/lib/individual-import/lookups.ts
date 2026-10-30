import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { LookupOption } from "~/lib/import/schema";
import { enumLookupQueryOptions } from "~/lib/queries/lookups";
import {
  EDUCATION_LEVEL_OPTIONS,
  REGISTRATION_SOURCE_OPTIONS,
  SEX_OPTIONS,
  YOUTH_CATEGORY_OPTIONS,
} from "./schema";

export interface IndividualImportLookups {
  sex: LookupOption[];
  youthCategory: LookupOption[];
  educationLevel: LookupOption[];
  registrationSource: LookupOption[];
}

function fromEnum(
  items: { value: string; label: string; sortOrder: number }[] | undefined,
  fallback: LookupOption[],
): LookupOption[] {
  if (!items || items.length === 0) return fallback;
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({ value: i.value, label: i.label }));
}

/** The same option lists the Add Individual form uses (API values, with the form's fallbacks). */
export function useIndividualImportLookups(enabled = true) {
  const queries = {
    sex: useQuery({ ...enumLookupQueryOptions("sex"), enabled }),
    youthCategory: useQuery({ ...enumLookupQueryOptions("youth_category"), enabled }),
    educationLevel: useQuery({ ...enumLookupQueryOptions("education_level"), enabled }),
    registrationSource: useQuery({ ...enumLookupQueryOptions("registration_source"), enabled }),
  };
  const all = Object.values(queries);

  const lookups = useMemo<IndividualImportLookups | null>(() => {
    // A failed lookup falls back to the form's built-in options, exactly like the form does.
    if (all.some((q) => q.isPending && q.fetchStatus !== "idle")) return null;
    return {
      sex: fromEnum(queries.sex.data, SEX_OPTIONS),
      youthCategory: fromEnum(queries.youthCategory.data, YOUTH_CATEGORY_OPTIONS),
      educationLevel: fromEnum(queries.educationLevel.data, EDUCATION_LEVEL_OPTIONS),
      registrationSource: fromEnum(queries.registrationSource.data, REGISTRATION_SOURCE_OPTIONS),
    };
  }, all.map((q) => q.data ?? q.status));

  return { lookups, isLoading: all.some((q) => q.isLoading), isError: false };
}
