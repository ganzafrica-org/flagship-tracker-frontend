import { useEffect, useState } from "react";
import { Button, FieldGroup, Fieldset, Form, Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";

import AppDate from "~/components/app-date";
import AppSelect, { NO_DATA_OPTIONS } from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import AppTextarea from "~/components/app-textarea";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { Stepper, type StepConfig } from "~/components/stepper";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import {
  buildCreateFlagshipRequest,
  createFlagship,
  createFlagshipKpi,
  type CreateFlagshipKpiRequest,
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

  const { data: flagshipDetail, isLoading: detailLoading, isError: detailError } = useQuery({
    ...flagshipDetailQueryOptions(editId),
    enabled: isUpdateMode,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

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
  const [investorName, setInvestorName] = useState("");
  const [investmentDate, setInvestmentDate] = useState<DateValue | null>(null);
  const [investmentYear, setInvestmentYear] = useState("");
  const [investmentDisbursementType, setInvestmentDisbursementType] = useState("");
  const [investmentNotes, setInvestmentNotes] = useState("");
  const [investments, setInvestments] = useState<string[]>([]);

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
  const [locations, setLocations] = useState<string[]>([]);

  const {
    clusterOptions,
    statusOptions,
    valueChainOptions,
    implementingAgencyOptions,
    funderOptions,
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
  }, [editId]);

  useEffect(() => {
    if (!isUpdateMode || !flagshipDetail || prefilled) return;

    setFlagshipName(flagshipDetail.flagshipName);
    setFlagshipCode(flagshipDetail.flagshipCode);
    setDescription(flagshipDetail.description ?? "");
    setFlagshipCluster(flagshipDetail.flagshipCluster);
    setFlagshipStatus(flagshipDetail.status);
    setPrimaryValueChain(flagshipDetail.primaryValueChain ?? "");
    setImplementingAgency(flagshipDetail.implementingAgency ?? "");
    setManagementModel(flagshipDetail.managementModel ?? "");
    setTargetYouthCount(
      flagshipDetail.targetYouthCount != null ? String(flagshipDetail.targetYouthCount) : "",
    );
    setBudgetTotalRwf(
      flagshipDetail.budgetTotalRwf != null ? String(flagshipDetail.budgetTotalRwf) : "",
    );

    if (flagshipDetail.startDate) {
      try {
        setStartDate(parseDate(flagshipDetail.startDate.slice(0, 10)));
      } catch {
        setStartDate(null);
      }
    }
    if (flagshipDetail.endDate) {
      try {
        setEndDate(parseDate(flagshipDetail.endDate.slice(0, 10)));
      } catch {
        setEndDate(null);
      }
    }

    setPrefilled(true);
  }, [isUpdateMode, flagshipDetail, prefilled]);

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

  function addInvestmentEntry() {
    if (!investmentAmount || !investmentCurrency || !investmentSourceType || !investmentYear) return;
    const entry = `${investmentYear}: ${investmentAmount} ${investmentCurrency} (${investmentSourceType})`;
    setInvestments((prev) => [...prev, entry]);
  }

  function addKpiEntry() {
    const definition = definitionByName.get(kpiIndicatorName);
    if (
      !definition ||
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
      indicatorName: definition.indicatorName,
      indicatorTier: definition.indicatorTier,
      indicatorValueType: definition.indicatorValueType,
      baselineValue: parseOptionalNumber(kpiBaselineValue),
      targetValue: parseOptionalNumber(kpiTargetValue),
      actualValue: parseOptionalNumber(kpiActualValue),
      measurementPoint,
      year,
      reportingPeriod: kpiReportingPeriod,
      verified: false,
      displayLabel: formatIndicatorNameLabel(definition.indicatorName),
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

  function addLocationEntry() {
    if (!location.province || !location.district) return;
    const entry = [location.province, location.district, location.sector, locationLabel].filter(Boolean).join(" / ");
    setLocations((prev) => [...prev, entry]);
  }

  async function handleSubmit() {
    if (!flagshipName.trim() || !flagshipCode.trim() || !flagshipCluster || !flagshipStatus) {
      setSubmitError("Complete required fields on Basic Flagship Details (name, code, cluster, status).");
      setCurrentStep(0);
      return;
    }

    setSubmitError(null);
    const body = buildCreateFlagshipRequest({
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

    try {
      const saved = await saveMutation.mutateAsync(body);

      if (!isUpdateMode) {
        for (const kpi of pendingKpis) {
          const { displayLabel: _displayLabel, ...kpiBody } = kpi;
          await createFlagshipKpi(saved.flagshipId, kpiBody);
        }
      }

      void queryClient.invalidateQueries({ queryKey: flagshipsQueryOptions.queryKey });
      void queryClient.invalidateQueries({ queryKey: ["flagships", saved.flagshipId] });
      void queryClient.invalidateQueries({ queryKey: ["flagships", saved.flagshipId, "detail"] });
      navigate(
        isUpdateMode ? returnTo : `/me/flagships/${saved.flagshipId}`,
        { viewTransition: true },
      );
    } catch (error) {
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

  if (isUpdateMode && detailLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title={isUpdateMode ? "Update Flagship" : "Flagship Projects Management"} />

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
                    <AppTextField
                      name="investorName"
                      label="Investor Name"
                      placeholder="Investor or organisation"
                      className="sm:col-span-5 w-full"
                      value={investorName}
                      onChange={setInvestorName}
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
                          <p key={`${entry}-${index}`} className="text-sm text-(--foreground-700)">
                            {index + 1}. {entry}
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
                      <p className="sm:col-span-10 text-sm text-(--warning)">
                        No KPI definitions found for code {flagshipCode.trim().toUpperCase()}. Add definitions in the backend or use a different code.
                      </p>
                    ) : null}
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
                      isDisabled={!hasFlagshipCodeForKpi || kpiLookupsLoading || definitionsEmpty}
                    />
                    <AppTextField
                      name="kpiIndicatorTier"
                      label="Indicator Tier"
                      placeholder="Set automatically from indicator"
                      className="sm:col-span-5 w-full"
                      value={tierLabels.get(kpiIndicatorTier) ?? kpiIndicatorTier}
                      onChange={() => {}}
                      isDisabled
                    />
                    <AppTextField
                      name="kpiValueType"
                      label="Indicator Value Type"
                      placeholder="Set automatically from indicator"
                      className="sm:col-span-5 w-full"
                      value={valueTypeLabels.get(kpiValueType) ?? kpiValueType}
                      onChange={() => {}}
                      isDisabled
                    />
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
                      isDisabled={!hasFlagshipCodeForKpi || definitionsEmpty}
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
                      isDisabled={!hasFlagshipCodeForKpi || definitionsEmpty}
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
                          <p key={`${entry}-${index}`} className="text-sm text-(--foreground-700)">
                            {index + 1}. {entry}
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
