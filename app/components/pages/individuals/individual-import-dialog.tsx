import ImportDialog, { type ImportDialogConfig } from "~/components/import/import-dialog";
import { importIndividuals } from "~/lib/individual-import/api";
import { useIndividualImportLookups } from "~/lib/individual-import/lookups";
import { parseIndividualFile } from "~/lib/individual-import/parse";
import {
  INDIVIDUALS_SHEET,
  INDIVIDUAL_COLUMNS,
  MAX_INDIVIDUALS_PER_IMPORT,
  TEMPLATE_FILENAME,
} from "~/lib/individual-import/schema";
import { buildIndividualImportTemplate } from "~/lib/individual-import/template";
import type { IndividualImportItem } from "~/lib/individual-import/types";
import { fieldLabel } from "~/lib/import/schema";
import { individualsQueryOptions } from "~/lib/queries/individuals";

interface IndividualImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Where "View individuals" goes after a successful import. */
  individualsPath: string;
}

const CONFIG: ImportDialogConfig = {
  noun: { singular: "individual", plural: "individuals" },
  title: "Upload individuals sheet",
  intro: (
    <>
      Register many individuals from one Excel file. Download the template, fill in one row per individual (required
      columns are marked with *), then upload it. Every row is checked with the same rules as the Add Individual form,
      and a National ID or phone number that is already registered, or repeated in the file, is flagged. You will see
      every problem before anything is saved.
    </>
  ),
  limitNote: `At most ${MAX_INDIVIDUALS_PER_IMPORT} individuals per file. Youth Status is required and is saved with each individual.`,
  templateFilename: TEMPLATE_FILENAME,
  fileInputTestId: "individual-import-file",
  fieldHeader: (_sheet, field) => fieldLabel(INDIVIDUAL_COLUMNS, field),
  mainSheet: INDIVIDUALS_SHEET,
  invalidate: [individualsQueryOptions.queryKey, ["viz"]],
  doneLabel: "View individuals",
  donePath: "",
  doneNote: "Dashboards refresh shortly after the import.",
};

/** Individuals import: the individuals template, parser and API on top of the shared import dialog. */
export default function IndividualImportDialog({ isOpen, onClose, individualsPath }: IndividualImportDialogProps) {
  const { lookups, isLoading, isError } = useIndividualImportLookups(isOpen);

  return (
    <ImportDialog<IndividualImportItem>
      isOpen={isOpen}
      onClose={onClose}
      config={{ ...CONFIG, donePath: individualsPath }}
      ready={lookups !== null}
      loading={isLoading}
      loadError={isError}
      buildTemplate={() => buildIndividualImportTemplate(lookups!)}
      parse={(file) => parseIndividualFile(file, lookups!)}
      send={importIndividuals}
    />
  );
}
