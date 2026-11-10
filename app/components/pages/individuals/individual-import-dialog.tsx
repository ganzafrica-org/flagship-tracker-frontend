import { useQueryClient } from "@tanstack/react-query";

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
import { mapWithConcurrency } from "~/lib/individual-details";
import { individualQueryOptions, individualsQueryOptions, type IndividualsPageItem } from "~/lib/queries/individuals";

interface IndividualImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Where "View individuals" goes after a successful import. */
  individualsPath: string;
  /** Records from the list's current query (with its filters); the template is pre-filled with them. */
  individuals?: IndividualsPageItem[];
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
export default function IndividualImportDialog({ isOpen, onClose, individualsPath, individuals = [] }: IndividualImportDialogProps) {
  const { lookups, isLoading, isError } = useIndividualImportLookups(isOpen);
  const queryClient = useQueryClient();

  // The list endpoint lacks some template columns (National ID, Date of Birth…), so each record's detail
  // is fetched, a few at a time, as the bulk export does.
  async function buildTemplate() {
    const details = await mapWithConcurrency(individuals, 10, (item) =>
      queryClient.fetchQuery(individualQueryOptions(item.individualId)),
    );
    return buildIndividualImportTemplate(lookups!, details);
  }

  return (
    <ImportDialog<IndividualImportItem>
      isOpen={isOpen}
      onClose={onClose}
      config={{ ...CONFIG, donePath: individualsPath }}
      ready={lookups !== null}
      loading={isLoading}
      loadError={isError}
      buildTemplate={buildTemplate}
      parse={(file) => parseIndividualFile(file, lookups!)}
      send={importIndividuals}
    />
  );
}
