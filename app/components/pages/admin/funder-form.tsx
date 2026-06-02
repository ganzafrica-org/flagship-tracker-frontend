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
  fundersQueryOptions,
  enumValuesQueryOptions,
  type FunderRequest,
} from "~/lib/queries/lookups";

interface FormState {
  funderName: string;
  funderType: string;
  active: boolean;
}

const EMPTY: FormState = { funderName: "", funderType: "", active: true };

export default function FunderForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const editId = params.get("editId");
  const isView = params.get("mode") === "view";
  const isEdit = Boolean(editId);

  const { data: existing = [] } = useQuery({ ...fundersQueryOptions(), enabled: isEdit });
  const { data: typeOptions = [] } = useQuery(enumValuesQueryOptions("funder_type"));

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const f = existing.find((x) => String(x.id) === editId);
    if (f) setForm({ funderName: f.funderName, funderType: f.funderType, active: f.active });
  }, [isEdit, editId, existing]);

  const mutation = useMutation({
    mutationFn: (body: FunderRequest) =>
      isEdit ? api.put(`/api/lookups/funders/${editId}`, body) : api.post("/api/lookups/funders", body),
    onSuccess: () => {
      toast.success(isEdit ? "Funder updated" : "Funder created");
      queryClient.invalidateQueries({ queryKey: ["funders"] });
      navigate("/admin/funders");
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.funderName.trim()) next.funderName = "Funder name is required";
    if (!form.funderType) next.funderType = "Type is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setApiError(null);
    if (!validate()) return;
    mutation.mutate({ funderName: form.funderName.trim(), funderType: form.funderType });
  }

  const title = isView ? "Funder Details" : isEdit ? "Edit Funder" : "Add Funder";

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title={title} />

      <Card className="p-6 space-y-4 max-w-2xl">
        {apiError ? <AppAlert status="danger" message={apiError} /> : null}

        <AppTextField
          name="funderName"
          label="Funder Name"
          placeholder="e.g. IFAD"
          value={form.funderName}
          onChange={(v) => {
            setForm((f) => ({ ...f, funderName: v }));
            setErrors((e) => ({ ...e, funderName: undefined }));
          }}
          isRequired
          isDisabled={isView}
          errorMessage={errors.funderName}
        />

        <AppSelect
          name="funderType"
          label="Funder Type"
          placeholder="Select a type"
          options={typeOptions.map((t) => ({ label: t.label, value: t.value }))}
          selectedKey={form.funderType}
          onSelectionChange={(v) => {
            setForm((f) => ({ ...f, funderType: v }));
            setErrors((e) => ({ ...e, funderType: undefined }));
          }}
          isRequired
          isDisabled={isView}
          errorMessage={errors.funderType}
        />

        {isView ? (
          <p className="text-sm text-(--foreground-600)">Status: {form.active ? "Active" : "Inactive"}</p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="!rounded-3xl" onPress={() => navigate("/admin/funders")}>
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
