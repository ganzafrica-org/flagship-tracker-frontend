import { useEffect, useState } from "react";
import { FieldGroup, Fieldset, Form } from "@heroui/react";
import { redirect, useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DateValue } from "@internationalized/date";

import AppDate from "~/components/app-date";
import AppSelect from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { Stepper, type StepConfig } from "~/components/stepper";
import AppAlert, { toast } from "~/components/app-alert";
import { ApiError, api } from "~/lib/api";
import { isNetworkError } from "~/lib/offline-drafts/network";
import { createCooperativeDraft, deleteDraft, getDraft, updateDraft } from "~/lib/offline-drafts/repository";
import { showDraftSavedToast } from "~/lib/offline-drafts/toast";
import { enumValuesQueryOptions } from "~/lib/queries/lookups";
import { cooperativeQueryOptions, ENGAGEMENT_TYPE_OPTIONS, flagshipOptionsQueryOptions, buildCooperativeFlagshipsPayload, isoToDateValue, type CooperativeDetail, type CooperativeRequest, type CooperativeUpdateRequest } from "~/lib/queries/cooperatives";

const STEPS: StepConfig[] = [
  { id: "cooperative-details", label: "Cooperative Details" },
  { id: "flagship-link", label: "Cooperative-Flagship Link", optional: true },
];

const DEFAULT_LOCATION: RwandaLocationValue = {
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

// Viewing a cooperative is a dialog on its list now. Old `mode=view` links (which carry the
// list they came from in `returnTo`, Senior's included) land on that list with it open.
export function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("editId");
  if (!id || url.searchParams.get("mode") !== "view") return null;
  const returnTo = url.searchParams.get("returnTo") ?? "";
  // Only follow an in-app cooperatives list path.
  const list = /^\/(me|senior)\/cooperatives(\?|$)/.test(returnTo) ? returnTo : "/me/cooperatives";
  const target = new URL(list, url.origin);
  target.searchParams.set("view", id);
  return redirect(target.pathname + target.search);
}

export function meta() {
  return [{ title: "Add Cooperative | M&E" }];
}

