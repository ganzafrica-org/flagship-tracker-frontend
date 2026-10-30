import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@heroui/react";

import AppModal from "~/components/app-modal";
import AppSkeleton from "~/components/app-skeleton";
import { restoreActionFocus } from "~/components/action-dropdown";
import type { ExportSection } from "~/lib/export/table-export";

function SectionView({ section, testId }: { section: ExportSection; testId: string }) {
  const isFieldList = section.columns.length === 2 && section.columns[0].key === "field";
  return (
    <section className="space-y-2" data-testid={`${testId}-section-${(section.title ?? "").toLowerCase().replace(/\s+/g, "-")}`}>
      <h3 className="text-sm font-semibold text-(--foreground)">{section.title}</h3>
      {isFieldList ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {section.rows.map((row) => (
            <div key={String(row.field)} className="min-w-0">
              <dt className="text-xs text-(--muted)">{String(row.field)}</dt>
              <dd className="break-words text-sm text-(--foreground)">{String(row.value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-(--separator)">
          <table className="w-full text-left text-sm">
            <thead className="bg-(--default)">
              <tr>
                {section.columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2 font-semibold">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, i) => (
                <tr key={i} className="border-t border-(--separator)">
                  {section.columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 align-top">{String(row[c.key] ?? "—")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading details" data-testid="record-details-loading">
      {[0, 1].map((section) => (
        <div key={section} className="space-y-3">
          <AppSkeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((field) => (
              <div key={field} className="space-y-1.5">
                <AppSkeleton className="h-3 w-20" />
                <AppSkeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface RecordDetailsDialogProps {
  /** Closed while false; the record is fetched by the caller's hook only once it is open. */
  isOpen: boolean;
  onClose: () => void;
  /** Heading once the record has loaded. */
  title?: string | null;
  /** Heading while loading / on error, e.g. "Funder Details". */
  fallbackTitle: string;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  sections: ExportSection[];
  /** Extra footer actions, e.g. a Download menu. */
  actions?: ReactNode;
  /** Pass only for roles that may edit: adds an Edit button. Senior is view-only, so omit it. */
  onEdit?: () => void;
  /** Prefix for data-testid hooks. */
  testId: string;
}

/**
 * The one dialog every table uses to show a single record: header, sections, footer actions.
 * Loading shows a skeleton and a failed fetch shows an error with Retry, both inside the dialog.
 */
export default function RecordDetailsDialog({
  isOpen,
  onClose,
  title,
  fallbackTitle,
  isLoading,
  isError,
  onRetry,
  sections,
  actions,
  onEdit,
  testId,
}: RecordDetailsDialogProps) {
  // Return focus to the row's action button whenever the dialog closes (Esc, Close, or browser Back).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !isOpen) restoreActionFocus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={title || fallbackTitle}
      dialogClassName="w-full sm:max-w-4xl"
      fullScreenOnMobile
      footer={
        <>
          {!isLoading && !isError ? actions : null}
          {onEdit && !isLoading && !isError ? (
            <Button variant="outline" className="!rounded-3xl" onPress={onEdit}>
              Edit
            </Button>
          ) : null}
          <Button variant="primary" className="!rounded-3xl" onPress={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1 max-sm:max-h-[calc(100dvh-11rem)]" data-testid={testId}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-(--danger)">Could not load this record.</p>
            {onRetry ? (
              <Button variant="outline" size="sm" className="!rounded-3xl" onPress={onRetry}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : (
          sections.map((section) => <SectionView key={section.title} section={section} testId={testId} />)
        )}
      </div>
    </AppModal>
  );
}
