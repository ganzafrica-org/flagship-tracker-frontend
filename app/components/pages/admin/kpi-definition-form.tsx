import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Card } from "@heroui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageTitleCard } from "~/components/page-title-card";
import AppTextField from "~/components/app-text-field";
import AppSelect from "~/components/app-select";
import AppAlert, { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import {
  kpiDefinitionsQueryOptions,
  enumValuesQueryOptions,
  flagshipCodesQueryOptions,
  type KpiDefinitionRequest,
} from "~/lib/queries/lookups";

interface FormState {
  flagshipCode: string;
  indicatorName: string;
  indicatorTier: string;
  indicatorValueType: string;
  active: boolean;
}

const EMPTY: FormState = {
  flagshipCode: "",
  indicatorName: "",
  indicatorTier: "",
  indicatorValueType: "",
  active: true,
};

export default function KpiDefinitionForm({ basePath = "/admin" }: { basePath?: string } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const editId = params.get("editId");
  const isView = params.get("mode") === "view";
  const isEdit = Boolean(editId);

  const { data: flagshipCodes = [] } = useQuery(flagshipCodesQueryOptions());
  const { data: tiers = [] } = useQuery(enumValuesQueryOptions("indicator_tier"));
  const { data: valueTypes = [] } = useQuery(enumValuesQueryOptions("indicator_value_type"));
  const { data: existing = [] } = useQuery({ ...kpiDefinitionsQueryOptions(), enabled: isEdit });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const k = existing.find((x) => String(x.id) === editId);
    if (k)
      setForm({
        flagshipCode: k.flagshipCode,
        indicatorName: k.indicatorName,
        indicatorTier: k.indicatorTier,
        indicatorValueType: k.indicatorValueType,
        active: k.active,
      });
  }, [isEdit, editId, existing]);

  const mutation = useMutation({
    mutationFn: (body: KpiDefinitionRequest) =>
      isEdit
        ? api.put(`/api/lookups/kpi-definitions/${editId}`, body)
        : api.post("/api/lookups/kpi-definitions", body),
    onSuccess: () => {
      toast.success(isEdit ? "KPI definition updated" : "KPI definition created");
      queryClient.invalidateQueries({ queryKey: ["kpi-definitions"] });
      navigate(`${basePath}/kpis`);
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.flagshipCode) next.flagshipCode = "Flagship is required";
    if (!form.indicatorName.trim()) next.indicatorName = "Indicator name is required";
    if (!form.indicatorTier) next.indicatorTier = "Tier is required";
    if (!form.indicatorValueType) next.indicatorValueType = "Value type is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setApiError(null);
    if (!validate()) return;
    mutation.mutate({
      flagshipCode: form.flagshipCode,
      indicatorName: form.indicatorName.trim(),
      indicatorTier: form.indicatorTier,
      indicatorValueType: form.indicatorValueType,
    });
  }

  const title = isView ? "KPI Definition Details" : isEdit ? "Edit KPI Definition" : "Add KPI Definition";

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title={title} />

      <Card className="p-6 space-y-4 max-w-2xl">
        {apiError ? <AppAlert status="danger" message={apiError} /> : null}

        <AppSelect
          name="flagshipCode"
          label="Flagship"
          placeholder="Select a flagship"
          options={flagshipCodes.map((f) => ({ label: `${f.code} — ${f.name}`, value: f.code }))}
          selectedKey={form.flagshipCode}
          onSelectionChange={(v) => {
            setForm((f) => ({ ...f, flagshipCode: v }));
            setErrors((e) => ({ ...e, flagshipCode: undefined }));
          }}
          isRequired
          isDisabled={isView}
          errorMessage={errors.flagshipCode}
        />

        <AppTextField
          name="indicatorName"
          label="Indicator Name"
          placeholder="e.g. Number of youth trained"
          value={form.indicatorName}
          onChange={(v) => {
            setForm((f) => ({ ...f, indicatorName: v }));
            setErrors((e) => ({ ...e, indicatorName: undefined }));
          }}
          isRequired
          isDisabled={isView}
          errorMessage={errors.indicatorName}
        />

        <div className="grid grid-cols-2 gap-4">
          <AppSelect
            name="indicatorTier"
            label="Indicator Tier"
            placeholder="Select a tier"
            options={tiers.map((t) => ({ label: t.label, value: t.value }))}
            selectedKey={form.indicatorTier}
            onSelectionChange={(v) => {
              setForm((f) => ({ ...f, indicatorTier: v }));
              setErrors((e) => ({ ...e, indicatorTier: undefined }));
            }}
            isRequired
            isDisabled={isView}
            errorMessage={errors.indicatorTier}
          />

          <AppSelect
            name="indicatorValueType"
            label="Value Type"
            placeholder="Select a value type"
            options={valueTypes.map((t) => ({ label: t.label, value: t.value }))}
            selectedKey={form.indicatorValueType}
            onSelectionChange={(v) => {
              setForm((f) => ({ ...f, indicatorValueType: v }));
              setErrors((e) => ({ ...e, indicatorValueType: undefined }));
            }}
            isRequired
            isDisabled={isView}
            errorMessage={errors.indicatorValueType}
          />
        </div>

        {isView ? (
          <p className="text-sm text-(--foreground-600)">Status: {form.active ? "Active" : "Inactive"}</p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="!rounded-3xl" onPress={() => navigate(`${basePath}/kpis`)}>
            {isView ? "Back" : "Cancel"}
          </Button>
          {!isView ? (
            <Button variant="primary" className="!rounded-3xl" onPress={handleSubmit} isPending={mutation.isPending}>
              {isEdit ? "Save Changes" : "Create"}
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
