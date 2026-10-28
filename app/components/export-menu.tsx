import { useState } from "react";
import { Button, Dropdown, Label } from "@heroui/react";
import { IconDownload } from "@tabler/icons-react";

import { toast } from "~/components/app-alert";
import { exportTable, type ExportFormat, type ExportTableOptions } from "~/lib/export/table-export";

interface ExportMenuProps {
  /** Runs the export for the chosen format; called at click time so it always reflects the current data. */
  onExport: (format: ExportFormat) => Promise<void> | void;
  label?: string;
  isDisabled?: boolean;
  className?: string;
}

/** Button with an .xlsx / .pdf choice. */
export default function ExportMenu({ onExport, label = "Export", isDisabled, className }: ExportMenuProps) {
  const [busy, setBusy] = useState(false);

  async function run(format: ExportFormat) {
    setBusy(true);
    try {
      await onExport(format);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dropdown>
      <Button variant="outline" className={`!rounded-full ${className ?? ""}`} isDisabled={isDisabled || busy} aria-label={label}>
        <IconDownload size={16} />
        {busy ? "Preparing…" : label}
      </Button>
      <Dropdown.Popover className="min-w-max">
        <Dropdown.Menu onAction={(key) => void run(key === "pdf" ? "pdf" : "xlsx")}>
          <Dropdown.Item id="xlsx" textValue="Excel (.xlsx)">
            <Label>Excel (.xlsx)</Label>
          </Dropdown.Item>
          <Dropdown.Item id="pdf" textValue="PDF (.pdf)">
            <Label>PDF (.pdf)</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/**
 * Export menu for a table: `getOptions` supplies the (already filtered) rows and visible columns.
 * May return a promise (e.g. fetching full per-record detail before export) — the button shows
 * "Preparing…" for the duration via the busy state in `ExportMenu`.
 */
export function TableExportMenu({
  getOptions,
  ...props
}: Omit<ExportMenuProps, "onExport"> & {
  getOptions: () => Omit<ExportTableOptions, "format"> | Promise<Omit<ExportTableOptions, "format">>;
}) {
  return (
    <ExportMenu
      {...props}
      onExport={async (format) => exportTable({ ...(await getOptions()), format })}
    />
  );
}
