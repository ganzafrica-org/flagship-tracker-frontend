import ImportDialog, { type ImportDialogConfig } from "~/components/import/import-dialog";
import { importFlagships } from "~/lib/flagship-import/api";
import { useFlagshipImportLookups } from "~/lib/flagship-import/lookups";
import { parseImportFile } from "~/lib/flagship-import/parse";
import {
  MAX_FLAGSHIPS_PER_IMPORT,
  SHEET_COLUMNS,
  SHEET_NAMES,
  SHEET_ORDER,
  TEMPLATE_FILENAME,
} from "~/lib/flagship-import/schema";
import { buildImportTemplate } from "~/lib/flagship-import/template";
import type { ImportRequestItem } from "~/lib/flagship-import/types";
import { fieldLabel } from "~/lib/import/schema";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";

interface FlagshipImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Where "View flagships" goes after a successful import. */
  flagshipsPath: string;
}

/** Flagship import: the flagship-specific template, parser and API on top of the shared import dialog. */
export default function FlagshipImportDialog({ isOpen, onClose, flagshipsPath }: FlagshipImportDialogProps) {
  const { lookups, isLoading, isError } = useFlagshipImportLookups(isOpen);

  const config: ImportDialogConfig = {
    noun: { singular: "flagship", plural: "flagships" },
    title: "Import flagships",
    intro: (
      <>
        Create complete flagship projects from one Excel file. The template has a sheet for each step of the form (
        {SHEET_ORDER.map((id) => SHEET_NAMES[id]).join(", ")}); rows on the other sheets are linked to a flagship by its
        Flagship Code. You will see every problem before anything is saved.
      </>
    ),
    limitNote: `At most ${MAX_FLAGSHIPS_PER_IMPORT} flagships per file. A flagship code that already exists is rejected.`,
    templateFilename: TEMPLATE_FILENAME,
    fileInputTestId: "flagship-import-file",
    fieldHeader: (sheet, field) => {
      const id = SHEET_ORDER.find((s) => SHEET_NAMES[s] === sheet) ?? "basic";
      return fieldLabel(SHEET_COLUMNS[id], field);
    },
    mainSheet: SHEET_NAMES.basic,
    orphanTitle: "Rows not linked to a flagship (will be ignored)",
    invalidate: [flagshipsQueryOptions.queryKey, ["viz"]],
    doneLabel: "View flagships",
    donePath: flagshipsPath,
    doneNote: "The dashboard summary refreshes shortly after the import, as it does after saving a single flagship.",
  };

  return (
    <ImportDialog<ImportRequestItem>
      isOpen={isOpen}
      onClose={onClose}
      config={config}
      ready={lookups !== null}
      loading={isLoading}
      loadError={isError}
      buildTemplate={() => buildImportTemplate(lookups!)}
      parse={(file) => parseImportFile(file, lookups!)}
      send={importFlagships}
    />
  );
}
