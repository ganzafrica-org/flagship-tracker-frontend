import { useMemo, useRef, useState } from "react";
import { Button, Card, FieldGroup, Fieldset, Form } from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router";

import AppSelect, { NO_DATA_OPTIONS } from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import AppTextarea from "~/components/app-textarea";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";

const STEP_TITLES = ["Basic Flagship Details", "Investment", "KPIs", "Location"];

const DEFAULT_LOCATION_VALUE: RwandaLocationValue = {
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
  const formRef = useRef<HTMLFormElement>(null);
  const isUpdateMode = searchParams.get("mode") === "update";

  const [selectedFlagshipId, setSelectedFlagshipId] = useState("");
  const [flagshipName, setFlagshipName] = useState("");
  const [flagshipCode, setFlagshipCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [implementingAgency, setImplementingAgency] = useState("");
  const [managementModel, setManagementModel] = useState("");
  const [targetYouthCount, setTargetYouthCount] = useState("");
  const [budgetTotalRwf, setBudgetTotalRwf] = useState("");
  const [flagshipCluster, setFlagshipCluster] = useState("");
  const [flagshipStatus, setFlagshipStatus] = useState("");
  const [primaryValueChain, setPrimaryValueChain] = useState("");
  const [funder, setFunder] = useState("");

  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentCurrency, setInvestmentCurrency] = useState("");
  const [investmentSourceType, setInvestmentSourceType] = useState("");
  const [investorName, setInvestorName] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [investmentYear, setInvestmentYear] = useState("");
  const [investmentDisbursementType, setInvestmentDisbursementType] = useState("");
  const [investmentNotes, setInvestmentNotes] = useState("");

  const [kpiIndicatorName, setKpiIndicatorName] = useState("");
  const [kpiIndicatorTier, setKpiIndicatorTier] = useState("");
  const [kpiValueType, setKpiValueType] = useState("");
  const [kpiBaselineValue, setKpiBaselineValue] = useState("");
  const [kpiTargetValue, setKpiTargetValue] = useState("");
  const [kpiActualValue, setKpiActualValue] = useState("");
  const [kpiReportingPeriod, setKpiReportingPeriod] = useState("");
  const [kpiMeasurementPoint, setKpiMeasurementPoint] = useState("");
  const [kpiYear, setKpiYear] = useState("");

  const [location, setLocation] = useState<RwandaLocationValue>(DEFAULT_LOCATION_VALUE);
  const [locationLabel, setLocationLabel] = useState("");

  const [investments, setInvestments] = useState<string[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = useMemo(() => currentStep === STEP_TITLES.length - 1, [currentStep]);

  const handleNextStep = () => {
    const formEl = formRef.current;
    if (!formEl || !formEl.reportValidity()) return;
    setCurrentStep((step) => Math.min(step + 1, STEP_TITLES.length - 1));
  };

  const addInvestmentEntry = () => {
    if (!investmentAmount || !investmentCurrency || !investmentSourceType || !investmentYear) return;
    const entry = `${investmentYear}: ${investmentAmount} ${investmentCurrency} (${investmentSourceType})`;
    setInvestments((prev) => [...prev, entry]);
  };

  const addKpiEntry = () => {
    if (!kpiIndicatorName || !kpiIndicatorTier || !kpiMeasurementPoint || !kpiYear || !kpiReportingPeriod) return;
    const entry = `${kpiIndicatorName} - ${kpiYear} ${kpiReportingPeriod} (point ${kpiMeasurementPoint})`;
    setKpis((prev) => [...prev, entry]);
  };

  const addLocationEntry = () => {
    if (!location.province || !location.district) return;
    const entry = [location.province, location.district, location.sector, locationLabel]
      .filter(Boolean)
      .join(" / ");
    setLocations((prev) => [...prev, entry]);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    console.log("Flagship form payload", { ...payload, investments, kpis, locations, location });
  };

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Flagship Projects Management" />

      <div
        style={{ borderRadius: "8px" }}
        className="w-full max-w-full min-w-0 rounded-lg overflow-hidden bg-(--surface) border border-(--separator) px-6 py-4"
      >
        <div className="grid gap-2 sm:grid-cols-4">
          {STEP_TITLES.map((title, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <button
                key={title}
                type="button"
                className={`rounded-lg border px-3 py-1.5 text-left transition ${
                  isActive
                    ? "border-(--primary) bg-(--primary-50)"
                    : isCompleted
                      ? "border-(--primary-200) bg-(--primary-100)"
                      : "border-(--border) bg-white"
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <p className="text-[11px] font-semibold text-(--foreground-500)">Step {index + 1}</p>
                <p className="text-xs font-medium text-(--foreground)">{title}</p>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="p-5">
        <Form ref={formRef} onSubmit={handleSubmit}>
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

                  <AppTextField
                    name="startDate"
                    label="Start Date"
                    type="date"
                    className="sm:col-span-5 w-full"
                    value={startDate}
                    onChange={setStartDate}
                  />

                  <AppTextField
                    name="endDate"
                    label="End Date"
                    type="date"
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

                  <AppTextField
                    name="investmentDate"
                    label="Investment Date"
                    type="date"
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

          <div className="flex flex-wrap justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onPress={() => navigate("/me/flagships")}>
              Save the Draft
            </Button>
            {currentStep > 0 ? (
              <Button type="button" variant="outline" onPress={() => setCurrentStep((step) => step - 1)}>
                Previous
              </Button>
            ) : null}
            {isLastStep ? (
              <Button type="submit" variant="primary">
                Submit
              </Button>
            ) : (
              <Button type="button" variant="primary" onPress={handleNextStep}>
                Continue
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
