import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";

import TableComponent from "~/components/table-component";
import { ExcelImportButton, notifySpreadsheetImport } from "~/components/excel-import-button";
import { PageTitleCard } from "~/components/page-title-card";
import { importFundersFromSheet } from "~/lib/entity-imports";
import AppAlertDialog from "~/components/app-alert-dialog";
import FunderDialog from "~/components/pages/admin/funder-dialog";
import RecordDetailsDialog from "~/components/record-details-dialog";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { fundersQueryOptions, type Funder } from "~/lib/queries/lookups";
import { flagshipsQueryOptions } from "~/lib/queries/flagships";
import { funderFundingSummary } from "~/lib/funder-funding";
import { useFunderRecord } from "~/lib/record-details";
import { useRecordDialog } from "~/lib/use-record-dialog";

interface FundersManagementProps {
  basePath?: string;
  readOnly?: boolean;
  /** Edit a funder in a dialog on this page instead of navigating to the form page. */
  editInDialog?: boolean;
}

export default function FundersManagement({
  basePath = "/admin",
  readOnly = false,
  editInDialog = false,
}: FundersManagementProps = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery(fundersQueryOptions());

  const [toDelete, setToDelete] = useState<Funder | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  // Resolved from the query data so the dialog shows the saved values after a refetch.
  const editFunder = editId !== null ? (data.find((f) => f.id === editId) ?? null) : null;

  const view = useRecordDialog();
  const record = useFunderRecord(view.id);

  function editFunderById(id: number) {
    if (editInDialog) setEditId(id);
    else navigate(`${basePath}/funders/add?editId=${id}`);
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/lookups/funders/${id}`),
    onSuccess: () => {
      toast.success("Funder deleted");
      queryClient.invalidateQueries({ queryKey: ["funders"] });
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete funder"),
  });

  const rows = useMemo(
    () =>
      data.map((f) => {
        const summary = funderFundingSummary(flagships, f.funderName);
        return {
          id: f.id,
          funderName: f.funderName,
          funderType: f.funderType,
          flagships: summary.flagships,
          fundingBudget: summary.fundingCommitted,
          providedBudget: summary.fundingProjected,
        };
      }),
    [data, flagships],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title="Funders"
        actionSlot={
          readOnly ? undefined : (
            <div className="flex gap-3">
              <Button variant="outline" className="!rounded-3xl" onPress={() => navigate(`${basePath}/funders/types`)}>
                Manage Types
              </Button>
              <ExcelImportButton
                variant="outline"
                onImport={async (rows) => {
                  const outcome = await importFundersFromSheet(rows);
                  void queryClient.invalidateQueries({ queryKey: ["funders"] });
                  notifySpreadsheetImport(outcome, outcome.created === 1 ? "funder" : "funders");
                }}
              />
              <Button variant="primary" className="!rounded-3xl" onPress={() => navigate(`${basePath}/funders/add`)}>
                Add Funder
              </Button>
            </div>
          )
        }
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load funders"}
        </p>
      ) : null}

      <TableComponent
        tableSectionTitle="Funders"
        exportConfig={{ title: "Funders", fileBase: "funders" }}
        loading={isLoading || flagshipsLoading}
        emptyMessage="No funders yet"
        rows={rows}
        searchKeys={["funderName", "funderType", "flagships"]}
        columns={[
          { key: "id", label: "#", width: "56px" },
          { key: "funderName", label: "Funder Name", width: "200px", headerClassName: "whitespace-nowrap" },
          { key: "funderType", label: "Type", width: "140px", headerClassName: "whitespace-nowrap" },
          { key: "flagships", label: "Flagships", width: "34%" },
          { key: "fundingBudget", label: "Funding committed", width: "190px", headerClassName: "whitespace-nowrap" },
          { key: "providedBudget", label: "Funding projected", width: "190px", headerClassName: "whitespace-nowrap" },
          { key: "action", label: "Action", width: "80px" },
        ]}
        cellRenderers={{
          funderName: (row) => <span className="whitespace-nowrap">{String(row.funderName ?? "")}</span>,
          funderType: (row) => <span className="whitespace-nowrap">{String(row.funderType ?? "")}</span>,
          fundingBudget: (row) => <span className="whitespace-nowrap">{String(row.fundingBudget ?? "")}</span>,
          providedBudget: (row) => <span className="whitespace-nowrap">{String(row.providedBudget ?? "")}</span>,
        }}
        minTableWidthClassName="min-w-[1080px] table-fixed"
        actions={(row) =>
          readOnly
            ? [{ label: "View Details", onClick: () => view.open(Number(row.id)) }]
            : [
                { label: "View Details", onClick: () => view.open(Number(row.id)) },
                { label: "Update", onClick: () => editFunderById(Number(row.id)) },
                { label: "Delete", onClick: () => setToDelete(data.find((f) => f.id === row.id) ?? null), color: "danger" },
              ]
        }
      />

      <RecordDetailsDialog
        testId="funder-details"
        isOpen={view.id !== null}
        onClose={view.close}
        fallbackTitle="Funder Details"
        onEdit={readOnly || view.id === null ? undefined : () => editFunderById(view.id as number)}
        {...record}
      />

      {editInDialog ? <FunderDialog funder={editFunder} onClose={() => setEditId(null)} /> : null}

      <AppAlertDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete funder?"
        description={toDelete ? `This will permanently delete "${toDelete.funderName}". This action cannot be undone.` : ""}
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />
    </div>
  );
}
