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
  valueChainsQueryOptions,
  enumValuesQueryOptions,
  type ValueChainRequest,
} from "~/lib/queries/lookups";

interface FormState {
  cluster: string;
  valueChain: string;
  active: boolean;
}

const EMPTY: FormState = { cluster: "", valueChain: "", active: true };

export default function ValueChainForm({ basePath = "/admin" }: { basePath?: string } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const editId = params.get("editId");
  const isView = params.get("mode") === "view";
  const isEdit = Boolean(editId);

  const { data: clusters = [] } = useQuery(enumValuesQueryOptions("flagship_cluster"));
  const { data: existing = [] } = useQuery({
    ...valueChainsQueryOptions(),
    enabled: isEdit,
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const vc = existing.find((v) => String(v.id) === editId);
    if (vc) setForm({ cluster: vc.cluster, valueChain: vc.valueChain, active: vc.active });
  }, [isEdit, editId, existing]);

  const mutation = useMutation({
    mutationFn: (body: ValueChainRequest) =>
      isEdit
        ? api.put(`/api/lookups/value-chains/${editId}`, body)
        : api.post("/api/lookups/value-chains", body),
    onSuccess: () => {
      toast.success(isEdit ? "Value chain updated" : "Value chain created");
      queryClient.invalidateQueries({ queryKey: ["value-chains"] });
      navigate(`${basePath}/value-chains`);
    },
    onError: (err) => {
      setApiError(err instanceof ApiError ? err.message : "Something went wrong");
    },
  });

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.cluster) next.cluster = "Cluster is required";
    if (!form.valueChain.trim()) next.valueChain = "Value chain name is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setApiError(null);
    if (!validate()) return;
    mutation.mutate({ cluster: form.cluster, valueChain: form.valueChain.trim() });
  }

  const title = isView ? "Value Chain Details" : isEdit ? "Edit Value Chain" : "Add Value Chain";

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title={title} />

      <Card className="p-6 space-y-4 max-w-2xl">
        {apiError ? <AppAlert status="danger" message={apiError} /> : null}

        <AppSelect
          name="cluster"
          label="Cluster"
          placeholder="Select a cluster"
          options={clusters.map((c) => ({ label: c.label, value: c.value }))}
          selectedKey={form.cluster}
          onSelectionChange={(v) => {
            setForm((f) => ({ ...f, cluster: v }));
            setErrors((e) => ({ ...e, cluster: undefined }));
          }}
          isRequired
          isDisabled={isView}
          errorMessage={errors.cluster}
        />

        <AppTextField
          name="valueChain"
          label="Value Chain"
          placeholder="e.g. Potato"
          value={form.valueChain}
          onChange={(v) => {
            setForm((f) => ({ ...f, valueChain: v }));
            setErrors((e) => ({ ...e, valueChain: undefined }));
          }}
          isRequired
          isDisabled={isView}
          errorMessage={errors.valueChain}
        />

        {isView ? (
          <p className="text-sm text-(--foreground-600)">
            Status: {form.active ? "Active" : "Inactive"}
          </p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="!rounded-3xl" onPress={() => navigate(`${basePath}/value-chains`)}>
            {isView ? "Back" : "Cancel"}
          </Button>
          {!isView ? (
            <Button
              variant="primary"
              className="!rounded-3xl"
              onPress={handleSubmit}
              isPending={mutation.isPending}
            >
              {isEdit ? "Save Changes" : "Create"}
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