export default function MeAddCooperativePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const editId = params.get("editId");
  const isEdit = Boolean(editId);
  const returnTo = params.get("returnTo") || "/me/cooperatives";
  const draftIdRaw = Number(params.get("draftId") || 0);
  const draftId = Number.isFinite(draftIdRaw) && draftIdRaw > 0 ? draftIdRaw : null;

  const [currentStep, setCurrentStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  // Created cooperative id — set after a successful create/update so step 1 (edit mode only) can PATCH it
  const [createdId, setCreatedId] = useState<number | null>(null);

  // Step 0 fields
  const [cooperativeName, setCooperativeName] = useState("");
  const [cooperativeCode, setCooperativeCode] = useState("");
  // A new cooperative opened from a type page starts with that type selected.
  const [groupType, setGroupType] = useState(() => (params.get("editId") ? "" : (params.get("type") ?? "")));
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [primaryValueChain, setPrimaryValueChain] = useState("");
  const [cluster, setCluster] = useState("");
  const [totalMembers, setTotalMembers] = useState("");
  const [femaleMembers, setFemaleMembers] = useState("");
  const [youthMembers, setYouthMembers] = useState("");
  const [location, setLocation] = useState<RwandaLocationValue>(DEFAULT_LOCATION);

  // Step 1 fields
  const [flagshipId, setFlagshipId] = useState("");
  const [engagementType, setEngagementType] = useState("");
  const [engagementStartDate, setEngagementStartDate] = useState<DateValue | null>(null);
  const [engagementEndDate, setEngagementEndDate] = useState<DateValue | null>(null);

  // Lookups
  const { data: groupTypes = [] } = useQuery(enumValuesQueryOptions("group_type"));
  const { data: regStatuses = [] } = useQuery(enumValuesQueryOptions("registration_status"));
  const { data: flagshipOptions = [] } = useQuery(flagshipOptionsQueryOptions());

  // Load existing cooperative when editing or viewing
  const { data: detail } = useQuery({
    ...cooperativeQueryOptions(editId ?? ""),
    enabled: Boolean(editId),
  });

  // Load a locally-saved draft (reached via the Draft tab's "Edit" button) when adding, not editing.
  const [draftPayload, setDraftPayload] = useState<CooperativeRequest | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  useEffect(() => {
    if (!draftId) {
      setDraftPayload(null);
      return;
    }
    setDraftLoading(true);
    void getDraft(draftId).then((draft) => {
      setDraftPayload(draft && draft.entityType === "cooperative" ? draft.payload : null);
      setDraftLoading(false);
    });
  }, [draftId]);

  useEffect(() => {
    if (isEdit && editId) {
      setCreatedId(Number(editId));
    }
  }, [isEdit, editId]);

  useEffect(() => {
    const source = isEdit ? detail : draftPayload;
    if (!source) return;
    setCooperativeName(source.cooperativeName ?? "");
    setCooperativeCode(source.cooperativeCode ?? "");
    setGroupType(source.groupType ?? "");
    setRegistrationStatus(source.registrationStatus ?? "");
    setPrimaryValueChain(source.primaryValueChain ?? "");
    setCluster(source.cluster ?? "");
    setTotalMembers(source.totalMembers != null ? String(source.totalMembers) : "");
    setFemaleMembers(source.femaleMembers != null ? String(source.femaleMembers) : "");
    setYouthMembers(source.youthMembers != null ? String(source.youthMembers) : "");
    setLocation({
      province: source.province ?? "",
      district: source.district ?? "",
      sector: source.sector ?? "",
      cell: "",
      village: "",
    });

    const flagshipLink = source.flagships?.[0];
    if (flagshipLink) {
      setFlagshipId(String(flagshipLink.flagshipId));
      setEngagementType(flagshipLink.engagementType ?? "");
      setEngagementStartDate(isoToDateValue(flagshipLink.startDate));
      setEngagementEndDate(isoToDateValue(flagshipLink.endDate));
    }
  }, [isEdit, detail, draftPayload]);

  function toNum(v: string): number | undefined {
    if (v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  function buildStep0Body(): CooperativeRequest {
    return {
      cooperativeName: cooperativeName.trim(),
      cooperativeCode: cooperativeCode.trim() || undefined,
      groupType,
      registrationStatus: registrationStatus || undefined,
      primaryValueChain: primaryValueChain.trim() || undefined,
      cluster: cluster.trim() || undefined,
      totalMembers: toNum(totalMembers),
      femaleMembers: toNum(femaleMembers),
      youthMembers: toNum(youthMembers),
      province: location.province || undefined,
      district: location.district || undefined,
      sector: location.sector || undefined,
    };
  }

  /** Full body for the "add" flow: step 0 fields plus the optional flagship link, sent in one request. */
  function buildFullAddBody(): CooperativeRequest {
    const flagships = buildCooperativeFlagshipsPayload({
      flagshipId,
      engagementType,
      startDate: engagementStartDate,
      endDate: engagementEndDate,
    });
    return { ...buildStep0Body(), flagships: flagships.length ? flagships : undefined };
  }

  // Edit mode only: step 0 "Next" PATCHes immediately (progressive save matches the existing edit UX).
  const step0Mutation = useMutation({
    mutationFn: (body: CooperativeRequest) => {
      const cooperativeId = createdId ?? Number(editId);
      return api.patch<CooperativeDetail>(`/api/cooperatives/${cooperativeId}`, body);
    },
    onSuccess: (res) => {
      setApiError(null);
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      queryClient.invalidateQueries({ queryKey: ["viz", "cooperatives"] });
      const cooperativeId = res.cooperativeId ?? createdId ?? Number(editId);
      if (cooperativeId) {
        setCreatedId(cooperativeId);
        queryClient.invalidateQueries({ queryKey: ["cooperative", String(cooperativeId)] });
      }
      setCurrentStep(1);
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  // Edit mode only: step 1 "Submit" PATCHes the flagship link.
  const step1Mutation = useMutation({
    mutationFn: (body: CooperativeUpdateRequest) => {
      const cooperativeId = createdId ?? Number(editId);
      if (!cooperativeId) throw new Error("No cooperative ID");
      return api.patch<CooperativeDetail>(`/api/cooperatives/${cooperativeId}`, body);
    },
    onSuccess: (res) => {
      toast.success("Cooperative updated");
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      queryClient.invalidateQueries({ queryKey: ["viz", "cooperatives"] });
      if (res.cooperativeId) {
        queryClient.invalidateQueries({ queryKey: ["cooperative", String(res.cooperativeId)] });
      }
      navigate(returnTo);
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  /**
   * Add mode only: the single submission for the whole form (both steps), fired from the last
   * step's Submit/Skip. Mirrors Add Individual / Add Flagship — nothing is sent to the server
   * until the user has reached the end, so a dropped connection here is the only place offline
   * capture needs to happen for this flow.
   */
  const createMutation = useMutation({
    mutationFn: (body: CooperativeRequest) => api.post<CooperativeDetail>("/api/cooperatives", body),
    onSuccess: () => {
      setApiError(null);
      toast.success("Cooperative created");
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      queryClient.invalidateQueries({ queryKey: ["viz", "cooperatives"] });
      if (draftId) void deleteDraft(draftId);
      navigate(returnTo, { viewTransition: true });
    },
    onError: (err, body) => {
      if (isNetworkError(err)) {
        void (draftId ? updateDraft(draftId, { payload: body }) : createCooperativeDraft(body));
        showDraftSavedToast();
        navigate(returnTo, { viewTransition: true });
        return;
      }
      setApiError(err instanceof ApiError ? err.message : "Something went wrong");
    },
  });

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  /** Manual "Save Draft" — only offered on the last step (via Stepper), add mode only. */
  async function handleSaveDraft() {
    setIsSavingDraft(true);
    try {
      const body = buildFullAddBody();
      if (draftId) {
        await updateDraft(draftId, { payload: body });
      } else {
        await createCooperativeDraft(body);
      }
      showDraftSavedToast();
      navigate(returnTo, { viewTransition: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save draft");
    } finally {
      setIsSavingDraft(false);
    }
  }

  function goNext() {
    setApiError(null);
    if (!cooperativeName.trim()) {
      setApiError("Cooperative name is required");
      return;
    }
    if (!groupType) {
      setApiError("Group type is required");
      return;
    }
    if (isEdit) {
      step0Mutation.mutate(buildStep0Body());
      return;
    }
    // Add mode: nothing is sent yet — just advance to the flagship-link step.
    setCurrentStep(1);
  }

  function handleSubmit() {
    setApiError(null);
    if (isEdit) {
      const flagships = buildCooperativeFlagshipsPayload({
        flagshipId,
        engagementType,
        startDate: engagementStartDate,
        endDate: engagementEndDate,
      });
      if (flagships.length === 0) {
        toast.success("Cooperative updated");
        queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
        queryClient.invalidateQueries({ queryKey: ["viz", "cooperatives"] });
        navigate(returnTo);
        return;
      }
      step1Mutation.mutate({ flagships });
      return;
    }
    createMutation.mutate(buildFullAddBody());
  }

  const stepHasValue =
    currentStep === 0
      ? !!(cooperativeName || cooperativeCode || groupType || location.province)
      : !!(flagshipId || engagementType || engagementStartDate);

  const isPending = isEdit ? step0Mutation.isPending || step1Mutation.isPending : createMutation.isPending;
  const pageTitle = isEdit ? "Edit Cooperative" : "Cooperatives Management";

  if (draftId && draftLoading) {
    return (
      <div className="flex flex-col gap-5 w-full min-w-0">
        <PageTitleCard title={pageTitle} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title={pageTitle} />

      {apiError ? <AppAlert status="danger" message={apiError} /> : null}

      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        onBack={() => {
          if (currentStep === 0) navigate(returnTo, { viewTransition: true });
          else setCurrentStep((s) => s - 1);
        }}
        onNext={goNext}
        onSkip={handleSubmit}
        onSubmit={handleSubmit}
        stepHasValue={stepHasValue}
        isSubmitting={isPending}
        onSaveDraft={!isEdit ? handleSaveDraft : undefined}
        isSavingDraft={isSavingDraft}
      >
        <Form className="w-full" onSubmit={(e) => { e.preventDefault(); }}>
          <Fieldset className="w-full border-none p-0">
            <FieldGroup className="grid gap-4 sm:grid-cols-10 w-full">
              {currentStep === 0 ? (
                <>
                  <AppTextField
                    name="cooperativeName"
                    label="Cooperative Name"
                    placeholder="Full cooperative or group name"
                    className="sm:col-span-5 w-full"
                    value={cooperativeName}
                    onChange={setCooperativeName}
                    isRequired
                  />
                  <AppTextField
                    name="cooperativeCode"
                    label="Cooperative Code"
                    placeholder="Registration or reference code"
                    className="sm:col-span-5 w-full"
                    value={cooperativeCode}
                    onChange={setCooperativeCode}
                  />
                  <AppSelect
                    name="groupType"
                    label="Group Type"
                    placeholder="Select group type"
                    className="sm:col-span-5 w-full"
                    selectedKey={groupType}
                    onSelectionChange={setGroupType}
                    options={groupTypes.map((g) => ({ label: g.label, value: g.value }))}
                    isRequired
                  />
                  <AppSelect
                    name="registrationStatus"
                    label="Registration Status"
                    placeholder="Select registration status"
                    className="sm:col-span-5 w-full"
                    selectedKey={registrationStatus}
                    onSelectionChange={setRegistrationStatus}
                    options={regStatuses.map((r) => ({ label: r.label, value: r.value }))}
                  />
                  <AppTextField
                    name="primaryValueChain"
                    label="Primary Value Chain"
                    placeholder="e.g. Potato"
                    className="sm:col-span-5 w-full"
                    value={primaryValueChain}
                    onChange={setPrimaryValueChain}
                  />
                  <AppTextField
                    name="cluster"
                    label="Cluster"
                    placeholder="e.g. Horticulture"
                    className="sm:col-span-5 w-full"
                    value={cluster}
                    onChange={setCluster}
                  />
                  <AppTextField
                    name="totalMembers"
                    label="Total Members"
                    type="number"
                    placeholder="0"
                    className="sm:col-span-4 w-full"
                    value={totalMembers}
                    onChange={setTotalMembers}
                    min={0}
                    step={1}
                  />
                  <AppTextField
                    name="femaleMembers"
                    label="Female Members"
                    type="number"
                    placeholder="0"
                    className="sm:col-span-3 w-full"
                    value={femaleMembers}
                    onChange={setFemaleMembers}
                    min={0}
                    step={1}
                  />
                  <AppTextField
                    name="youthMembers"
                    label="Youth Members"
                    type="number"
                    placeholder="0"
                    className="sm:col-span-3 w-full"
                    value={youthMembers}
                    onChange={setYouthMembers}
                    min={0}
                    step={1}
                  />
                  <div className="sm:col-span-10">
                    <span className="mb-2 block text-sm font-medium text-(--foreground)">Location</span>
                    <RwandaLocationSelector value={location} onChange={setLocation} />
                  </div>
                </>
              ) : null}

              {currentStep === 1 ? (
                <>
                  <AppSelect
                    name="flagshipId"
                    label="Flagship"
                    placeholder="Select flagship"
                    className="sm:col-span-5 w-full"
                    selectedKey={flagshipId}
                    onSelectionChange={setFlagshipId}
                    options={flagshipOptions}
                  />
                  <AppSelect
                    name="engagementType"
                    label="Engagement Type"
                    placeholder="Select engagement type"
                    className="sm:col-span-5 w-full"
                    selectedKey={engagementType}
                    onSelectionChange={setEngagementType}
                    options={ENGAGEMENT_TYPE_OPTIONS}
                  />
                  <AppDate
                    name="engagementStartDate"
                    label="Start Date"
                    className="sm:col-span-5 w-full"
                    value={engagementStartDate}
                    onChange={setEngagementStartDate}
                  />
                  <AppDate
                    name="engagementEndDate"
                    label="End Date"
                    className="sm:col-span-5 w-full"
                    value={engagementEndDate}
                    onChange={setEngagementEndDate}
                  />
                </>
              ) : null}
            </FieldGroup>
          </Fieldset>
        </Form>
      </Stepper>
    </div>
  );
}
