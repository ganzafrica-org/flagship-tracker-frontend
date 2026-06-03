import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppSelect from "~/components/app-select";
import AppAlertDialog from "~/components/app-alert-dialog";
import { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import {
  kpiDefinitionsQueryOptions,
  flagshipCodesQueryOptions,
  type KpiDefinition,
} from "~/lib/queries/lookups";

export default function KpiDefinitionsManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Server-side filter by flagship code ("" = all flagships).
  const [flagshipCode, setFlagshipCode] = useState("");
  const { data = [], isLoading, isError, error } = useQuery(
    kpiDefinitionsQueryOptions(flagshipCode ? { flagshipCode } : undefined),
  );
  const { data: flagshipCodes = [] } = useQuery(flagshipCodesQueryOptions());

  const [toDelete, setToDelete] = useState<KpiDefinition | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/lookups/kpi-definitions/${id}`),
    onSuccess: () => {
      toast.success("KPI definition deleted");
      queryClient.invalidateQueries({ queryKey: ["kpi-definitions"] });
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete KPI definition"),
  });

  const rows = useMemo(
    () =>
      data.map((k) => ({
        id: k.id,
        flagshipCode: k.flagshipCode,
        indicatorName: k.indicatorName,
        indicatorTier: k.indicatorTier,
        indicatorValueType: k.indicatorValueType,
        status: k.active ? "Active" : "Inactive",
      })),
    [data],
  );

  const flagshipOptions = useMemo(
    () => [
      { label: "All flagships", value: "" },
      ...flagshipCodes.map((f) => ({ label: `${f.code} — ${f.name}`, value: f.code })),
    ],
    [flagshipCodes],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title="KPI Definitions"
        actionLabel="Add KPI Definition"
        onActionPress={() => navigate("/admin/kpis/add")}
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load KPI definitions"}
        </p>
      ) : null}

      <div className="max-w-xs">
        <AppSelect
          name="flagshipFilter"
          label="Filter by flagship"
          placeholder="All flagships"
          options={flagshipOptions}
          selectedKey={flagshipCode}
          onSelectionChange={setFlagshipCode}
        />
      </div>

      <TableComponent
        tableSectionTitle="KPI Definitions"
        loading={isLoading}
        emptyMessage="No KPI definitions yet"
        rows={rows}
        searchKeys={["flagshipCode", "indicatorName", "indicatorTier"]}
        statusColumnKey="status"
        statusColorMap={{ Active: "success", Inactive: "default" }}
        columns={[
          { key: "id", label: "#", width: "60px" },
          { key: "flagshipCode", label: "Flagship" },
          { key: "indicatorName", label: "Indicator" },
          { key: "indicatorTier", label: "Tier" },
          { key: "indicatorValueType", label: "Value Type" },
          { key: "status", label: "Status", width: "110px" },
          { key: "action", label: "Action", width: "80px" },
        ]}
        minTableWidthClassName="min-w-[900px]"
        filterByTab={() => true}
        actions={(row) => [
          { label: "View Details", onClick: () => navigate(`/admin/kpis/add?editId=${row.id}&mode=view`) },
          { label: "Update", onClick: () => navigate(`/admin/kpis/add?editId=${row.id}`) },
          { label: "Delete", onClick: () => setToDelete(data.find((k) => k.id === row.id) ?? null), color: "danger" },
        ]}
      />

      <AppAlertDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete KPI definition?"
        description={toDelete ? `This will permanently delete "${toDelete.indicatorName}" (${toDelete.flagshipCode}). This action cannot be undone.` : ""}
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />
    </div>
  );
}
