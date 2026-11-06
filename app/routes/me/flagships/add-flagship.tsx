import { useEffect, useState } from "react";
import { Button, FieldGroup, Fieldset, Form, Spinner } from "@heroui/react";
import { IconFileImport } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";

import AppDate from "~/components/app-date";
import AppSelect, { NO_DATA_OPTIONS } from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import AppTextarea from "~/components/app-textarea";
import FlagshipImportDialog from "~/components/pages/flagships/flagship-import-dialog";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { Stepper, type StepConfig } from "~/components/stepper";
import { toast } from "~/components/app-alert";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import { isNetworkError } from "~/lib/offline-drafts/network";
import { createFlagshipDraft, deleteDraft, getDraft, updateDraft } from "~/lib/offline-drafts/repository";
import { showDraftSavedToast } from "~/lib/offline-drafts/toast";
import {
  buildCreateFlagshipRequest,
  createFlagship,
  createFlagshipInvestment,
  createFlagshipKpi,
  createFlagshipLocation,
  ensureFlagshipKpiDefinition,
  type CreateFlagshipInvestmentRequest,
  type CreateFlagshipKpiRequest,
  type CreateFlagshipLocationRequest,
  type CreateFlagshipRequest,
  flagshipDetailQueryOptions,
  flagshipsQueryOptions,
  updateFlagship,
} from "~/lib/queries/flagships";
import {
  formatIndicatorNameLabel,
  MEASUREMENT_POINT_OPTIONS,
  useFlagshipFormLookups,
  useKpiFormLookups,
} from "~/lib/queries/lookups";

interface PendingKpi extends CreateFlagshipKpiRequest {
  displayLabel: string;
}

interface PendingInvestment extends CreateFlagshipInvestmentRequest {
  displayLabel: string;
}

