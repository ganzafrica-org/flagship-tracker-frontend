import { useRef, useState } from "react";
import { Button } from "@heroui/react";
import { IconUpload } from "@tabler/icons-react";

import { toast } from "~/components/app-alert";
import {
  parseSpreadsheet,
  SPREADSHEET_ACCEPT,
  type SpreadsheetImportOutcome,
  type SpreadsheetRow,
} from "~/lib/spreadsheet";

export function notifySpreadsheetImport(
  outcome: SpreadsheetImportOutcome,
  entityLabel: string,
  onImported?: () => void,
) {
  if (outcome.mode === "form") {
    if (outcome.errors.length) {
      const hint = outcome.errors[0].startsWith("No columns") ? "" : " Review the form, then save.";
      toast.warning(`${outcome.errors[0]}${hint}`);
    } else {
      toast.success("Spreadsheet loaded into the form. Review it, then save.");
    }
    return;
  }

  if (outcome.created === 0) {
    toast.error(outcome.errors[0] ?? "No rows were imported.");
    return;
  }

  if (outcome.errors.length) {
    toast.warning(`Imported ${outcome.created} ${entityLabel}. ${outcome.errors[0]}`);
    return;
  }

  toast.success(`Imported ${outcome.created} ${entityLabel}.`);
  onImported?.();
}

interface ExcelImportButtonProps {
  onImport: (rows: SpreadsheetRow[]) => void | Promise<void>;
  label?: string;
  variant?: "primary" | "outline";
}

export function ExcelImportButton({
  onImport,
  label = "Import",
  variant = "primary",
}: ExcelImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPending(true);
    try {
      const rows = await parseSpreadsheet(file);
      if (rows.length === 0) {
        toast.warning("That spreadsheet has no data rows.");
        return;
      }
      await onImport(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that spreadsheet.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={SPREADSHEET_ACCEPT}
        className="sr-only"
        aria-label="Import spreadsheet"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <Button
        variant={variant}
        className="!rounded-3xl font-medium shrink-0"
        style={{ borderRadius: "1.5rem" }}
        isPending={pending}
        onPress={() => inputRef.current?.click()}
      >
        <IconUpload size={16} />
        {label}
      </Button>
    </>
  );
}
