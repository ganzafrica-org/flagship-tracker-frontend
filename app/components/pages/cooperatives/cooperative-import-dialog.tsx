import ImportDialog, { type ImportDialogConfig } from "~/components/import/import-dialog";
import { COOPERATIVE_COLUMNS, MAX_COOPERATIVES_PER_IMPORT } from "~/lib/cooperative-import/schema";
import type { CooperativeImportItem } from "~/lib/cooperative-import/types";
import type { CooperativeImporter } from "~/lib/cooperative-import/use-cooperative-import";
import { fieldLabel } from "~/lib/import/schema";
import { cooperativeTypeNames } from "~/lib/queries/cooperatives";

interface CooperativeImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** The page's group type (?type=), e.g. "association". */
  type: string;
  importer: CooperativeImporter;
}

/** Associations / Companies / Cooperatives / Farmer Groups import: the cooperative template, parser and sender on the shared import dialog. */
export default function CooperativeImportDialog({ isOpen, onClose, type, importer }: CooperativeImportDialogProps) {
  const names = cooperativeTypeNames(type);
  const plural = names.plural.toLowerCase();

  const config: ImportDialogConfig = {
    noun: { singular: names.singular.toLowerCase(), plural },
    title: `Upload ${plural} sheet`,
    intro: (
      <>
        Add many {plural} from one Excel file. Download the template (it already lists the {plural} shown on this page),
        add one row per new record (required columns are marked with *), then upload it. Every row is checked with the
        same rules as the Add {names.singular} form. Rows that match an existing record are left unchanged. You will see
        every problem before anything is saved.
      </>
    ),
    limitNote: `At most ${MAX_COOPERATIVES_PER_IMPORT} new records per file. A name that already exists in the same district is rejected.`,
    templateFilename: importer.templateFilename,
    fileInputTestId: "cooperative-import-file",
    fieldHeader: (_sheet, field) => fieldLabel(COOPERATIVE_COLUMNS, field),
    mainSheet: importer.sheet,
    // Same refreshes as saving one record from the Add form.
    invalidate: [["cooperatives"], ["viz", "cooperatives"]],
    doneLabel: `View ${plural}`,
    donePath: `/me/cooperatives?type=${type}`,
    doneNote: "The overview charts refresh shortly after the import.",
  };

  return (
    <ImportDialog<CooperativeImportItem>
      isOpen={isOpen}
      onClose={onClose}
      config={config}
      ready={importer.ready}
      loading={importer.isLoading}
      loadError={importer.isError}
      buildTemplate={importer.buildTemplate}
      parse={importer.parse}
      send={importer.send}
    />
  );
}
