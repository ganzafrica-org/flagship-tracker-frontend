import { useState } from "react";
import { FieldGroup, Fieldset, Form } from "@heroui/react";
import { useNavigate } from "react-router";
import type { DateValue } from "@internationalized/date";

import AppDate from "~/components/app-date";
import AppSelect, { NO_DATA_OPTIONS } from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { Stepper, type StepConfig } from "~/components/stepper";

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

export function meta() {
  return [{ title: "Add Cooperative | M&E" }];
}

export default function MeAddCooperativePage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

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

  const stepHasValue =
    currentStep === 0
      ? !!(cooperativeName || cooperativeCode || groupType || location.province)
      : !!(flagshipId || engagementType || engagementStartDate);

  function goNext() {
    setCurrentStep((s) => s + 1);
  }

  function handleSubmit() {
    console.log("Cooperative form submitted", {
      cooperativeName, cooperativeCode, groupType, registrationStatus,
      primaryValueChain, cluster, totalMembers, femaleMembers, youthMembers,
      location, flagshipId, engagementType, engagementStartDate, engagementEndDate,
    });
  }

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Cooperatives Management" />

      <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onBack={() => {
            if (currentStep === 0) navigate("/me/cooperatives", { viewTransition: true });
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
                      options={NO_DATA_OPTIONS}
                      isRequired
                    />
                    <AppSelect
                      name="registrationStatus"
                      label="Registration Status"
                      placeholder="Select registration status"
                      className="sm:col-span-5 w-full"
                      selectedKey={registrationStatus}
                      onSelectionChange={setRegistrationStatus}
                      options={NO_DATA_OPTIONS}
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
                    <AppSelect
                      name="cluster"
                      label="Cluster"
                      placeholder="Select cluster"
                      className="sm:col-span-5 w-full"
                      selectedKey={cluster}
                      onSelectionChange={setCluster}
                      options={NO_DATA_OPTIONS}
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
                      options={NO_DATA_OPTIONS}
                      isRequired
                    />
                    <AppSelect
                      name="engagementType"
                      label="Engagement Type"
                      placeholder="Select engagement type"
                      className="sm:col-span-5 w-full"
                      selectedKey={engagementType}
                      onSelectionChange={setEngagementType}
                      options={NO_DATA_OPTIONS}
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
