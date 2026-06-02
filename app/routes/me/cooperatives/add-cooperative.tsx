import { useEffect, useState } from "react";
import { FieldGroup, Fieldset, Form } from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router";
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
import { enumValuesQueryOptions } from "~/lib/queries/lookups";
import { cooperativeQueryOptions, flagshipOptionsQueryOptions, type CooperativeRequest } from "~/lib/queries/cooperatives";

const STEPS: StepConfig[] = [
  { id: "cooperative-details", label: "Cooperative Details" },
  { id: "flagship-link", label: "Cooperative-Flagship Link" },
];

const DEFAULT_LOCATION: RwandaLocationValue = {
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

const ENGAGEMENT_TYPE_OPTIONS = [
  { label: "Implementing Partner", value: "implementing_partner" },
  { label: "Beneficiary Group", value: "beneficiary_group" },
  { label: "Service Provider", value: "service_provider" },
];

export function meta() {
  return [{ title: "Add Cooperative | M&E" }];
}

export default function MeAddCooperativePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const editId = params.get("editId");
  const isEdit = Boolean(editId);

  const [currentStep, setCurrentStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  // Created cooperative id — set after step 0 POST so step 1 can PATCH it
  const [createdId, setCreatedId] = useState<number | null>(null);

  // Step 0 fields
  const [cooperativeName, setCooperativeName] = useState("");
  const [cooperativeCode, setCooperativeCode] = useState("");
  const [groupType, setGroupType] = useState("");
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

  // Load existing cooperative when editing
  const { data: detail } = useQuery({
    ...cooperativeQueryOptions(editId ?? ""),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detail) return;
    setCooperativeName(detail.cooperativeName ?? "");
    setCooperativeCode(detail.cooperativeCode ?? "");
    setGroupType(detail.groupType ?? "");
    setRegistrationStatus(detail.registrationStatus ?? "");
    setPrimaryValueChain(detail.primaryValueChain ?? "");
    setCluster(detail.cluster ?? "");
    setTotalMembers(detail.totalMembers != null ? String(detail.totalMembers) : "");
    setFemaleMembers(detail.femaleMembers != null ? String(detail.femaleMembers) : "");
    setYouthMembers(detail.youthMembers != null ? String(detail.youthMembers) : "");
    setLocation({
      province: detail.province ?? "",
      district: detail.district ?? "",
      sector: detail.sector ?? "",
      cell: "",
      village: "",
    });
  }, [detail]);

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

  const step0Mutation = useMutation({
    mutationFn: (body: CooperativeRequest) =>
      isEdit
        ? api.patch<{ cooperativeId: number }>(`/api/cooperatives/${editId}`, body)
        : api.post<{ cooperativeId: number }>("/api/cooperatives", body),
    onSuccess: (res) => {
      setApiError(null);
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      if (isEdit && editId) {
        queryClient.invalidateQueries({ queryKey: ["cooperative", String(editId)] });
        setCreatedId(Number(editId));
      } else {
        setCreatedId(res.cooperativeId);
      }
      setCurrentStep(1);
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  const step1Mutation = useMutation({
    mutationFn: (flagships: Array<{ flagshipId: number; engagementType?: string; startDate?: string; endDate?: string }>) => {
      const id = createdId ?? (isEdit ? Number(editId) : null);
      if (!id) throw new Error("No cooperative ID");
      return api.patch<void>(`/api/cooperatives/${id}`, { flagships });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Cooperative updated" : "Cooperative created");
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      navigate("/me/cooperatives");
    },
    onError: (err) => setApiError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

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
    step0Mutation.mutate(buildStep0Body());
  }

  function handleSkipStep1() {
    toast.success(isEdit ? "Cooperative updated" : "Cooperative created");
    queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
    navigate("/me/cooperatives");
  }

  function handleSubmit() {
    setApiError(null);
    if (!flagshipId) {
      handleSkipStep1();
      return;
    }
    step1Mutation.mutate([
      {
        flagshipId: Number(flagshipId),
        engagementType: engagementType || undefined,
        startDate: engagementStartDate ? engagementStartDate.toString() : undefined,
        endDate: engagementEndDate ? engagementEndDate.toString() : undefined,
      },
    ]);
  }

  const stepHasValue =
    currentStep === 0
      ? !!(cooperativeName || cooperativeCode || groupType || location.province)
      : !!(flagshipId || engagementType || engagementStartDate);

  const isPending = step0Mutation.isPending || step1Mutation.isPending;

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Cooperatives Management" />

      {apiError ? <AppAlert status="danger" message={apiError} /> : null}

      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        onBack={() => {
          if (currentStep === 0) navigate("/me/cooperatives", { viewTransition: true });
          else setCurrentStep((s) => s - 1);
        }}
        onNext={goNext}
        onSkip={handleSkipStep1}
        onSubmit={handleSubmit}
        stepHasValue={stepHasValue}
        isSubmitting={isPending}
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
