import { useMemo, useRef, useState } from "react";
import { Button, Card, FieldGroup, Fieldset, Form } from "@heroui/react";
import { useNavigate } from "react-router";

import AppSelect, { NO_DATA_OPTIONS } from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";

const STEP_TITLES = ["Cooperative Details", "Cooperative-Flagship Link"];

const DEFAULT_LOCATION_VALUE: RwandaLocationValue = {
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
  const formRef = useRef<HTMLFormElement>(null);

  const [cooperativeName, setCooperativeName] = useState("");
  const [cooperativeCode, setCooperativeCode] = useState("");
  const [groupType, setGroupType] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [primaryValueChain, setPrimaryValueChain] = useState("");
  const [cluster, setCluster] = useState("");
  const [totalMembers, setTotalMembers] = useState("");
  const [femaleMembers, setFemaleMembers] = useState("");
  const [youthMembers, setYouthMembers] = useState("");
  const [location, setLocation] = useState<RwandaLocationValue>(DEFAULT_LOCATION_VALUE);

  const [flagshipId, setFlagshipId] = useState("");
  const [engagementType, setEngagementType] = useState("");
  const [engagementStartDate, setEngagementStartDate] = useState("");
  const [engagementEndDate, setEngagementEndDate] = useState("");

  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = useMemo(() => currentStep === STEP_TITLES.length - 1, [currentStep]);

  const handleNextStep = () => {
    const formEl = formRef.current;
    if (!formEl || !formEl.reportValidity()) return;
    setCurrentStep((step) => Math.min(step + 1, STEP_TITLES.length - 1));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    console.log("Cooperative form payload", { ...payload, location });
  };

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Cooperatives Management" />

      <div
        style={{ borderRadius: "8px" }}
        className="w-full max-w-full min-w-0 rounded-lg overflow-hidden bg-(--surface) border border-(--separator) px-6 py-4"
      >
        <div className="grid gap-2 sm:grid-cols-2">
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

                  <AppTextField
                    name="engagementStartDate"
                    label="Start Date"
                    type="date"
                    className="sm:col-span-5 w-full"
                    value={engagementStartDate}
                    onChange={setEngagementStartDate}
                  />

                  <AppTextField
                    name="engagementEndDate"
                    label="End Date"
                    type="date"
                    className="sm:col-span-5 w-full"
                    value={engagementEndDate}
                    onChange={setEngagementEndDate}
                  />
                </>
              ) : null}
            </FieldGroup>
          </Fieldset>

          <div className="flex flex-wrap justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onPress={() => navigate("/me/cooperatives")}>
              Save Draft
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
