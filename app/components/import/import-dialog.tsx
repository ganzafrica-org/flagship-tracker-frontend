import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Button, Chip, Spinner } from "@heroui/react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { IconDownload, IconUpload } from "@tabler/icons-react";

import AppModal from "~/components/app-modal";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import { saveBlob } from "~/lib/import/template";
import type {
  ImportIssue,
  ParsedEntity,
  ParsedWorkbook,
  ServerImportResponse,
  ServerImportResult,
} from "~/lib/import/types";

type Phase = "upload" | "checking" | "preview" | "importing" | "done";

export interface ImportDialogConfig {
  /** e.g. { singular: "flagship", plural: "flagships" } */
  noun: { singular: string; plural: string };
  title: string;
  intro: ReactNode;
  limitNote: string;
  templateFilename: string;
  fileInputTestId: string;
  /** Header text for a server error's request field on a sheet (falls back to the field key). */
  fieldHeader: (sheet: string, field: string | null) => string;
  /** Sheet that holds the entities, named in the "nothing found" message. */
  mainSheet: string;
  orphanTitle?: string;
  /** Query keys to refresh after a successful import. */
  invalidate: QueryKey[];
  doneLabel: string;
  donePath: string;
  doneNote?: string;
}

interface ImportDialogProps<TPayload extends { row: number }> {
  isOpen: boolean;
  onClose: () => void;
  config: ImportDialogConfig;
  /** The lookups the template and the parser need have loaded. */
  ready: boolean;
  loading: boolean;
  loadError: boolean;
  buildTemplate: () => Promise<Blob>;
  parse: (file: File) => Promise<ParsedWorkbook<TPayload>>;
  /** Server side: dryRun validates with the real save path and rolls back; otherwise commits. */
  send: (items: TPayload[], dryRun: boolean) => Promise<ServerImportResponse>;
}

function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return formatApiErrorMessage(error.message);
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function IssueList({ issues, tone = "danger" }: { issues: ImportIssue[]; tone?: "danger" | "warning" }) {
  return (
    <ul className={`mt-2 space-y-1 text-sm ${tone === "warning" ? "text-(--warning)" : "text-(--danger)"}`} data-testid={tone === "warning" ? "import-warnings" : undefined}>
      {issues.map((issue, i) => (
        <li key={`${issue.sheet}-${issue.row}-${issue.field}-${i}`}>
          <span className="font-medium">
            {issue.sheet} · row {issue.row}
            {issue.field ? ` · ${issue.field}` : ""}
          </span>
          {" — "}
          {issue.message}
        </li>
      ))}
    </ul>
  );
}

interface RowState<TPayload> {
  entity: ParsedEntity<TPayload>;
  issues: ImportIssue[];
  warnings: ImportIssue[];
  ready: boolean;
}

/**
 * Upload → preview → confirm → summary wizard shared by every import. Nothing is saved until the
 * user confirms: the preview runs the server's real save path as a dry run and shows every problem
 * by sheet, row and field; confirming imports only the rows that are ready.
 */
