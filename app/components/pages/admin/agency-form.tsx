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
  agenciesQueryOptions,
  enumValuesQueryOptions,
  type AgencyRequest,
} from "~/lib/queries/lookups";

interface FormState {
  agencyName: string;
  agencyType: string;
  active: boolean;
}

const EMPTY: FormState = { agencyName: "", agencyType: "", active: true };

export default function AgencyForm({ basePath = "/admin" }: { basePath?: string } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const editId = params.get("editId");
  const isView = params.get("mode") === "view";
  const isEdit = Boolean(editId);

  const { data: existing = [] } = useQuery({ ...agenciesQueryOptions(), enabled: isEdit });
  const { data: typeOptions = [] } = useQuery(enumValuesQueryOptions("agency_type"));

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const a = existing.find((x) => String(x.id) === editId);
    if (a) setForm({ agencyName: a.agencyName, agencyType: a.agencyType, active: a.active });
  }, [isEdit, editId, existing]);

  const mutation = useMutation({
    mutationFn: (body: AgencyRequest) =>
      isEdit
        ? api.put(`/api/lookups/implementing-agencies/${editId}`, body)
        : api.post("/api/lookups/implementing-agencies", body),
    onSuccess: () => {
      toast.success(isEdit ? "Agency updated" : "Agency created");
      queryClient.invalidateQueries({ queryKey: ["implementing-agencies"] });
      navigate(`${basePath}/agencies`);
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.agencyName.trim()) next.agencyName = "Agency name is required";
    if (!form.agencyType) next.agencyType = "Type is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setApiError(null);
    if (!validate()) return;
    mutation.mutate({ agencyName: form.agencyName.trim(), agencyType: form.agencyType });
  }

  const title = isView ? "Agency Details" : isEdit ? "Edit Agency" : "Add Agency";

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title={title} />

      <Card className="p-6 space-y-4 max-w-2xl">
        {apiError ? <AppAlert status="danger" message={apiError} /> : null}

        <AppTextField
          name="agencyName"
          label="Agency Name"
          placeholder="e.g. MINAGRI"
          value={form.agencyName}
          onChange={(v) => {
            setForm((f) => ({ ...f, agencyName: v }));
            setErrors((e) => ({ ...e, agencyName: undefined }));
          }}
          isRequired
          isDisabled={isView}
          errorMessage={errors.agencyName}
        />

        <AppSelect
          name="agencyType"
          label="Agency Type"
          placeholder="Select a type"
          options={typeOptions.map((t) => ({ label: t.label, value: t.value }))}
          selectedKey={form.agencyType}
          onSelectionChange={(v) => {
            setForm((f) => ({ ...f, agencyType: v }));
            setErrors((e) => ({ ...e, agencyType: undefined }));
          }}
          isRequired
          isDisabled={isView}
          errorMessage={errors.agencyType}
        />

        {isView ? (
          <p className="text-sm text-(--foreground-600)">Status: {form.active ? "Active" : "Inactive"}</p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="!rounded-3xl" onPress={() => navigate(`${basePath}/agencies`)}>
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
