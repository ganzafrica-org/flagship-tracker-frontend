import { useState } from "react";
import { Button, FieldGroup, Fieldset, Form } from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router";
import type { DateValue } from "@internationalized/date";

import AppDate from "~/components/app-date";
import AppSelect, { NO_DATA_OPTIONS } from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import AppTextarea from "~/components/app-textarea";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { Stepper, type StepConfig } from "~/components/stepper";

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

export function meta() {
  return [{ title: "Add Flagship | M&E" }];
}

export default function MeAddFlagshipPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdateMode = searchParams.get("mode") === "update";

  const [currentStep, setCurrentStep] = useState(0);

  // Step 0 fields
  const [selectedFlagshipId, setSelectedFlagshipId] = useState("");
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
  const [kpis, setKpis] = useState<string[]>([]);

  // Step 3 fields
  const [location, setLocation] = useState<RwandaLocationValue>(DEFAULT_LOCATION);
  const [locationLabel, setLocationLabel] = useState("");
  const [locations, setLocations] = useState<string[]>([]);

  const stepHasValue =
    currentStep === 0 ? !!(flagshipName || selectedFlagshipId || flagshipCode || flagshipCluster) :
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
    if (!kpiIndicatorName || !kpiIndicatorTier || !kpiMeasurementPoint || !kpiYear || !kpiReportingPeriod) return;
    const entry = `${kpiIndicatorName} - ${kpiYear} ${kpiReportingPeriod} (point ${kpiMeasurementPoint})`;
    setKpis((prev) => [...prev, entry]);
  }

  function addLocationEntry() {
    if (!location.province || !location.district) return;
    const entry = [location.province, location.district, location.sector, locationLabel].filter(Boolean).join(" / ");
    setLocations((prev) => [...prev, entry]);
  }

  function handleSubmit() {
    console.log("Flagship form submitted", {
      flagshipName, flagshipCode, description, startDate, endDate,
      implementingAgency, managementModel, targetYouthCount, budgetTotalRwf,
      flagshipCluster, flagshipStatus, primaryValueChain, funder,
      investments, kpis, locations,
    });
  }

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Flagship Projects Management" />

      <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onBack={() => {
            if (currentStep === 0) navigate("/me/flagships", { viewTransition: true });
            else setCurrentStep((s) => s - 1);
          }}
          onNext={goNext}
          onSkip={() => setCurrentStep((s) => s + 1)}
          onSubmit={handleSubmit}
          stepHasValue={stepHasValue}
        >
          <Form className="w-full" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
            <Fieldset className="w-full border-none p-0">
              <FieldGroup className="grid gap-4 sm:grid-cols-10 w-full">
                {currentStep === 0 ? (
                  <>
                    {isUpdateMode ? (
                      <AppSelect
                        name="existingFlagship"
                        label="Select Flagship to Update"
                        placeholder="Choose flagship"
                        className="sm:col-span-5 w-full"
                        selectedKey={selectedFlagshipId}
                        onSelectionChange={setSelectedFlagshipId}
                        options={NO_DATA_OPTIONS}
                        isRequired
                      />
                    ) : (
                      <AppTextField
                        name="flagshipName"
                        label="Flagship Name"
                        placeholder="Full program name"
                        className="sm:col-span-5 w-full"
                        value={flagshipName}
                        onChange={setFlagshipName}
                        isRequired
                      />
                    )}
                    <AppTextField
                      name="flagshipCode"
                      label="Flagship Code"
                      placeholder="e.g., YEPA"
                      className="sm:col-span-5 w-full"
                      value={flagshipCode}
                      onChange={setFlagshipCode}
                      isRequired
                    />
                    <AppSelect
                      name="flagshipCluster"
                      label="Flagship Cluster"
                      placeholder="Select cluster"
                      className="sm:col-span-5 w-full"
                      selectedKey={flagshipCluster}
                      onSelectionChange={setFlagshipCluster}
                      options={NO_DATA_OPTIONS}
                      isRequired
                    />
                    <AppSelect
                      name="primaryValueChain"
                      label="Primary Value Chain"
                      placeholder="Select primary value chain"
                      className="sm:col-span-5 w-full"
                      selectedKey={primaryValueChain}
                      onSelectionChange={setPrimaryValueChain}
                      options={NO_DATA_OPTIONS}
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
                      label="Funders"
                      placeholder="Select funder"
                      className="sm:col-span-5 w-full"
                      selectedKey={funder}
                      onSelectionChange={setFunder}
                      options={NO_DATA_OPTIONS}
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
                      options={NO_DATA_OPTIONS}
                      isRequired
                    />
                    <AppTextField
                      name="implementingAgency"
                      label="Implementing Agency"
                      placeholder="Agency or partner name"
                      className="sm:col-span-5 w-full"
                      value={implementingAgency}
                      onChange={setImplementingAgency}
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
                      min={0}
                      step={1}
                    />
                    <AppTextField
                      name="budgetTotalRwf"
                      label="Budget Total (RWF)"
                      placeholder="0"
                      className="sm:col-span-5 w-full"
                      value={budgetTotalRwf}
                      onChange={setBudgetTotalRwf}
                      inputMode="decimal"
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
                      options={NO_DATA_OPTIONS}
                      isRequired
                    />
                    <AppSelect
                      name="investmentSourceType"
                      label="Source Type"
                      placeholder="Select source type"
                      className="sm:col-span-5 w-full"
                      selectedKey={investmentSourceType}
                      onSelectionChange={setInvestmentSourceType}
                      options={NO_DATA_OPTIONS}
                      isRequired
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
                      options={NO_DATA_OPTIONS}
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
                    <AppSelect
                      name="kpiIndicatorName"
                      label="KPI Indicator Name"
                      placeholder="Select approved KPI name"
                      className="sm:col-span-5 w-full"
                      selectedKey={kpiIndicatorName}
                      onSelectionChange={setKpiIndicatorName}
                      options={NO_DATA_OPTIONS}
                      isRequired
                    />
                    <AppSelect
                      name="kpiIndicatorTier"
                      label="Indicator Tier"
                      placeholder="Select indicator tier"
                      className="sm:col-span-5 w-full"
                      selectedKey={kpiIndicatorTier}
                      onSelectionChange={setKpiIndicatorTier}
                      options={NO_DATA_OPTIONS}
                      isRequired
                    />
                    <AppSelect
                      name="kpiValueType"
                      label="Indicator Value Type"
                      placeholder="Select value type"
                      className="sm:col-span-5 w-full"
                      selectedKey={kpiValueType}
                      onSelectionChange={setKpiValueType}
                      options={NO_DATA_OPTIONS}
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
                      options={NO_DATA_OPTIONS}
                      isRequired
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
                      options={NO_DATA_OPTIONS}
                      isRequired
                    />
                    <div className="sm:col-span-10 flex items-center justify-between rounded-lg border border-(--border) p-3">
                      <p className="text-sm text-(--foreground-600)">
                        Capture one or more KPI records for this flagship.
                      </p>
                      <Button type="button" variant="outline" onPress={addKpiEntry}>
                        Add KPI Entry
                      </Button>
                    </div>
                    {kpis.length > 0 ? (
                      <div className="sm:col-span-10 space-y-1 rounded-lg border border-(--border) p-3">
                        {kpis.map((entry, index) => (
                          <p key={`${entry}-${index}`} className="text-sm text-(--foreground-700)">
                            {index + 1}. {entry}
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