interface PendingLocation extends CreateFlagshipLocationRequest {
  displayLabel: string;
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

const STEPS: StepConfig[] = [
  { id: "basic-details", label: "Basic Flagship Details" },
  { id: "investment", label: "Investment" },
  { id: "kpis", label: "KPIs" },
  { id: "location", label: "Location" },
];

const DEFAULT_LOCATION: RwandaLocationValue = {
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

function formatDateValue(date: DateValue | null): string | undefined {
  if (!date) return undefined;
  return date.toString();
}

export function meta() {
  return [{ title: "Add Flagship | M&E" }];
}

export default function MeAddFlagshipPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = Number(searchParams.get("editId") || 0);
  const isUpdateMode = Number.isFinite(editId) && editId > 0;
  const returnTo = searchParams.get("returnTo") || "/me/flagships";
  const draftIdRaw = Number(searchParams.get("draftId") || 0);
  const draftId = Number.isFinite(draftIdRaw) && draftIdRaw > 0 ? draftIdRaw : null;

  const { data: flagshipDetail, isLoading: detailLoading, isError: detailError } = useQuery({
    ...flagshipDetailQueryOptions(editId),
    enabled: isUpdateMode,
  });
  const [draftData, setDraftData] = useState<{
    payload: CreateFlagshipRequest;
    pendingKpis: PendingKpi[];
    pendingInvestments: PendingInvestment[];
    pendingLocations: PendingLocation[];
    createdEntityId?: number;
  } | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  useEffect(() => {
    if (!draftId) {
      setDraftData(null);
      return;
    }
    setDraftLoading(true);
    void getDraft(draftId).then((draft) => {
      setDraftData(
        draft && draft.entityType === "flagship"
          ? {
              payload: draft.payload,
              pendingKpis: draft.pendingKpis,
              pendingInvestments: draft.pendingInvestments ?? [],
              pendingLocations: draft.pendingLocations ?? [],
              createdEntityId: draft.createdEntityId,
            }
          : null,
      );
      setDraftLoading(false);
    });
  }, [draftId]);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Step 0 fields
  const [flagshipName, setFlagshipName] = useState("");
  const [flagshipCode, setFlagshipCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<DateValue | null>(null);
  const [endDate, setEndDate] = useState<DateValue | null>(null);
  const [implementingAgency, setImplementingAgency] = useState("");
  const [managementModel, setManagementModel] = useState("");
  const [targetYouthCount, setTargetYouthCount] = useState("");
  const [budgetTotalRwf, setBudgetTotalRwf] = useState("");
  const [flagshipCluster, setFlagshipCluster] = useState("");
  const [flagshipStatus, setFlagshipStatus] = useState("");
  const [primaryValueChain, setPrimaryValueChain] = useState("");
  const [funder, setFunder] = useState("");

  // Step 1 fields
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentCurrency, setInvestmentCurrency] = useState("");
  const [investmentSourceType, setInvestmentSourceType] = useState("");
  const [investmentDate, setInvestmentDate] = useState<DateValue | null>(null);
  const [investmentYear, setInvestmentYear] = useState("");
  const [investmentDisbursementType, setInvestmentDisbursementType] = useState("");
  const [investmentNotes, setInvestmentNotes] = useState("");
  const [investmentFunderId, setInvestmentFunderId] = useState("");
  const [investments, setInvestments] = useState<PendingInvestment[]>([]);

  // Step 2 fields
  const [kpiIndicatorName, setKpiIndicatorName] = useState("");
  const [kpiIndicatorTier, setKpiIndicatorTier] = useState("");
  const [kpiValueType, setKpiValueType] = useState("");
  const [kpiBaselineValue, setKpiBaselineValue] = useState("");
  const [kpiTargetValue, setKpiTargetValue] = useState("");
  const [kpiActualValue, setKpiActualValue] = useState("");
  const [kpiReportingPeriod, setKpiReportingPeriod] = useState("");
  const [kpiMeasurementPoint, setKpiMeasurementPoint] = useState("");
  const [kpiYear, setKpiYear] = useState("");
  const [pendingKpis, setPendingKpis] = useState<PendingKpi[]>([]);

  // Step 3 fields
  const [location, setLocation] = useState<RwandaLocationValue>(DEFAULT_LOCATION);
  const [locationLabel, setLocationLabel] = useState("");
  const [locations, setLocations] = useState<PendingLocation[]>([]);

  const {
    clusterOptions,
    statusOptions,
    valueChainOptions,
    implementingAgencyOptions,
    funderOptions,
    funderIdOptions,
    sourceTypeOptions,
    disbursementTypeOptions,
    currencyOptions,
    isLoading: lookupsLoading,
    isError: lookupsError,
  } = useFlagshipFormLookups(flagshipCluster);

  const {
    indicatorOptions: kpiIndicatorOptions,
    definitionByName,
    reportingPeriodOptions,
    tierLabels,
    valueTypeLabels,
    tierOptions,
    valueTypeOptions,
    isLoading: kpiLookupsLoading,
    isError: kpiLookupsError,
    hasCode: hasFlagshipCodeForKpi,
    definitionsEmpty,
  } = useKpiFormLookups(flagshipCode);

  useEffect(() => {
    if (!primaryValueChain) return;
    const stillValid = valueChainOptions.some((opt) => opt.value === primaryValueChain);
    if (!stillValid) setPrimaryValueChain("");
  }, [flagshipCluster, valueChainOptions, primaryValueChain]);

  useEffect(() => {
    setKpiIndicatorName("");
    setKpiIndicatorTier("");
    setKpiValueType("");
  }, [flagshipCode]);

  useEffect(() => {
    setPrefilled(false);
  }, [editId, draftId]);

  useEffect(() => {
    const source = isUpdateMode ? flagshipDetail : draftData?.payload;
    if ((!isUpdateMode && !draftId) || !source || prefilled) return;

    setFlagshipName(source.flagshipName);
    setFlagshipCode(source.flagshipCode);
    setDescription(source.description ?? "");
    setFlagshipCluster(source.flagshipCluster);
    setFlagshipStatus(source.status);
    setPrimaryValueChain(source.primaryValueChain ?? "");
    setImplementingAgency(source.implementingAgency ?? "");
    setManagementModel(source.managementModel ?? "");
    setTargetYouthCount(
      source.targetYouthCount != null ? String(source.targetYouthCount) : "",
    );
    setBudgetTotalRwf(
      source.budgetTotalRwf != null ? String(source.budgetTotalRwf) : "",
    );
    setFunder(source.funders ?? "");

    if (source.startDate) {
      try {
        setStartDate(parseDate(source.startDate.slice(0, 10)));
      } catch {
        setStartDate(null);
      }
    }
    if (source.endDate) {
      try {
        setEndDate(parseDate(source.endDate.slice(0, 10)));
      } catch {
        setEndDate(null);
      }
    }
    if (!isUpdateMode && draftData) {
      setPendingKpis(draftData.pendingKpis);
      setInvestments(draftData.pendingInvestments);
      setLocations(draftData.pendingLocations);
      if (draftData.createdEntityId) setServerFlagshipId(draftData.createdEntityId);
    }

    setPrefilled(true);
  }, [isUpdateMode, draftId, flagshipDetail, draftData, prefilled]);

  const saveMutation = useMutation({
    mutationFn: async (body: ReturnType<typeof buildCreateFlagshipRequest>) => {
      if (isUpdateMode) {
        return updateFlagship(editId, body);
      }
      return createFlagship(body);
    },
  });

  function handleKpiIndicatorChange(name: string) {
    setKpiIndicatorName(name);
    const definition = definitionByName.get(name);
    if (definition) {
      setKpiIndicatorTier(definition.indicatorTier);
      setKpiValueType(definition.indicatorValueType);
    } else {
      setKpiIndicatorTier("");
      setKpiValueType("");
    }
  }

  const stepHasValue =
    currentStep === 0 ? !!(flagshipName || flagshipCode || flagshipCluster) :
    currentStep === 1 ? !!(investmentAmount || investmentCurrency || investmentYear) :
    currentStep === 2 ? !!(kpiIndicatorName || kpiIndicatorTier) :
    currentStep === 3 ? !!(location.province) :
    false;

  function goNext() {
    setCurrentStep((s) => s + 1);
  }

  function currentInvestment(): PendingInvestment | null {
    const amount = Number(investmentAmount.replace(/,/g, "").trim());
    const year = Number.parseInt(investmentYear, 10);
    const funderId = Number.parseInt(investmentFunderId, 10);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (!investmentCurrency || !investmentSourceType) return null;
    if (!Number.isFinite(funderId) || funderId < 1) return null;
    if (!Number.isFinite(year) || year < 2000 || year > 2100) return null;
    const funderLabel = funderIdOptions.find((option) => option.value === investmentFunderId)?.label ?? "Funder";
    return {
      amount,
      currency: investmentCurrency,
      sourceType: investmentSourceType,
      funderId,
      investmentDate: formatDateValue(investmentDate) ?? null,
      year,
      disbursementType: investmentDisbursementType || null,
      notes: investmentNotes.trim() || null,
      displayLabel: `${year}: ${amount} ${investmentCurrency} — ${funderLabel}`,
    };
  }

  function addInvestmentEntry() {
    const row = currentInvestment();
    if (!row) return;
    setInvestments((prev) => [...prev, row]);
    setInvestmentAmount("");
    setInvestmentCurrency("");
    setInvestmentSourceType("");
    setInvestmentFunderId("");
    setInvestmentDate(null);
    setInvestmentYear("");
    setInvestmentDisbursementType("");
    setInvestmentNotes("");
  }

  function currentLocation(): PendingLocation | null {
    if (!location.province || !location.district) return null;
    const sector = location.sector.trim() || null;
    const parts = [location.province, location.district, sector, locationLabel.trim()].filter(Boolean);
    return {
      province: location.province,
      district: location.district,
      sector,
      displayLabel: parts.join(" / "),
    };
  }

  function addLocationEntry() {
    const row = currentLocation();
    if (!row) return;
    setLocations((prev) => [...prev, row]);
    setLocation(DEFAULT_LOCATION);
    setLocationLabel("");
  }

  /** Queued rows plus the row currently on the form, so Submit saves it without a separate Add click. */
  function collectInvestments(): PendingInvestment[] {
    const current = currentInvestment();
    return current ? [...investments, current] : investments;
  }

  function collectLocations(): PendingLocation[] {
    const current = currentLocation();
    return current ? [...locations, current] : locations;
  }

  function addKpiEntry() {
    const definition = definitionByName.get(kpiIndicatorName);
    const indicatorName = definition?.indicatorName
      ?? kpiIndicatorName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const indicatorTier = definition?.indicatorTier ?? kpiIndicatorTier;
    const indicatorValueType = definition?.indicatorValueType ?? kpiValueType;
    if (
      !indicatorName ||
      !indicatorTier ||
      !indicatorValueType ||
      !kpiMeasurementPoint ||
      !kpiYear ||
      !kpiReportingPeriod
    ) {
      return;
    }

    const measurementPoint = Number.parseInt(kpiMeasurementPoint, 10);
    const year = Number.parseInt(kpiYear, 10);
    if (!Number.isFinite(measurementPoint) || measurementPoint < 0 || measurementPoint > 2) return;
    if (!Number.isFinite(year)) return;

    const row: PendingKpi = {
      indicatorName,
      indicatorTier,
      indicatorValueType,
      baselineValue: parseOptionalNumber(kpiBaselineValue),
      targetValue: parseOptionalNumber(kpiTargetValue),
      actualValue: parseOptionalNumber(kpiActualValue),
      measurementPoint,
      year,
      reportingPeriod: kpiReportingPeriod,
      verified: false,
      displayLabel: formatIndicatorNameLabel(indicatorName),
    };

    setPendingKpis((prev) => [...prev, row]);
    setKpiIndicatorName("");
    setKpiIndicatorTier("");
    setKpiValueType("");
    setKpiBaselineValue("");
    setKpiTargetValue("");
    setKpiActualValue("");
    setKpiMeasurementPoint("");
    setKpiYear("");
    setKpiReportingPeriod("");
  }

  function buildFlagshipPayload(): CreateFlagshipRequest {
    return buildCreateFlagshipRequest({
      flagshipName,
      flagshipCode,
      flagshipCluster,
      status: flagshipStatus,
      description,
      primaryValueChain,
      startDate: formatDateValue(startDate),
      endDate: formatDateValue(endDate),
      implementingAgency,
      managementModel,
      targetYouthCount,
      budgetTotalRwf,
      funders: funder || undefined,
    });
  }

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [serverFlagshipId, setServerFlagshipId] = useState<number | undefined>();

  function draftExtras(body: CreateFlagshipRequest, createdEntityId?: number) {
    return {
      payload: body,
      pendingKpis,
      pendingInvestments: collectInvestments(),
      pendingLocations: collectLocations(),
      ...(createdEntityId ? { createdEntityId } : {}),
    };
  }

  async function rememberDraft(body: CreateFlagshipRequest, createdEntityId?: number) {
    const extras = draftExtras(body, createdEntityId);
    if (draftId) {
      await updateDraft(draftId, extras);
    } else {
      await createFlagshipDraft(body, extras.pendingKpis, {
        pendingInvestments: extras.pendingInvestments,
        pendingLocations: extras.pendingLocations,
        createdEntityId,
      });
    }
  }

  async function handleSaveDraft() {
    setIsSavingDraft(true);
    try {
      await rememberDraft(buildFlagshipPayload(), draftData?.createdEntityId);
      showDraftSavedToast();
      navigate(returnTo, { viewTransition: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save draft");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handleSubmit() {
    if (!flagshipName.trim() || !flagshipCode.trim() || !flagshipCluster || !flagshipStatus) {
      setSubmitError("Complete required fields on Basic Flagship Details (name, code, cluster, status).");
      setCurrentStep(0);
      return;
    }

    setSubmitError(null);
    const body = buildFlagshipPayload();
    const kpis = [...pendingKpis];
    const investmentRows = collectInvestments();
    const locationRows = collectLocations();
    setInvestments(investmentRows);
    setLocations(locationRows);
    setInvestmentAmount("");
    setInvestmentFunderId("");
    setInvestmentYear("");
    setLocation(DEFAULT_LOCATION);
    setLocationLabel("");
    let flagshipId = isUpdateMode ? editId : serverFlagshipId;
    let kpiIndex = 0;
    let investmentIndex = 0;
    let locationIndex = 0;

    try {
      if (isUpdateMode) {
        const saved = await saveMutation.mutateAsync(body);
        flagshipId = saved.flagshipId;
      } else if (flagshipId) {
        const saved = await updateFlagship(flagshipId, body);
        flagshipId = saved.flagshipId;
      } else {
        const saved = await saveMutation.mutateAsync(body);
        flagshipId = saved.flagshipId;
        setServerFlagshipId(flagshipId);
      }

      if (!isUpdateMode && flagshipId) {
        for (; kpiIndex < kpis.length; kpiIndex++) {
          const { displayLabel: _displayLabel, ...kpiBody } = kpis[kpiIndex];
          await ensureFlagshipKpiDefinition(body.flagshipCode, {
            indicatorName: kpiBody.indicatorName,
            indicatorTier: kpiBody.indicatorTier,
            indicatorValueType: kpiBody.indicatorValueType,
          });
          await createFlagshipKpi(flagshipId, kpiBody);
        }
        for (; investmentIndex < investmentRows.length; investmentIndex++) {
          const { displayLabel: _displayLabel, ...investmentBody } = investmentRows[investmentIndex];
          await createFlagshipInvestment(flagshipId, investmentBody);
        }
        for (; locationIndex < locationRows.length; locationIndex++) {
          const { displayLabel: _displayLabel, ...locationBody } = locationRows[locationIndex];
          await createFlagshipLocation(flagshipId, locationBody);
        }
      }

      void queryClient.invalidateQueries({ queryKey: flagshipsQueryOptions.queryKey });
      void queryClient.invalidateQueries({ queryKey: ["flagships", flagshipId] });
      void queryClient.invalidateQueries({ queryKey: ["flagships", flagshipId, "detail"] });
      if (draftId) void deleteDraft(draftId);
      navigate(
        isUpdateMode ? returnTo : `/me/flagships/${flagshipId}`,
        { viewTransition: true },
      );
    } catch (error) {
      if (!isUpdateMode) {
        const remainingKpis = kpis.slice(kpiIndex);
        const remainingInvestments = investmentRows.slice(investmentIndex);
        const remainingLocations = locationRows.slice(locationIndex);
        setPendingKpis(remainingKpis);
        setInvestments(remainingInvestments);
        setLocations(remainingLocations);
        if (flagshipId) setServerFlagshipId(flagshipId);
        const remaining = {
          payload: body,
          pendingKpis: remainingKpis,
          pendingInvestments: remainingInvestments,
          pendingLocations: remainingLocations,
          ...(flagshipId ? { createdEntityId: flagshipId } : {}),
        };
        if (isNetworkError(error) || flagshipId) {
          void (draftId ? updateDraft(draftId, remaining) : createFlagshipDraft(body, remaining.pendingKpis, {
            pendingInvestments: remaining.pendingInvestments,
            pendingLocations: remaining.pendingLocations,
            createdEntityId: flagshipId,
          }));
        }
        if (isNetworkError(error)) {
          showDraftSavedToast();
          navigate(returnTo, { viewTransition: true });
          return;
        }
      }
      if (error instanceof ApiError) {
        setSubmitError(formatApiErrorMessage(error.message));
      } else if (error instanceof Error) {
        setSubmitError(error.message || "Failed to save flagship");
      } else {
        setSubmitError("Failed to save flagship");
      }
    }
  }

  const selectOptions = (apiOptions: typeof clusterOptions, loading: boolean) => {
    if (loading) return [{ label: "Loading…", value: "" }];
    if (apiOptions.length === 0) return NO_DATA_OPTIONS;
    return apiOptions;
  };

  if ((isUpdateMode && detailLoading) || (draftId && draftLoading)) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard
        title={isUpdateMode ? "Update Flagship" : "Flagship Projects Management"}
        actionSlot={
          isUpdateMode ? undefined : (
            <Button variant="outline" className="!rounded-3xl font-medium shrink-0" onPress={() => setImportOpen(true)}>
              <IconFileImport size={16} />
              Import
            </Button>
          )
        }
      />
      {isUpdateMode ? null : (
        <FlagshipImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} flagshipsPath="/me/flagships" />
      )}

      {isUpdateMode && detailError ? (
        <p className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
          Could not load flagship details for editing.
        </p>
      ) : null}

      {lookupsError || kpiLookupsError ? (
        <p className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
          Could not load form options. Check that you are logged in and try again.
        </p>
      ) : null}

      {submitError ? (
        <p className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
          {submitError}
        </p>
      ) : null}

      <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onBack={() => {
            if (currentStep === 0) navigate(returnTo, { viewTransition: true });
            else setCurrentStep((s) => s - 1);
          }}
          onNext={goNext}
          onSkip={() => setCurrentStep((s) => s + 1)}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSavingDraft={isSavingDraft}
          stepHasValue={stepHasValue}
          isSubmitting={saveMutation.isPending}
          isNextDisabled={lookupsLoading && currentStep === 0}
        >
          <Form className="w-full" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
            <Fieldset className="w-full border-none p-0">
              <FieldGroup className="grid gap-4 sm:grid-cols-10 w-full">
                {currentStep === 0 ? (
                  <>
                    <AppTextField
                      name="flagshipName"
                      label="Flagship Name"
                      placeholder="Full program name"
                      className="sm:col-span-5 w-full"
                      value={flagshipName}
                      onChange={setFlagshipName}
                      isRequired
                    />
                    <AppTextField
                      name="flagshipCode"
                      label="Flagship Code"
                      placeholder="e.g., YEPA"
                      className="sm:col-span-5 w-full"
                      value={flagshipCode}
                      onChange={setFlagshipCode}
                      isRequired
                      isDisabled={isUpdateMode}
                    />
                    <AppSelect
                      name="flagshipCluster"
                      label="Flagship Cluster"
                      placeholder="Select cluster"
                      className="sm:col-span-5 w-full"
                      selectedKey={flagshipCluster}
                      onSelectionChange={setFlagshipCluster}
                      options={selectOptions(clusterOptions, lookupsLoading)}
                      isRequired
                      isDisabled={lookupsLoading}
                    />
                    <AppSelect
                      name="primaryValueChain"
                      label="Primary Value Chain"
                      placeholder={
                        flagshipCluster ? "Select primary value chain" : "Select cluster first"
                      }
                      className="sm:col-span-5 w-full"
                      selectedKey={primaryValueChain}
                      onSelectionChange={setPrimaryValueChain}
                      options={selectOptions(valueChainOptions, lookupsLoading)}
                      isDisabled={lookupsLoading || !flagshipCluster}
                    />
                    <AppTextarea
                      name="description"
                      label="Description"
                      placeholder="Narrative description of the program"
                      className="sm:col-span-5 w-full"
                      rows={4}
                      value={description}
                      onChange={setDescription}
                    />
                    <AppSelect
                      name="funders"
                      label="Funder"
                      placeholder="Select funder (optional)"
                      className="sm:col-span-5 w-full"
                      selectedKey={funder}
                      onSelectionChange={setFunder}
                      options={selectOptions(funderOptions, lookupsLoading)}
                      isDisabled={lookupsLoading}
                    />
                    <AppDate
                      name="startDate"
                      label="Start Date"
                      className="sm:col-span-5 w-full"
                      value={startDate}
                      onChange={setStartDate}
                    />
                    <AppDate
                      name="endDate"
                      label="End Date"
                      className="sm:col-span-5 w-full"
                      value={endDate}
                      onChange={setEndDate}
                    />
                    <AppSelect
                      name="status"
                      label="Status"
                      placeholder="Select status"
                      className="sm:col-span-5 w-full"
                      selectedKey={flagshipStatus}
                      onSelectionChange={setFlagshipStatus}
                      options={selectOptions(statusOptions, lookupsLoading)}
                      isRequired
                      isDisabled={lookupsLoading}
                    />
                    <AppSelect
                      name="implementingAgency"
                      label="Implementing Agency"
                      placeholder="Select agency (optional)"
                      className="sm:col-span-5 w-full"
                      selectedKey={implementingAgency}
                      onSelectionChange={setImplementingAgency}
                      options={selectOptions(implementingAgencyOptions, lookupsLoading)}
                      isDisabled={lookupsLoading}
                    />
                    <AppTextField
                      name="managementModel"
                      label="Management Model"
                      placeholder="e.g., direct, contracted"
                      className="sm:col-span-5 w-full"
                      value={managementModel}
                      onChange={setManagementModel}
                    />
                    <AppTextField
                      name="targetYouthCount"
                      label="Target Youth Count"
                      type="number"
                      placeholder="0"
                      className="sm:col-span-5 w-full"
                      value={targetYouthCount}
                      onChange={setTargetYouthCount}
                      min={1}
                      step={1}
                    />
                    <AppTextField
                      name="budgetTotalRwf"
                      label="Budget Total (RWF)"
                      placeholder="Minimum 1"
                      className="sm:col-span-5 w-full"
                      value={budgetTotalRwf}
                      onChange={setBudgetTotalRwf}
                      inputMode="numeric"
                    />
                  </>
                ) : null}

                {currentStep === 1 ? (
                  <>
                    <AppTextField
                      name="investmentAmount"
                      label="Investment Amount"
                      placeholder="0"
                      className="sm:col-span-5 w-full"
                      value={investmentAmount}
                      onChange={setInvestmentAmount}
                      inputMode="decimal"
                      isRequired
                    />
                    <AppSelect
                      name="investmentCurrency"
                      label="Currency"
                      placeholder="Select currency"
                      className="sm:col-span-5 w-full"
                      selectedKey={investmentCurrency}
                      onSelectionChange={setInvestmentCurrency}
                      options={selectOptions(currencyOptions, lookupsLoading)}
                      isRequired
                      isDisabled={lookupsLoading}
                    />
                    <AppSelect
                      name="investmentSourceType"
                      label="Source Type"
                      placeholder="Select source type"
                      className="sm:col-span-5 w-full"
                      selectedKey={investmentSourceType}
                      onSelectionChange={setInvestmentSourceType}
                      options={selectOptions(sourceTypeOptions, lookupsLoading)}
                      isRequired
                      isDisabled={lookupsLoading}
                    />
                    <AppSelect
                      name="investmentFunderId"
                      label="Funder"
                      placeholder="Select funder"
                      className="sm:col-span-5 w-full"
                      selectedKey={investmentFunderId}
                      onSelectionChange={setInvestmentFunderId}
                      options={selectOptions(funderIdOptions, lookupsLoading)}
                      isRequired
                      isDisabled={lookupsLoading}
                    />
                    <AppDate
                      name="investmentDate"
                      label="Investment Date"
                      className="sm:col-span-5 w-full"
                      value={investmentDate}
                      onChange={setInvestmentDate}
                    />
                    <AppTextField
                      name="investmentYear"
                      label="Year"
                      type="number"
                      placeholder="2026"
                      className="sm:col-span-5 w-full"
                      value={investmentYear}
                      onChange={setInvestmentYear}
                      min={2000}
                      step={1}
                      isRequired
                    />
                    <AppSelect
                      name="investmentDisbursementType"
                      label="Disbursement Type"
                      placeholder="Select disbursement type"
                      className="sm:col-span-5 w-full"
                      selectedKey={investmentDisbursementType}
                      onSelectionChange={setInvestmentDisbursementType}
                      options={selectOptions(disbursementTypeOptions, lookupsLoading)}
                      isDisabled={lookupsLoading}
                    />
                    <AppTextField
                      name="investmentNotes"
                      label="Notes"
                      placeholder="Additional context or conditions"
                      className="sm:col-span-10 w-full"
                      value={investmentNotes}
                      onChange={setInvestmentNotes}
                    />
                    <div className="sm:col-span-10 flex items-center justify-between rounded-lg border border-(--border) p-3">
                      <p className="text-sm text-(--foreground-600)">
                        Capture one or more investment records for this flagship.
                      </p>
                      <Button type="button" variant="outline" onPress={addInvestmentEntry}>
                        Add Investment Entry
                      </Button>
                    </div>
                    {investments.length > 0 ? (
                      <div className="sm:col-span-10 space-y-1 rounded-lg border border-(--border) p-3">
                        {investments.map((entry, index) => (
                          <p key={`${entry.displayLabel}-${index}`} className="text-sm text-(--foreground-700)">
                            {index + 1}. {entry.displayLabel}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}

                {currentStep === 2 ? (
                  <>
                    {!hasFlagshipCodeForKpi ? (
                      <p className="sm:col-span-10 text-sm text-(--foreground-600)">
                        Enter a flagship code on Basic Flagship Details (e.g. YEPA) to load approved KPI indicators.
                      </p>
                    ) : definitionsEmpty ? (
                      <p className="sm:col-span-10 text-sm text-(--foreground-600)">
                        This flagship code has no saved indicators yet. Enter one below and it is saved with the flagship.
                      </p>
                    ) : null}
                    {definitionsEmpty ? (
                      <AppTextField
                        name="kpiIndicatorName"
                        label="KPI Indicator Name"
                        placeholder="Jobs created"
                        className="sm:col-span-5 w-full"
                        value={kpiIndicatorName}
                        onChange={setKpiIndicatorName}
                        isRequired
                        isDisabled={!hasFlagshipCodeForKpi}
                      />
                    ) : (
                      <AppSelect
                        name="kpiIndicatorName"
                        label="KPI Indicator Name"
                        placeholder={
                          hasFlagshipCodeForKpi ? "Select approved KPI name" : "Enter flagship code first"
                        }
                        className="sm:col-span-5 w-full"
                        selectedKey={kpiIndicatorName}
                        onSelectionChange={handleKpiIndicatorChange}
                        options={selectOptions(kpiIndicatorOptions, kpiLookupsLoading)}
                        isRequired
                        isDisabled={!hasFlagshipCodeForKpi || kpiLookupsLoading}
                      />
                    )}
                    {definitionsEmpty ? (
                      <AppSelect
                        name="kpiIndicatorTier"
                        label="Indicator Tier"
                        placeholder="Select tier"
                        className="sm:col-span-5 w-full"
                        selectedKey={kpiIndicatorTier}
                        onSelectionChange={setKpiIndicatorTier}
                        options={selectOptions(tierOptions, kpiLookupsLoading)}
                        isRequired
                        isDisabled={!hasFlagshipCodeForKpi || kpiLookupsLoading}
                      />
                    ) : (
                      <AppTextField
                        name="kpiIndicatorTier"
                        label="Indicator Tier"
                        placeholder="Set automatically from indicator"
                        className="sm:col-span-5 w-full"
                        value={tierLabels.get(kpiIndicatorTier) ?? kpiIndicatorTier}
                        onChange={() => {}}
                        isDisabled
                      />
                    )}
                    {definitionsEmpty ? (
                      <AppSelect
                        name="kpiValueType"
                        label="Indicator Value Type"
                        placeholder="Select value type"
                        className="sm:col-span-5 w-full"
                        selectedKey={kpiValueType}
                        onSelectionChange={setKpiValueType}
                        options={selectOptions(valueTypeOptions, kpiLookupsLoading)}
                        isRequired
                        isDisabled={!hasFlagshipCodeForKpi || kpiLookupsLoading}
                      />
                    ) : (
                      <AppTextField
                        name="kpiValueType"
                        label="Indicator Value Type"
                        placeholder="Set automatically from indicator"
                        className="sm:col-span-5 w-full"
                        value={valueTypeLabels.get(kpiValueType) ?? kpiValueType}
                        onChange={() => {}}
                        isDisabled
                      />
                    )}
                    <AppTextField
                      name="kpiBaselineValue"
                      label="Baseline Value"
                      type="number"
                      placeholder="0"
                      className="sm:col-span-5 w-full"
                      value={kpiBaselineValue}
                      onChange={setKpiBaselineValue}
                      min={0}
                      step={0.01}
                    />
                    <AppTextField
                      name="kpiTargetValue"
                      label="Target Value"
                      type="number"
                      placeholder="0"
                      className="sm:col-span-5 w-full"
                      value={kpiTargetValue}
                      onChange={setKpiTargetValue}
                      min={0}
                      step={0.01}
                    />
                    <AppTextField
                      name="kpiActualValue"
                      label="Actual Value"
                      type="number"
                      placeholder="0"
                      className="sm:col-span-5 w-full"
                      value={kpiActualValue}
                      onChange={setKpiActualValue}
                      min={0}
                      step={0.01}
                    />
                    <AppSelect
                      name="kpiMeasurementPoint"
                      label="Measurement Point"
                      placeholder="Select measurement point"
                      className="sm:col-span-5 w-full"
                      selectedKey={kpiMeasurementPoint}
                      onSelectionChange={setKpiMeasurementPoint}
                      options={MEASUREMENT_POINT_OPTIONS}
                      isRequired
                      isDisabled={!hasFlagshipCodeForKpi}
                    />
                    <AppTextField
                      name="kpiYear"
                      label="Year"
                      type="number"
                      placeholder="2026"
                      className="sm:col-span-5 w-full"
                      value={kpiYear}
                      onChange={setKpiYear}
                      min={2000}
                      step={1}
                      isRequired
                    />
                    <AppSelect
                      name="kpiReportingPeriod"
                      label="Reporting Period"
                      placeholder="Select reporting period"
                      className="sm:col-span-5 w-full"
                      selectedKey={kpiReportingPeriod}
                      onSelectionChange={setKpiReportingPeriod}
                      options={selectOptions(reportingPeriodOptions, kpiLookupsLoading)}
                      isRequired
                      isDisabled={!hasFlagshipCodeForKpi}
                    />
                    <div className="sm:col-span-10 flex items-center justify-between rounded-lg border border-(--border) p-3">
                      <p className="text-sm text-(--foreground-600)">
                        Capture one or more KPI records for this flagship.
                      </p>
                      <Button type="button" variant="outline" onPress={addKpiEntry}>
                        Add KPI Entry
                      </Button>
                    </div>
                    {pendingKpis.length > 0 ? (
                      <div className="sm:col-span-10 space-y-1 rounded-lg border border-(--border) p-3">
                        {pendingKpis.map((entry, index) => (
                          <p key={`${entry.indicatorName}-${entry.year}-${entry.reportingPeriod}-${index}`} className="text-sm text-(--foreground-700)">
                            {index + 1}. {entry.displayLabel} — {entry.year} {entry.reportingPeriod} (point {entry.measurementPoint})
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}

                {currentStep === 3 ? (
                  <>
                    <div className="sm:col-span-10">
                      <span className="mb-2 block text-sm font-medium text-(--foreground)">
                        Flagship Location
                      </span>
                      <RwandaLocationSelector value={location} onChange={setLocation} />
                    </div>
                    <AppTextField
                      name="locationLabel"
                      label="Location Label"
                      placeholder="Optional site label for this location"
                      className="sm:col-span-10 w-full"
                      value={locationLabel}
                      onChange={setLocationLabel}
                    />
                    <div className="sm:col-span-10 flex items-center justify-between rounded-lg border border-(--border) p-3">
                      <p className="text-sm text-(--foreground-600)">
                        Capture one or more implementation locations.
                      </p>
                      <Button type="button" variant="outline" onPress={addLocationEntry}>
                        Add Location Entry
                      </Button>
                    </div>
                    {locations.length > 0 ? (
                      <div className="sm:col-span-10 space-y-1 rounded-lg border border-(--border) p-3">
                        {locations.map((entry, index) => (
                          <p key={`${entry.displayLabel}-${index}`} className="text-sm text-(--foreground-700)">
                            {index + 1}. {entry.displayLabel}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </FieldGroup>
            </Fieldset>
          </Form>
        </Stepper>
    </div>
  );
}
