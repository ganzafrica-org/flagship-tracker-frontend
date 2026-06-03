import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import AppModal from "~/components/app-modal";
import AppAlertDialog from "~/components/app-alert-dialog";
import AppAlert, { toast } from "~/components/app-alert";
import AppTextField from "~/components/app-text-field";
import { ApiError } from "~/lib/api";
import {
  enumValuesQueryOptions,
  createEnumValue,
  updateEnumValue,
  deleteEnumValue,
  type EnumGroup,
  type EnumValue,
} from "~/lib/queries/lookups";

interface EnumTypeManagementProps {
  enumGroup: Extract<EnumGroup, "funder_type" | "agency_type">;
  title: string;
  backHref: string;
  /** Singular noun for messages, e.g. "funder type". */
  noun: string;
}

interface DraftState {
  value: string;
  label: string;
  sortOrder: string;
}

const EMPTY_DRAFT: DraftState = { value: "", label: "", sortOrder: "" };

export default function EnumTypeManagement({
  enumGroup,
  title,
  backHref,
  noun,
}: EnumTypeManagementProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // active=false → include inactive too so admins see everything they manage.
  // undefined = fetch all types (active + inactive) for management.
  const { data = [], isLoading, isError, error } = useQuery(enumValuesQueryOptions(enumGroup, undefined));

  const [editing, setEditing] = useState<EnumValue | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [draftErrors, setDraftErrors] = useState<Partial<Record<keyof DraftState, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<EnumValue | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["enum-values", enumGroup] });

  const saveMutation = useMutation({
    mutationFn: (body: { value: string; label: string; sortOrder: number }) =>
      editing?.id
        ? updateEnumValue(editing.id, { enumGroup, ...body })
        : createEnumValue({ enumGroup, ...body }),
    onSuccess: () => {
      toast.success(editing ? `${noun} updated` : `${noun} added`);
      invalidate();
      setModalOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEnumValue(id),
    onSuccess: () => {
      toast.success(`${noun} deleted`);
      invalidate();
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete"),
  });

  function openCreate() {
    setEditing(null);
    setDraft({ value: "", label: "", sortOrder: String(data.length + 1) });
    setDraftErrors({});
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: EnumValue) {
    setEditing(item);
    setDraft({ value: item.value, label: item.label, sortOrder: "" });
    setDraftErrors({});
    setFormError(null);
    setModalOpen(true);
  }

  function handleSave() {
    setFormError(null);
    const next: Partial<Record<keyof DraftState, string>> = {};
    if (!draft.value.trim()) next.value = "Value is required";
    if (!draft.label.trim()) next.label = "Label is required";
    setDraftErrors(next);
    if (Object.keys(next).length > 0) return;

    const sortOrder = draft.sortOrder.trim() === "" ? 0 : Number(draft.sortOrder);
    saveMutation.mutate({
      value: draft.value.trim(),
      label: draft.label.trim(),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    });
  }

  const rows = useMemo(
    () =>
      [...data]
        .sort((a, b) => (a.value > b.value ? 1 : -1))
        .map((t) => ({
          id: t.id ?? t.value,
          value: t.value,
          label: t.label,
          status: t.active === false ? "Inactive" : "Active",
        })),
    [data],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard
        title={title}
        actionSlot={
          <div className="flex gap-3">
            <Button variant="outline" className="!rounded-3xl" onPress={() => navigate(backHref)}>
              Back
            </Button>
            <Button variant="primary" className="!rounded-3xl" onPress={openCreate}>
              Add Type
            </Button>
          </div>
        }
      />

      {isError ? (
        <p className="text-sm text-(--danger)">
          {error instanceof ApiError ? error.message : "Failed to load types"}
        </p>
      ) : null}

      <TableComponent
        tableSectionTitle={title}
        loading={isLoading}
        emptyMessage="No types yet"
        rows={rows}
        searchKeys={["value", "label"]}
        statusColumnKey="status"
        statusColorMap={{ Active: "success", Inactive: "default" }}
        newestFirst={false}
        columns={[
          { key: "id", label: "#", width: "60px" },
          { key: "label", label: "Label" },
          { key: "value", label: "Value (stored)" },
          { key: "status", label: "Status", width: "110px" },
          { key: "action", label: "Action", width: "80px" },
        ]}
        minTableWidthClassName="min-w-[600px]"
        filterByTab={() => true}
        actions={(row) => [
          {
            label: "Edit",
            onClick: () => {
              const item = data.find((d) => (d.id ?? d.value) === row.id);
              if (item) openEdit(item);
            },
          },
          {
            label: "Delete",
            onClick: () => setToDelete(data.find((d) => (d.id ?? d.value) === row.id) ?? null),
            color: "danger",
          },
        ]}
      />

      {modalOpen ? (
        <AppModal
          isOpen={modalOpen}
          onOpenChange={setModalOpen}
          title={editing ? `Edit ${noun}` : `Add ${noun}`}
          footer={
            <>
              <Button variant="outline" slot="close" className="!rounded-3xl">
                Cancel
              </Button>
              <Button
                variant="primary"
                className="!rounded-3xl"
                onPress={handleSave}
                isPending={saveMutation.isPending}
              >
                {editing ? "Save Changes" : "Add"}
              </Button>
            </>
          }
        >
          {formError ? <AppAlert status="danger" message={formError} /> : null}
          <AppTextField
            name="label"
            label="Label"
            placeholder="e.g. Government"
            value={draft.label}
            onChange={(v) => {
              setDraft((d) => ({ ...d, label: v }));
              setDraftErrors((e) => ({ ...e, label: undefined }));
            }}
            isRequired
            errorMessage={draftErrors.label}
            description="Shown in dropdowns."
          />
          <AppTextField
            name="value"
            label="Value (stored)"
            placeholder="e.g. government"
            value={draft.value}
            onChange={(v) => {
              setDraft((d) => ({ ...d, value: v }));
              setDraftErrors((e) => ({ ...e, value: undefined }));
            }}
            isRequired
            isDisabled={Boolean(editing)}
            errorMessage={draftErrors.value}
            description={editing ? "Value can't be changed after creation." : "Lowercase identifier saved to records."}
          />
          <AppTextField
            name="sortOrder"
            label="Sort Order"
            type="number"
            inputMode="numeric"
            value={draft.sortOrder}
            onChange={(v) => setDraft((d) => ({ ...d, sortOrder: v }))}
            description="Controls ordering in dropdowns (optional)."
          />
        </AppModal>
      ) : null}

      <AppAlertDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete ${noun}?`}
        description={
          toDelete
            ? `This will permanently delete "${toDelete.label}". Existing records using it keep their stored value. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onConfirm={() => toDelete?.id && deleteMutation.mutate(toDelete.id)}
      />
    </div>
  );
}
