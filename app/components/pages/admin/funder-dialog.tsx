import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AppAlert, { toast } from "~/components/app-alert";
import AppModal from "~/components/app-modal";
import AppSelect from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import { ApiError, api } from "~/lib/api";
import { enumValuesQueryOptions, type Funder, type FunderRequest } from "~/lib/queries/lookups";

interface FunderDialogProps {
  funder: Funder | null;
  onClose: () => void;
}

/** Edit a funder in place. Viewing one is the shared RecordDetailsDialog. */
export default function FunderDialog({ funder, onClose }: FunderDialogProps) {
  const queryClient = useQueryClient();
  const { data: typeOptions = [] } = useQuery(enumValuesQueryOptions("funder_type"));

  const [funderName, setFunderName] = useState("");
  const [funderType, setFunderType] = useState("");
  const [errors, setErrors] = useState<{ funderName?: string; funderType?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Re-seed whenever a different funder is opened.
  useEffect(() => {
    if (!funder) return;
    setFunderName(funder.funderName);
    setFunderType(funder.funderType);
    setErrors({});
    setApiError(null);
  }, [funder]);

  const mutation = useMutation({
    mutationFn: (body: FunderRequest) => api.put(`/api/lookups/funders/${funder?.id}`, body),
    onSuccess: async () => {
      toast.success("Funder updated");
      // The list on this page and the funder dropdowns on the flagship forms both read funders.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["funders"] }),
        queryClient.invalidateQueries({ queryKey: ["lookups", "funders"] }),
      ]);
      onClose();
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  function handleSave() {
    setApiError(null);
    const next: typeof errors = {};
    if (!funderName.trim()) next.funderName = "Funder name is required";
    if (!funderType) next.funderType = "Type is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    mutation.mutate({ funderName: funderName.trim(), funderType });
  }

  return (
    <AppModal
      isOpen={funder !== null}
      onOpenChange={(open) => !open && !mutation.isPending && onClose()}
      title="Edit Funder"
      footer={
        <>
          <Button variant="outline" slot="close" isDisabled={mutation.isPending} className="!rounded-3xl">
            Cancel
          </Button>
          <Button variant="primary" className="!rounded-3xl" onPress={handleSave} isPending={mutation.isPending}>
            Save Changes
          </Button>
        </>
      }
    >
      {apiError ? <AppAlert status="danger" message={apiError} /> : null}

      <AppTextField
        name="funderName"
        label="Funder Name"
        placeholder="e.g. IFAD"
        value={funderName}
        onChange={(v) => {
          setFunderName(v);
          setErrors((e) => ({ ...e, funderName: undefined }));
        }}
        isRequired
        errorMessage={errors.funderName}
      />

      <AppSelect
        name="funderType"
        label="Funder Type"
        placeholder="Select a type"
        options={typeOptions.map((t) => ({ label: t.label, value: t.value }))}
        selectedKey={funderType}
        onSelectionChange={(v) => {
          setFunderType(v);
          setErrors((e) => ({ ...e, funderType: undefined }));
        }}
        isRequired
        errorMessage={errors.funderType}
      />
    </AppModal>
  );
}