export default function ImportDialog<TPayload extends { row: number }>({
  isOpen,
  onClose,
  config,
  ready,
  loading,
  loadError,
  buildTemplate,
  parse,
  send,
}: ImportDialogProps<TPayload>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedWorkbook<TPayload> | null>(null);
  const [serverResults, setServerResults] = useState<Map<number, ServerImportResult>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [validationFailed, setValidationFailed] = useState(false);
  const [final, setFinal] = useState<{ response: ServerImportResponse; notSent: RowState<TPayload>[] } | null>(null);
  const [templateBusy, setTemplateBusy] = useState(false);

  const dryRun = useMutation({ mutationFn: (items: TPayload[]) => send(items, true) });
  const commit = useMutation({ mutationFn: (items: TPayload[]) => send(items, false) });

  const { noun } = config;
  const plural = (n: number) => (n === 1 ? noun.singular : noun.plural);

  function serverIssues(result: ServerImportResult | undefined, key: "errors" | "warnings" = "errors"): ImportIssue[] {
    return (result?.[key] ?? []).map((e) => ({
      sheet: e.sheet,
      row: e.row,
      field: config.fieldHeader(e.sheet, e.field),
      message: e.message,
    }));
  }

  function reset() {
    setPhase("upload");
    setFileName("");
    setParsed(null);
    setServerResults(new Map());
    setError(null);
    setValidationFailed(false);
    setFinal(null);
  }

  function close() {
    if (phase === "checking" || phase === "importing") return;
    reset();
    onClose();
  }

  async function downloadTemplate() {
    if (!ready) return;
    setTemplateBusy(true);
    setError(null);
    try {
      saveBlob(config.templateFilename, await buildTemplate());
    } catch (e) {
      setError(errorText(e, "Could not create the template"));
    } finally {
      setTemplateBusy(false);
    }
  }

  /** Server-side validation (dry run: same rules as saving, rolled back) for every entity that read cleanly. */
  async function validateOnServer(next: ParsedWorkbook<TPayload>) {
    setValidationFailed(false);
    const sendable = next.entities.filter((e) => e.payload !== null);
    if (sendable.length === 0) {
      setServerResults(new Map());
      return;
    }
    try {
      const response = await dryRun.mutateAsync(sendable.map((e) => e.payload as TPayload));
      setServerResults(new Map(response.results.map((r) => [r.row, r])));
    } catch (e) {
      setValidationFailed(true);
      setError(`Could not validate with the server: ${errorText(e, "request failed")}`);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file || !ready) return;
    setError(null);
    setFileName(file.name);
    setPhase("checking");
    try {
      const next = await parse(file);
      setParsed(next);
      if (next.fileProblems.length === 0) await validateOnServer(next);
      setPhase("preview");
    } catch (e) {
      setError(errorText(e, "Could not read the file"));
      setPhase("upload");
    }
  }

  const rowStates: RowState<TPayload>[] = parsed
    ? parsed.entities.map((entity) => {
        const server = serverResults.get(entity.row);
        const issues = [...entity.errors, ...serverIssues(server)];
        const warnings = [...(entity.warnings ?? []), ...serverIssues(server, "warnings")];
        return { entity, issues, warnings, ready: entity.payload !== null && server?.outcome === "VALID" && issues.length === 0 };
      })
    : [];
  const readyRows = rowStates.filter((r) => r.ready);
  const blockedRows = rowStates.filter((r) => !r.ready);
  const warnedCount = readyRows.filter((r) => r.warnings.length > 0).length;
  const canConfirm = phase === "preview" && !validationFailed && parsed?.fileProblems.length === 0 && readyRows.length > 0;

  async function confirmImport() {
    setError(null);
    setPhase("importing");
    try {
      const response = await commit.mutateAsync(readyRows.map((r) => r.entity.payload as TPayload));
      setFinal({ response, notSent: blockedRows });
      for (const queryKey of config.invalidate) void queryClient.invalidateQueries({ queryKey });
      setPhase("done");
    } catch (e) {
      setError(`Import failed: ${errorText(e, "request failed")}. Check the list before trying again.`);
      setPhase("preview");
    }
  }

  const title = phase === "preview" || phase === "importing" ? "Review import" : phase === "done" ? "Import finished" : config.title;

  let footer;
  if (phase === "upload" || phase === "checking") {
    footer = (
      <Button variant="outline" className="!rounded-3xl" isDisabled={phase === "checking"} onPress={close}>
        Cancel
      </Button>
    );
  } else if (phase === "preview" || phase === "importing") {
    footer = (
      <>
        <Button variant="outline" className="!rounded-3xl" isDisabled={phase === "importing"} onPress={reset}>
          Choose another file
        </Button>
        <Button variant="primary" className="!rounded-3xl" isDisabled={!canConfirm} isPending={phase === "importing"} onPress={confirmImport}>
          {`Confirm and import ${readyRows.length} ${plural(readyRows.length)}`}
        </Button>
      </>
    );
  } else {
    footer = (
      <>
        <Button variant="outline" className="!rounded-3xl" onPress={close}>
          Close
        </Button>
        <Button
          variant="primary"
          className="!rounded-3xl"
          onPress={() => {
            reset();
            onClose();
            navigate(config.donePath, { viewTransition: true });
          }}
        >
          {config.doneLabel}
        </Button>
      </>
    );
  }

  const created = final?.response.results.filter((r) => r.outcome === "CREATED") ?? [];
  const failedOnSave = final?.response.results.filter((r) => r.outcome === "FAILED") ?? [];
  const entityByRow = new Map((parsed?.entities ?? []).map((e) => [e.row, e]));

  return (
    <AppModal isOpen={isOpen} onOpenChange={(open) => !open && close()} title={title} footer={footer} dialogClassName="sm:max-w-4xl w-full">
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {error ? (
          <p role="alert" className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
            {error}
          </p>
        ) : null}

        {phase === "upload" || phase === "checking" ? (
          <>
            <p className="text-sm text-(--foreground-600)">{config.intro}</p>
            {loadError ? (
              <p className="text-sm text-(--danger)">Could not load the form options. Check that you are logged in and try again.</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="!rounded-3xl" onPress={downloadTemplate} isDisabled={!ready || templateBusy}>
                <IconDownload size={16} />
                {loading ? "Loading options…" : "Download template"}
              </Button>
              <Button variant="primary" className="!rounded-3xl" onPress={() => fileInput.current?.click()} isDisabled={!ready || phase === "checking"}>
                <IconUpload size={16} />
                Choose Excel file
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                data-testid={config.fileInputTestId}
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="text-xs text-(--muted)">{config.limitNote}</p>
            {phase === "checking" ? (
              <div className="flex items-center gap-2 text-sm text-(--foreground-600)">
                <Spinner size="sm" /> Checking {fileName}…
              </div>
            ) : null}
          </>
        ) : null}

        {(phase === "preview" || phase === "importing") && parsed ? (
          <>
            <p className="text-sm text-(--foreground-600)">
              <span className="font-medium text-(--foreground)">{fileName}</span>
              {parsed.fileProblems.length === 0
                ? ` — ${rowStates.length} ${plural(rowStates.length)}: ${readyRows.length} ready${warnedCount > 0 ? ` (${warnedCount} with warnings)` : ""}, ${blockedRows.length} with errors. Nothing has been saved yet.`
                : ""}
            </p>
            {parsed.fileProblems.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-(--danger)">
                {parsed.fileProblems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : null}
            {parsed.fileProblems.length === 0 && rowStates.length === 0 ? (
              <p className="text-sm text-(--warning)">No {noun.plural} were found on the {config.mainSheet} sheet.</p>
            ) : null}
            {blockedRows.length > 0 && readyRows.length > 0 ? (
              <p className="text-xs text-(--muted)">Rows with errors are skipped; only the ready ones are imported.</p>
            ) : null}

            <div className="space-y-3">
              {rowStates.map(({ entity, issues, warnings, ready: isReady }) => (
                <div key={entity.row} className="rounded-lg border border-(--separator) p-3" data-testid={`import-row-${entity.row}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-(--foreground)">{entity.title}</p>
                      <p className="text-xs text-(--muted)">{entity.subtitle}</p>
                    </div>
                    <Chip size="sm" variant="soft" color={isReady ? "success" : "danger"}>
                      {isReady
                        ? warnings.length > 0
                          ? `Ready · ${warnings.length} ${warnings.length === 1 ? "warning" : "warnings"}`
                          : "Ready"
                        : `${issues.length || 1} ${issues.length === 1 ? "error" : "errors"}`}
                    </Chip>
                  </div>
                  {issues.length > 0 ? <IssueList issues={issues} /> : null}
                  {warnings.length > 0 ? <IssueList issues={warnings} tone="warning" /> : null}
                </div>
              ))}
            </div>

            {parsed.orphanIssues.length > 0 ? (
              <div className="rounded-lg border border-(--warning) p-3">
                <p className="text-sm font-semibold text-(--foreground)">{config.orphanTitle ?? "Rows that will be ignored"}</p>
                <IssueList issues={parsed.orphanIssues} />
              </div>
            ) : null}
          </>
        ) : null}

        {phase === "done" && final ? (
          <>
            <p className="text-sm text-(--foreground)" data-testid="import-summary">
              <span className="font-semibold">{created.length}</span> {plural(created.length)} created
              {failedOnSave.length + final.notSent.length > 0 ? `, ${failedOnSave.length + final.notSent.length} not created` : ""}.
            </p>
            {created.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {created.map((r) => (
                  <li key={r.row}>
                    <Chip size="sm" variant="soft" color="success">Created</Chip> {r.title ?? entityByRow.get(r.row)?.title ?? `Row ${r.row}`}
                    {(r.warnings?.length ?? 0) > 0 ? <IssueList issues={serverIssues(r, "warnings")} tone="warning" /> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {failedOnSave.map((r) => (
              <div key={r.row} className="rounded-lg border border-(--danger) p-3">
                <p className="text-sm font-semibold">
                  {r.title ?? entityByRow.get(r.row)?.title ?? `Row ${r.row}`}{" "}
                  <span className="font-normal text-(--muted)">(row {r.row}, nothing saved)</span>
                </p>
                <IssueList issues={serverIssues(r)} />
              </div>
            ))}
            {final.notSent.map(({ entity, issues }) => (
              <div key={entity.row} className="rounded-lg border border-(--danger) p-3">
                <p className="text-sm font-semibold">
                  {entity.title} <span className="font-normal text-(--muted)">(row {entity.row}, skipped because of errors)</span>
                </p>
                <IssueList issues={issues} />
              </div>
            ))}
            {config.doneNote ? <p className="text-xs text-(--muted)">{config.doneNote}</p> : null}
          </>
        ) : null}
      </div>
    </AppModal>
  );
}
