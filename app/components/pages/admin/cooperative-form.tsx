import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Card } from "@heroui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageTitleCard } from "~/components/page-title-card";
import AppTextField from "~/components/app-text-field";
import AppSelect from "~/components/app-select";
import AppAlert, { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { enumValuesQueryOptions } from "~/lib/queries/lookups";
import { cooperativeQueryOptions, type CooperativeRequest } from "~/lib/queries/cooperatives";

interface FormState {
  cooperativeName: string;
  cooperativeCode: string;
  groupType: string;
  registrationStatus: string;
  primaryValueChain: string;
  cluster: string;
  totalMembers: string;
  femaleMembers: string;
  youthMembers: string;
  province: string;
  district: string;
  sector: string;
}

const EMPTY: FormState = {
  cooperativeName: "",
  cooperativeCode: "",
  groupType: "",
  registrationStatus: "",
  primaryValueChain: "",
  cluster: "",
  totalMembers: "",
  femaleMembers: "",
  youthMembers: "",
  province: "",
  district: "",
  sector: "",
};

function toNum(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function CooperativeForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const editId = params.get("editId");
  const isView = params.get("mode") === "view";
  const isEdit = Boolean(editId);

  const { data: groupTypes = [] } = useQuery(enumValuesQueryOptions("group_type"));
  const { data: regStatuses = [] } = useQuery(enumValuesQueryOptions("registration_status"));
  const { data: detail } = useQuery({
    ...cooperativeQueryOptions(editId ?? ""),
    enabled: isEdit,
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail) return;
    setForm({
      cooperativeName: detail.cooperativeName ?? "",
      cooperativeCode: detail.cooperativeCode ?? "",
      groupType: detail.groupType ?? "",
      registrationStatus: detail.registrationStatus ?? "",
      primaryValueChain: detail.primaryValueChain ?? "",
      cluster: detail.cluster ?? "",
      totalMembers: detail.totalMembers != null ? String(detail.totalMembers) : "",
      femaleMembers: detail.femaleMembers != null ? String(detail.femaleMembers) : "",
      youthMembers: detail.youthMembers != null ? String(detail.youthMembers) : "",
      province: detail.province ?? "",
      district: detail.district ?? "",
      sector: detail.sector ?? "",
    });
  }, [detail]);

  const mutation = useMutation({
    mutationFn: (body: CooperativeRequest) =>
      isEdit ? api.patch(`/api/cooperatives/${editId}`, body) : api.post("/api/cooperatives", body),
    onSuccess: () => {
      toast.success(isEdit ? "Cooperative updated" : "Cooperative created");
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ["cooperative", String(editId)] });
      navigate("/admin/cooperatives");
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.cooperativeName.trim()) next.cooperativeName = "Name is required";
    if (!form.groupType) next.groupType = "Group type is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setApiError(null);
    if (!validate()) return;
    mutation.mutate({
      cooperativeName: form.cooperativeName.trim(),
      cooperativeCode: form.cooperativeCode.trim() || undefined,
      groupType: form.groupType,
      registrationStatus: form.registrationStatus || undefined,
      primaryValueChain: form.primaryValueChain.trim() || undefined,
      cluster: form.cluster.trim() || undefined,
      totalMembers: toNum(form.totalMembers),
      femaleMembers: toNum(form.femaleMembers),
      youthMembers: toNum(form.youthMembers),
      province: form.province.trim() || undefined,
      district: form.district.trim() || undefined,
      sector: form.sector.trim() || undefined,
    });
  }

  const setField = (key: keyof FormState) => (v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const title = isView ? "Cooperative Details" : isEdit ? "Edit Cooperative" : "Add Cooperative";

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title={title} />

      <Card className="p-6 space-y-4 max-w-3xl">
        {apiError ? <AppAlert status="danger" message={apiError} /> : null}

        <div className="grid grid-cols-2 gap-4">
          <AppTextField
            name="cooperativeName"
            label="Name"
            placeholder="Cooperative name"
            value={form.cooperativeName}
            onChange={setField("cooperativeName")}
            isRequired
            isDisabled={isView}
            errorMessage={errors.cooperativeName}
          />
          <AppTextField
            name="cooperativeCode"
            label="Code"
            placeholder="Optional code"
            value={form.cooperativeCode}
            onChange={setField("cooperativeCode")}
            isDisabled={isView}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AppSelect
            name="groupType"
            label="Group Type"
            placeholder="Select a group type"
            options={groupTypes.map((g) => ({ label: g.label, value: g.value }))}
            selectedKey={form.groupType}
            onSelectionChange={setField("groupType")}
            isRequired
            isDisabled={isView}
            errorMessage={errors.groupType}
          />
          <AppSelect
            name="registrationStatus"
            label="Registration Status"
            placeholder="Select a status"
            options={regStatuses.map((r) => ({ label: r.label, value: r.value }))}
            selectedKey={form.registrationStatus}
            onSelectionChange={setField("registrationStatus")}
            isDisabled={isView}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AppTextField
            name="primaryValueChain"
            label="Primary Value Chain"
            placeholder="e.g. Potato"
            value={form.primaryValueChain}
            onChange={setField("primaryValueChain")}
            isDisabled={isView}
          />
          <AppTextField
            name="cluster"
            label="Cluster"
            placeholder="e.g. Horticulture"
            value={form.cluster}
            onChange={setField("cluster")}
            isDisabled={isView}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <AppTextField
            name="totalMembers"
            label="Total Members"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.totalMembers}
            onChange={setField("totalMembers")}
            isDisabled={isView}
          />
          <AppTextField
            name="femaleMembers"
            label="Female Members"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.femaleMembers}
            onChange={setField("femaleMembers")}
            isDisabled={isView}
          />
          <AppTextField
            name="youthMembers"
            label="Youth Members"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.youthMembers}
            onChange={setField("youthMembers")}
            isDisabled={isView}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <AppTextField name="province" label="Province" value={form.province} onChange={setField("province")} isDisabled={isView} />
          <AppTextField name="district" label="District" value={form.district} onChange={setField("district")} isDisabled={isView} />
          <AppTextField name="sector" label="Sector" value={form.sector} onChange={setField("sector")} isDisabled={isView} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="!rounded-3xl" onPress={() => navigate("/admin/cooperatives")}>
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
