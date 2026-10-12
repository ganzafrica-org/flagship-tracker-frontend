import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  FieldGroup,
  Fieldset,
  Form,
  Modal,
  Checkbox,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { IconCheck, IconPlus, IconTrash } from "@tabler/icons-react";

import { PageTitleCard } from "~/components/page-title-card";
import AppDate from "~/components/app-date";
import AppSelect from "~/components/app-select";
import AppTextField from "~/components/app-text-field";
import AppTextarea from "~/components/app-textarea";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { Stepper, type StepConfig } from "~/components/stepper";
import { ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import {
  createIndividual,
  individualQueryOptions,
  individualsQueryOptions,
  updateIndividual,
  type IndividualCooperativeRelation,
  type IndividualFlagshipRelation,
  type UpdateIndividualRequest,
} from "~/lib/queries/individuals";
import { useIndividualsFormLookups } from "~/lib/queries/lookups";
import { useFlagshipSelectOptions } from "~/lib/queries/flagships";

// ─── Constants ────────────────────────────────────────────────────────────────

const SEX_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const YOUTH_CATEGORY_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "graduate", label: "Graduate" },
  { value: "neet", label: "NEET" },
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "other", label: "Other" },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: "none", label: "None" },
  { value: "primary", label: "Primary" },
  { value: "lower_secondary", label: "Lower Secondary" },
  { value: "upper_secondary", label: "Upper Secondary" },
  { value: "tvet", label: "TVET" },
  { value: "university", label: "University" },
  { value: "other", label: "Other" },
];

const REGISTRATION_SOURCE_OPTIONS = [
  { value: "flagship", label: "Flagship" },
  { value: "walk-in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "survey", label: "Survey" },
];

const PARTICIPATION_TYPE_OPTIONS = [
  { value: "beneficiary", label: "Beneficiary" },
  { value: "wage_worker", label: "Wage Worker" },
  { value: "cooperative_member", label: "Cooperative Member" },
  { value: "service_recipient", label: "Service Recipient" },
];

const COOPERATIVE_ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "chairperson", label: "Chairperson" },
  { value: "other", label: "Other" },
];

const VALUE_CHAIN_STAGE_OPTIONS = [
  { value: "input_supply", label: "Input Supply" },
  { value: "production", label: "Production" },
  { value: "aggregation", label: "Aggregation" },
  { value: "processing", label: "Processing" },
  { value: "distribution", label: "Distribution" },
  { value: "retail", label: "Retail" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "seasonal", label: "Seasonal" },
  { value: "casual", label: "Casual" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "wage_employed", label: "Wage Employed" },
  { value: "self_employed", label: "Self Employed" },
  { value: "unpaid_family", label: "Unpaid Family" },
  { value: "other", label: "Other" },
];

const EMPLOYER_TYPE_OPTIONS = [
  { value: "farm", label: "Farm" },
  { value: "cooperative", label: "Cooperative" },
  { value: "agro_processor", label: "Agro Processor" },
  { value: "input_supplier", label: "Input Supplier" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
];

const INCOME_RANGE_OPTIONS = [
  { value: "below_50k", label: "Below 50,000 RWF" },
  { value: "50k_100k", label: "50,000 – 100,000 RWF" },
  { value: "100k_200k", label: "100,000 – 200,000 RWF" },
  { value: "200k_300k", label: "200,000 – 300,000 RWF" },
  { value: "above_300k", label: "Above 300,000 RWF" },
];

const LAND_USE_TYPE_OPTIONS = [
  { value: "crops", label: "Crops" },
  { value: "livestock", label: "Livestock" },
  { value: "mixed", label: "Mixed" },
  { value: "fallow", label: "Fallow" },
  { value: "other", label: "Other" },
];

const OWNERSHIP_STATUS_OPTIONS = [
  { value: "owned", label: "Owned" },
  { value: "rented", label: "Rented" },
  { value: "cooperative", label: "Cooperative" },
  { value: "family", label: "Family" },
  { value: "leased", label: "Leased" },
  { value: "other", label: "Other" },
];

const SEASON_OPTIONS = [
  { value: "Season A", label: "Season A" },
  { value: "Season B", label: "Season B" },
  { value: "Season C", label: "Season C" },
  { value: "off_season", label: "Off Season" },
];

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "litre", label: "Litre" },
  { value: "unit", label: "Unit" },
  { value: "tonne", label: "Tonne" },
  { value: "other", label: "Other" },
];

const MARKET_CHANNEL_OPTIONS = [
  { value: "local_market", label: "Local Market" },
  { value: "cooperative", label: "Cooperative" },
  { value: "trader", label: "Trader" },
  { value: "exporter", label: "Exporter" },
  { value: "processor", label: "Processor" },
  { value: "direct_consumer", label: "Direct Consumer" },
  { value: "other", label: "Other" },
];

const INTERVENTION_TYPE_OPTIONS = [
  { value: "training", label: "Training" },
  { value: "input_supply", label: "Input Supply" },
  { value: "equipment", label: "Equipment" },
  { value: "financial_service", label: "Financial Service" },
  { value: "mentorship", label: "Mentorship" },
  { value: "market_linkage", label: "Market Linkage" },
  { value: "other", label: "Other" },
];

const CONSTRAINT_TYPE_OPTIONS = [
  { value: "input_shortage", label: "Input Shortage" },
  { value: "financing", label: "Financing" },
  { value: "market_access", label: "Market Access" },
  { value: "training_gap", label: "Training Gap" },
  { value: "land_constraint", label: "Land Constraint" },
  { value: "climate", label: "Climate" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "other", label: "Other" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const INDIVIDUAL_MODAL_DIALOG_CLASS = "w-full sm:max-w-3xl max-h-[85vh] overflow-y-auto";

function pickOptions<T extends { value: string; label: string }>(
  apiOptions: T[],
  fallbackOptions: T[],
): T[] {
  return apiOptions.length > 0 ? apiOptions : fallbackOptions;
}

function parseOptionalNumber(value: string): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalInt(value: string): number | undefined {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parsePositiveInt(value: string): number | undefined {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function dateValueToIso(value: DateValue | null): string | undefined {
  return value ? value.toString() : undefined;
}

function isoToDateValue(iso: string | null | undefined): DateValue | null {
  if (!iso) return null;
  return parseDate(iso.slice(0, 10));
}

function flagshipRelationToEntry(relation: IndividualFlagshipRelation): FlagshipEntry {
  return {
    id: crypto.randomUUID(),
    flagshipId: String(relation.flagshipId),
    participationType: relation.participationType ?? "",
    startDate: isoToDateValue(relation.startDate),
    endDate: isoToDateValue(relation.endDate),
    notes: relation.notes ?? "",
  };
}

function cooperativeRelationToEntry(relation: IndividualCooperativeRelation): CooperativeEntry {
  return {
    id: crypto.randomUUID(),
    cooperativeId: String(relation.cooperativeId),
    role: relation.role ?? "",
    joinDate: isoToDateValue(relation.joinDate),
    endDate: isoToDateValue(relation.endDate),
  };
}

function buildFlagshipsPayload(entries: FlagshipEntry[]): IndividualFlagshipRelation[] {
  return entries.flatMap((entry) => {
    const flagshipId = parsePositiveInt(entry.flagshipId);
    if (flagshipId == null) return [];
    return [{
      flagshipId,
      participationType: entry.participationType || undefined,
      startDate: dateValueToIso(entry.startDate),
      endDate: dateValueToIso(entry.endDate),
      active: true,
      notes: entry.notes || undefined,
    }];
  });
}

function buildCooperativesPayload(entries: CooperativeEntry[]): IndividualCooperativeRelation[] {
  return entries.flatMap((entry) => {
    const cooperativeId = parsePositiveInt(entry.cooperativeId);
    if (cooperativeId == null) return [];
    return [{
      cooperativeId,
      role: entry.role || undefined,
      joinDate: dateValueToIso(entry.joinDate),
      endDate: dateValueToIso(entry.endDate),
      active: true,
    }];
  });
}

function yearFromDateValue(value: DateValue | null): number | undefined {
  if (!value) return undefined;
  return parseOptionalInt(value.toString().slice(0, 4));
}

function buildRelationsPayload(
  basic: BasicInfoFields,
  entries: {
    flagshipEntries: FlagshipEntry[];
    cooperativeEntries: CooperativeEntry[];
    valueChainEntries: ValueChainEntry[];
    employmentEntries: EmploymentEntry[];
    landEntries: LandEntry[];
    productionEntries: ProductionEntry[];
    interventionEntries: InterventionEntry[];
    constraintEntries: ConstraintEntry[];
  },
): UpdateIndividualRequest {
  const fallbackLocation = basic.location;

  return {
    flagships: buildFlagshipsPayload(entries.flagshipEntries),
    cooperatives: buildCooperativesPayload(entries.cooperativeEntries),
    valueChains: entries.valueChainEntries.map((entry) => ({
      cluster: entry.cluster,
      valueChain: entry.valueChain,
      valueChainStage: entry.valueChainStage || undefined,
      primary: entry.isPrimary,
      details: entry.details || undefined,
      year: parseOptionalInt(entry.year),
    })),
    employments: entries.employmentEntries.map((entry) => ({
      flagshipId: parsePositiveInt(entry.flagshipId),
      cooperativeId: parsePositiveInt(entry.cooperativeId),
      employmentType: entry.employmentType || undefined,
      employmentStatus: entry.employmentStatus || undefined,
      employerName: entry.employerName || undefined,
      employerType: entry.employerType || undefined,
      jobTitle: entry.jobTitle || undefined,
      incomeRangeRwf: entry.incomeRange || undefined,
      primaryJob: entry.isPrimaryJob,
      startDate: dateValueToIso(entry.startDate),
      endDate: dateValueToIso(entry.endDate),
    })),
    landAccess: entries.landEntries.map((entry) => ({
      landSizeHa: parseOptionalNumber(entry.landSizeHa),
      landUseType: entry.landUseType,
      ownershipStatus: entry.ownershipStatus,
      province: entry.province || fallbackLocation.province,
      district: entry.district || fallbackLocation.district,
      sector: entry.sector || fallbackLocation.sector,
      hasLandTitle: entry.hasLandTitle ? entry.hasLandTitle === "true" : undefined,
      year: parseOptionalInt(entry.year),
    })),
    productionRecords: entries.productionEntries.map((entry) => ({
      flagshipId: parsePositiveInt(entry.flagshipId),
      cooperativeId: parsePositiveInt(entry.cooperativeId),
      product: entry.product,
      valueChain: entry.valueChain || undefined,
      season: entry.season || undefined,
      year: parseOptionalInt(entry.year),
      quantityProduced: parseOptionalNumber(entry.quantityProduced),
      quantitySold: parseOptionalNumber(entry.quantitySold),
      unit: entry.unit || undefined,
      revenueRwf: parseOptionalNumber(entry.revenueRwf),
      marketChannel: entry.marketChannel || undefined,
      notes: entry.notes || undefined,
    })),
    interventions: entries.interventionEntries.map((entry) => ({
      flagshipId: parsePositiveInt(entry.flagshipId),
      cooperativeId: parsePositiveInt(entry.cooperativeId),
      interventionType: entry.interventionType,
      description: entry.description || undefined,
      deliveryDate: dateValueToIso(entry.deliveryDate),
      year: yearFromDateValue(entry.deliveryDate) ?? new Date().getFullYear(),
      valueRwf: parseOptionalNumber(entry.valueRwf),
      deliveryLocation: entry.deliveryLocation || undefined,
      notes: entry.notes || undefined,
    })),
    constraintFeedback: entries.constraintEntries.flatMap((entry) => {
      const flagshipId = parsePositiveInt(entry.flagshipId);
      if (flagshipId == null) return [];
      return [{
        flagshipId,
        cooperativeId: parsePositiveInt(entry.cooperativeId),
        constraintType: entry.constraintType || undefined,
        severity: entry.severity || undefined,
        description: entry.description || undefined,
        reportedDate: dateValueToIso(entry.reportedDate),
        year: yearFromDateValue(entry.reportedDate) ?? new Date().getFullYear(),
        location: entry.location || undefined,
      }];
    }),
  };
}

const STEPS: StepConfig[] = [
  { id: "basic-info", label: "Basic Information" },
  { id: "flagship-info", label: "Flagship Information", optional: true },
  { id: "cooperative-info", label: "Cooperative Information", optional: true },
  { id: "value-chain", label: "Value Chain", optional: true },
  { id: "employment", label: "Employment", optional: true },
  { id: "land-access", label: "Land Access", optional: true },
  { id: "production", label: "Production Record", optional: true },
  { id: "intervention", label: "Intervention", optional: true },
  { id: "constraint", label: "Constraint Feedback", optional: true },
];

const DEFAULT_LOCATION: RwandaLocationValue = {
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface BasicInfoFields {
  nationalId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  sex: string;
  dateOfBirth: DateValue | null;
  youthCategory: string;
  educationLevel: string;
  disabilityStatus: string;
  registrationSource: string;
  location: RwandaLocationValue;
  latitude: string;
  longitude: string;
}

interface FlagshipEntry {
  id: string;
  flagshipId: string;
  participationType: string;
  startDate: DateValue | null;
  endDate: DateValue | null;
  notes: string;
}

interface CooperativeEntry {
  id: string;
  cooperativeId: string;
  role: string;
  joinDate: DateValue | null;
  endDate: DateValue | null;
}

interface ValueChainEntry {
  id: string;
  cluster: string;
  valueChain: string;
  valueChainStage: string;
  isPrimary: boolean;
  details: string;
  year: string;
}

interface EmploymentEntry {
  id: string;
  flagshipId: string;
  cooperativeId: string;
  employmentType: string;
  employmentStatus: string;
  employerName: string;
  employerType: string;
  jobTitle: string;
  incomeRange: string;
  isPrimaryJob: boolean;
  startDate: DateValue | null;
  endDate: DateValue | null;
}

interface LandEntry {
  id: string;
  landSizeHa: string;
  landUseType: string;
  ownershipStatus: string;
  province: string;
  district: string;
  sector: string;
  hasLandTitle: string;
  year: string;
}

interface ProductionEntry {
  id: string;
  flagshipId: string;
  cooperativeId: string;
  product: string;
  valueChain: string;
  season: string;
  year: string;
  quantityProduced: string;
  quantitySold: string;
  unit: string;
  revenueRwf: string;
  marketChannel: string;
  notes: string;
}

interface InterventionEntry {
  id: string;
  flagshipId: string;
  cooperativeId: string;
  interventionType: string;
  description: string;
  deliveryDate: DateValue | null;
  valueRwf: string;
  deliveryLocation: string;
  notes: string;
}

interface ConstraintEntry {
  id: string;
  flagshipId: string;
  cooperativeId: string;
  constraintType: string;
  severity: string;
  description: string;
  reportedDate: DateValue | null;
  location: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface BasicInfoErrors {
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  registrationSource?: string;
  province?: string;
}

interface FlagshipEntryErrors { flagshipId?: string; }
interface CooperativeEntryErrors { cooperativeId?: string; }
interface ValueChainEntryErrors { cluster?: string; valueChain?: string; valueChainStage?: string; }
interface EmploymentEntryErrors { employmentType?: string; employmentStatus?: string; }
interface LandEntryErrors { landUseType?: string; ownershipStatus?: string; }
interface ProductionEntryErrors { product?: string; year?: string; }
interface InterventionEntryErrors { interventionType?: string; }
interface ConstraintEntryErrors { flagshipId?: string; constraintType?: string; }

function validateBasicInfo(f: BasicInfoFields): BasicInfoErrors {
  const e: BasicInfoErrors = {};
  if (!f.phoneNumber.trim()) e.phoneNumber = "Phone number is required";
  if (!f.firstName.trim()) e.firstName = "First name is required";
  if (!f.lastName.trim()) e.lastName = "Last name is required";
  if (!f.sex) e.sex = "Sex is required";
  if (!f.registrationSource) e.registrationSource = "Registration source is required";
  if (!f.location.province) e.province = "Province is required";
  if (f.location.province && !f.location.district) e.province = "District is required";
  if (f.location.district && !f.location.sector) e.province = "Sector is required";
  return e;
}

function validateFlagshipEntry(e: FlagshipEntry): FlagshipEntryErrors {
  const errs: FlagshipEntryErrors = {};
  if (!e.flagshipId) errs.flagshipId = "Flagship is required";
  return errs;
}

function validateCooperativeEntry(e: CooperativeEntry): CooperativeEntryErrors {
  const errs: CooperativeEntryErrors = {};
  if (!e.cooperativeId) errs.cooperativeId = "Cooperative is required";
  return errs;
}

function validateValueChainEntry(e: ValueChainEntry): ValueChainEntryErrors {
  const errs: ValueChainEntryErrors = {};
  if (!e.cluster.trim()) errs.cluster = "Cluster is required";
  if (!e.valueChain.trim()) errs.valueChain = "Value chain is required";
  if (!e.valueChainStage) errs.valueChainStage = "Stage is required";
  return errs;
}

function validateEmploymentEntry(e: EmploymentEntry): EmploymentEntryErrors {
  const errs: EmploymentEntryErrors = {};
  if (!e.employmentType) errs.employmentType = "Employment type is required";
  if (!e.employmentStatus) errs.employmentStatus = "Employment status is required";
  return errs;
}

function validateLandEntry(e: LandEntry): LandEntryErrors {
  const errs: LandEntryErrors = {};
  if (!e.landUseType) errs.landUseType = "Land use type is required";
  if (!e.ownershipStatus) errs.ownershipStatus = "Ownership status is required";
  return errs;
}

function validateProductionEntry(e: ProductionEntry): ProductionEntryErrors {
  const errs: ProductionEntryErrors = {};
  if (!e.product.trim()) errs.product = "Product is required";
  if (!e.year.trim()) errs.year = "Year is required";
  return errs;
}

function validateInterventionEntry(e: InterventionEntry): InterventionEntryErrors {
  const errs: InterventionEntryErrors = {};
  if (!e.interventionType) errs.interventionType = "Intervention type is required";
  return errs;
}

function validateConstraintEntry(e: ConstraintEntry): ConstraintEntryErrors {
  const errs: ConstraintEntryErrors = {};
  if (!e.flagshipId) errs.flagshipId = "Flagship is required";
  if (!e.constraintType) errs.constraintType = "Constraint type is required";
  return errs;
}

function hasAnyBasicValue(f: BasicInfoFields): boolean {
  return !!(
    f.nationalId || f.phoneNumber || f.firstName || f.lastName || f.sex ||
    f.dateOfBirth || f.youthCategory || f.educationLevel || f.disabilityStatus ||
    f.registrationSource || f.location.province || f.latitude || f.longitude
  );
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ title, subtitle, onRemove }: { title: string; subtitle?: string; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-(--border) bg-(--surface)">
      <div>
        <p className="text-sm font-medium text-(--foreground)">{title}</p>
        {subtitle && <p className="text-xs text-(--muted-foreground) mt-0.5">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-(--muted-foreground) hover:text-red-500 transition-colors p-1 shrink-0"
        aria-label="Remove entry"
      >
        <IconTrash size={15} />
      </button>
    </div>
  );
}

// ─── Step 2: Flagship entries ─────────────────────────────────────────────────

function FlagshipStep({ entries, onAdd, onRemove }: { entries: FlagshipEntry[]; onAdd: (e: FlagshipEntry) => void; onRemove: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<FlagshipEntry>({ id: "", flagshipId: "", participationType: "", startDate: null, endDate: null, notes: "" });
  const [errors, setErrors] = useState<FlagshipEntryErrors>({});

  const { options: flagshipOptions } = useFlagshipSelectOptions();
  const { participationTypeOptions } = useIndividualsFormLookups();

  function openModal() {
    setDraft({ id: crypto.randomUUID(), flagshipId: "", participationType: "", startDate: null, endDate: null, notes: "" });
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const errs = validateFlagshipEntry(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (entries.some((e) => e.flagshipId === draft.flagshipId)) {
      setErrors({ flagshipId: "This flagship is already added" });
      return;
    }
    onAdd(draft);
    setModalOpen(false);
  }

  const flagshipLabel = (id: string) => flagshipOptions.find((f) => f.value === id)?.label ?? id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--foreground)">Flagship Participation</h2>
        <Button variant="outline" onPress={openModal} className="!rounded-3xl gap-1.5">
          <IconPlus size={15} />
          Add Flagship
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="py-10 text-center text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">
          No flagship entries yet. Click "Add Flagship" to add one.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              title={flagshipLabel(e.flagshipId)}
              subtitle={pickOptions(participationTypeOptions, PARTICIPATION_TYPE_OPTIONS).find((p) => p.value === e.participationType)?.label}
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}

      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
          <Modal.Dialog className={INDIVIDUAL_MODAL_DIALOG_CLASS}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Add Flagship Participation</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <AppSelect
                name="flagshipId"
                label="Flagship *"
                placeholder="Select flagship"
                options={flagshipOptions}
                selectedKey={draft.flagshipId}
                onSelectionChange={(v) => { setDraft((d) => ({ ...d, flagshipId: v })); setErrors((e) => ({ ...e, flagshipId: undefined })); }}
                errorMessage={errors.flagshipId}
                isRequired
              />
              <AppSelect
                name="participationType"
                label="Participation Type"
                placeholder="Select type"
                options={pickOptions(participationTypeOptions, PARTICIPATION_TYPE_OPTIONS)}
                selectedKey={draft.participationType}
                onSelectionChange={(v) => setDraft((d) => ({ ...d, participationType: v }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <AppDate
                  name="startDate"
                  label="Start Date"
                  value={draft.startDate}
                  onChange={(v) => setDraft((d) => ({ ...d, startDate: v }))}
                />
                <AppDate
                  name="endDate"
                  label="End Date"
                  value={draft.endDate}
                  onChange={(v) => setDraft((d) => ({ ...d, endDate: v }))}
                />
              </div>
              <AppTextarea
                name="notes"
                label="Notes"
                placeholder="Additional context..."
                value={draft.notes}
                onChange={(v) => setDraft((d) => ({ ...d, notes: v }))}
                rows={3}
              />
            </Modal.Body>
            <Modal.Footer className="gap-3">
              <Button variant="outline" slot="close" className="!rounded-3xl">Cancel</Button>
              <Button variant="primary" onPress={handleSave} className="!rounded-3xl">Add</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

// ─── Step 3: Cooperative entries ──────────────────────────────────────────────

function CooperativeStep({ entries, onAdd, onRemove }: { entries: CooperativeEntry[]; onAdd: (e: CooperativeEntry) => void; onRemove: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<CooperativeEntry>({ id: "", cooperativeId: "", role: "", joinDate: null, endDate: null });
  const [errors, setErrors] = useState<CooperativeEntryErrors>({});
  const { cooperativeOptions, cooperativeRoleOptions } = useIndividualsFormLookups();

  function openModal() {
    setDraft({ id: crypto.randomUUID(), cooperativeId: "", role: "", joinDate: null, endDate: null });
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const errs = validateCooperativeEntry(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (entries.some((e) => e.cooperativeId === draft.cooperativeId)) {
      setErrors({ cooperativeId: "This cooperative is already added" });
      return;
    }
    onAdd(draft);
    setModalOpen(false);
  }

  const coopLabel = (id: string) =>
    cooperativeOptions.find((c) => c.value === id)?.label ?? id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--foreground)">Cooperative Membership</h2>
        <Button variant="outline" onPress={openModal} className="!rounded-3xl gap-1.5">
          <IconPlus size={15} />
          Add Cooperative
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="py-10 text-center text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">
          No cooperative entries yet. Click "Add Cooperative" to add one.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              title={coopLabel(e.cooperativeId)}
              subtitle={pickOptions(cooperativeRoleOptions, COOPERATIVE_ROLE_OPTIONS).find((r) => r.value === e.role)?.label}
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}

      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
          <Modal.Dialog className={INDIVIDUAL_MODAL_DIALOG_CLASS}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Add Cooperative Membership</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <AppSelect
                name="cooperativeId"
                label="Cooperative *"
                placeholder="Select cooperative"
                options={cooperativeOptions}
                selectedKey={draft.cooperativeId}
                onSelectionChange={(v) => { setDraft((d) => ({ ...d, cooperativeId: v })); setErrors((e) => ({ ...e, cooperativeId: undefined })); }}
                errorMessage={errors.cooperativeId}
                isRequired
              />
              <AppSelect
                name="role"
                label="Role"
                placeholder="Select role"
                options={pickOptions(cooperativeRoleOptions, COOPERATIVE_ROLE_OPTIONS)}
                selectedKey={draft.role}
                onSelectionChange={(v) => setDraft((d) => ({ ...d, role: v }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <AppDate
                  name="joinDate"
                  label="Join Date"
                  value={draft.joinDate}
                  onChange={(v) => setDraft((d) => ({ ...d, joinDate: v }))}
                />
                <AppDate
                  name="endDate"
                  label="End Date"
                  value={draft.endDate}
                  onChange={(v) => setDraft((d) => ({ ...d, endDate: v }))}
                />
              </div>
            </Modal.Body>
            <Modal.Footer className="gap-3">
              <Button variant="outline" slot="close" className="!rounded-3xl">Cancel</Button>
              <Button variant="primary" onPress={handleSave} className="!rounded-3xl">Add</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

// ─── Step 4: Value chain entries ──────────────────────────────────────────────

function ValueChainStep({ entries, onAdd, onRemove }: { entries: ValueChainEntry[]; onAdd: (e: ValueChainEntry) => void; onRemove: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<ValueChainEntry>({ id: "", cluster: "", valueChain: "", valueChainStage: "", isPrimary: false, details: "", year: "" });
  const [errors, setErrors] = useState<ValueChainEntryErrors>({});
  const { valueChainStageOptions, valueChainOptions } = useIndividualsFormLookups();

  function openModal() {
    setDraft({ id: crypto.randomUUID(), cluster: "", valueChain: "", valueChainStage: "", isPrimary: false, details: "", year: "" });
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const errs = validateValueChainEntry(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onAdd(draft);
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--foreground)">Value Chain Involvement</h2>
        <Button variant="outline" onPress={openModal} className="!rounded-3xl gap-1.5">
          <IconPlus size={15} />
          Add Value Chain
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="py-10 text-center text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">
          No value chain entries yet. Click "Add Value Chain" to add one.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              title={`${e.cluster} — ${e.valueChain}`}
              subtitle={
                [
                  pickOptions(valueChainStageOptions, VALUE_CHAIN_STAGE_OPTIONS).find((s) => s.value === e.valueChainStage)?.label,
                  e.isPrimary ? "Primary" : null,
                  e.year ? `Year: ${e.year}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}

      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
          <Modal.Dialog className={INDIVIDUAL_MODAL_DIALOG_CLASS}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Add Value Chain Entry</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <AppTextField
                  name="cluster"
                  label="Cluster *"
                  placeholder="e.g. livestock, horticulture"
                  value={draft.cluster}
                  onChange={(v) => { setDraft((d) => ({ ...d, cluster: v })); setErrors((er) => ({ ...er, cluster: undefined })); }}
                  errorMessage={errors.cluster}
                  isRequired
                />
                <AppSelect
                  name="valueChain"
                  label="Value Chain *"
                  placeholder="Select value chain"
                  options={valueChainOptions}
                  selectedKey={draft.valueChain}
                  onSelectionChange={(v) => { setDraft((d) => ({ ...d, valueChain: v })); setErrors((er) => ({ ...er, valueChain: undefined })); }}
                  errorMessage={errors.valueChain}
                  isRequired
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppSelect
                  name="valueChainStage"
                  label="Stage *"
                  placeholder="Select stage"
                  options={pickOptions(valueChainStageOptions, VALUE_CHAIN_STAGE_OPTIONS)}
                  selectedKey={draft.valueChainStage}
                  onSelectionChange={(v) => { setDraft((d) => ({ ...d, valueChainStage: v })); setErrors((er) => ({ ...er, valueChainStage: undefined })); }}
                  errorMessage={errors.valueChainStage}
                  isRequired
                />
                <AppTextField
                  name="year"
                  label="Year"
                  placeholder="e.g. 2024"
                  type="number"
                  value={draft.year}
                  onChange={(v) => setDraft((d) => ({ ...d, year: v }))}
                />
              </div>
              <AppTextarea
                name="details"
                label="Details"
                placeholder="Additional context or notes..."
                value={draft.details}
                onChange={(v) => setDraft((d) => ({ ...d, details: v }))}
                rows={3}
              />
              <Checkbox isSelected={draft.isPrimary} onChange={(v) => setDraft((d) => ({ ...d, isPrimary: v }))}>
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                <Checkbox.Content>
                  <span className="text-sm">This is the individual's primary value chain activity</span>
                </Checkbox.Content>
              </Checkbox>
            </Modal.Body>
            <Modal.Footer className="gap-3">
              <Button variant="outline" slot="close" className="!rounded-3xl">Cancel</Button>
              <Button variant="primary" onPress={handleSave} className="!rounded-3xl">Add</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

// ─── Step 5: Employment ───────────────────────────────────────────────────────

function EmploymentStep({ entries, onAdd, onRemove }: { entries: EmploymentEntry[]; onAdd: (e: EmploymentEntry) => void; onRemove: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<EmploymentEntry>({ id: "", flagshipId: "", cooperativeId: "", employmentType: "", employmentStatus: "", employerName: "", employerType: "", jobTitle: "", incomeRange: "", isPrimaryJob: false, startDate: null, endDate: null });
  const [errors, setErrors] = useState<EmploymentEntryErrors>({});
  const { options: flagshipOptions } = useFlagshipSelectOptions();
  const {
    employmentTypeOptions,
    employmentStatusOptions,
    employerTypeOptions,
    incomeRangeOptions,
    cooperativeOptions,
  } = useIndividualsFormLookups();

  function openModal() {
    setDraft({ id: crypto.randomUUID(), flagshipId: "", cooperativeId: "", employmentType: "", employmentStatus: "", employerName: "", employerType: "", jobTitle: "", incomeRange: "", isPrimaryJob: false, startDate: null, endDate: null });
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const errs = validateEmploymentEntry(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onAdd(draft);
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--foreground)">Employment</h2>
        <Button variant="outline" onPress={openModal} className="!rounded-3xl gap-1.5"><IconPlus size={15} />Add Employment</Button>
      </div>
      {entries.length === 0 ? (
        <div className="py-10 text-center text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">No employment entries yet. Click "Add Employment" to add one.</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <EntryCard key={e.id}
              title={e.jobTitle || pickOptions(employmentTypeOptions, EMPLOYMENT_TYPE_OPTIONS).find((o) => o.value === e.employmentType)?.label || "Employment entry"}
              subtitle={[pickOptions(employmentStatusOptions, EMPLOYMENT_STATUS_OPTIONS).find((o) => o.value === e.employmentStatus)?.label, e.employerName].filter(Boolean).join(" · ")}
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}
      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
          <Modal.Dialog className={INDIVIDUAL_MODAL_DIALOG_CLASS}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Add Employment Record</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <AppSelect name="employmentType" label="Employment Type *" placeholder="Select type" options={pickOptions(employmentTypeOptions, EMPLOYMENT_TYPE_OPTIONS)} selectedKey={draft.employmentType} onSelectionChange={(v) => { setDraft((d) => ({ ...d, employmentType: v })); setErrors((er) => ({ ...er, employmentType: undefined })); }} errorMessage={errors.employmentType} isRequired />
                <AppSelect name="employmentStatus" label="Employment Status *" placeholder="Select status" options={pickOptions(employmentStatusOptions, EMPLOYMENT_STATUS_OPTIONS)} selectedKey={draft.employmentStatus} onSelectionChange={(v) => { setDraft((d) => ({ ...d, employmentStatus: v })); setErrors((er) => ({ ...er, employmentStatus: undefined })); }} errorMessage={errors.employmentStatus} isRequired />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppTextField name="employerName" label="Employer Name" placeholder="Organisation or farm name" value={draft.employerName} onChange={(v) => setDraft((d) => ({ ...d, employerName: v }))} />
                <AppSelect name="employerType" label="Employer Type" placeholder="Select type" options={pickOptions(employerTypeOptions, EMPLOYER_TYPE_OPTIONS)} selectedKey={draft.employerType} onSelectionChange={(v) => setDraft((d) => ({ ...d, employerType: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppTextField name="jobTitle" label="Job Title" placeholder="Position or job title" value={draft.jobTitle} onChange={(v) => setDraft((d) => ({ ...d, jobTitle: v }))} />
                <AppSelect name="incomeRange" label="Income Range (RWF/month)" placeholder="Select range" options={pickOptions(incomeRangeOptions, INCOME_RANGE_OPTIONS)} selectedKey={draft.incomeRange} onSelectionChange={(v) => setDraft((d) => ({ ...d, incomeRange: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppSelect name="flagshipId" label="Flagship" placeholder="Select flagship" options={flagshipOptions} selectedKey={draft.flagshipId} onSelectionChange={(v) => setDraft((d) => ({ ...d, flagshipId: v }))} />
                <AppSelect name="cooperativeId" label="Cooperative" placeholder="Select cooperative" options={cooperativeOptions} selectedKey={draft.cooperativeId} onSelectionChange={(v) => setDraft((d) => ({ ...d, cooperativeId: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppDate name="startDate" label="Start Date" value={draft.startDate} onChange={(v) => setDraft((d) => ({ ...d, startDate: v }))} />
                <AppDate name="endDate" label="End Date" value={draft.endDate} onChange={(v) => setDraft((d) => ({ ...d, endDate: v }))} />
              </div>
              <Checkbox isSelected={draft.isPrimaryJob} onChange={(v) => setDraft((d) => ({ ...d, isPrimaryJob: v }))}>
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                <Checkbox.Content><span className="text-sm">This is the individual's primary source of income</span></Checkbox.Content>
              </Checkbox>
            </Modal.Body>
            <Modal.Footer className="gap-3">
              <Button variant="outline" slot="close" className="!rounded-3xl">Cancel</Button>
              <Button variant="primary" onPress={handleSave} className="!rounded-3xl">Add</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

// ─── Step 6: Land Access ──────────────────────────────────────────────────────

function LandStep({ entries, onAdd, onRemove }: { entries: LandEntry[]; onAdd: (e: LandEntry) => void; onRemove: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<LandEntry>({ id: "", landSizeHa: "", landUseType: "", ownershipStatus: "", province: "", district: "", sector: "", hasLandTitle: "", year: "" });
  const [errors, setErrors] = useState<LandEntryErrors>({});
  const { landUseTypeOptions, ownershipStatusOptions } = useIndividualsFormLookups();

  function openModal() {
    setDraft({ id: crypto.randomUUID(), landSizeHa: "", landUseType: "", ownershipStatus: "", province: "", district: "", sector: "", hasLandTitle: "", year: "" });
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const errs = validateLandEntry(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onAdd(draft);
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--foreground)">Land Access</h2>
        <Button variant="outline" onPress={openModal} className="!rounded-3xl gap-1.5"><IconPlus size={15} />Add Land</Button>
      </div>
      {entries.length === 0 ? (
        <div className="py-10 text-center text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">No land entries yet. Click "Add Land" to add one.</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <EntryCard key={e.id}
              title={[pickOptions(landUseTypeOptions, LAND_USE_TYPE_OPTIONS).find((o) => o.value === e.landUseType)?.label, e.landSizeHa ? `${e.landSizeHa} ha` : null].filter(Boolean).join(" — ") || "Land entry"}
              subtitle={[pickOptions(ownershipStatusOptions, OWNERSHIP_STATUS_OPTIONS).find((o) => o.value === e.ownershipStatus)?.label, e.district, e.year ? `Year: ${e.year}` : null].filter(Boolean).join(" · ")}
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}
      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
          <Modal.Dialog className={INDIVIDUAL_MODAL_DIALOG_CLASS}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Add Land Access Record</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <AppSelect name="landUseType" label="Land Use Type *" placeholder="Select type" options={pickOptions(landUseTypeOptions, LAND_USE_TYPE_OPTIONS)} selectedKey={draft.landUseType} onSelectionChange={(v) => { setDraft((d) => ({ ...d, landUseType: v })); setErrors((er) => ({ ...er, landUseType: undefined })); }} errorMessage={errors.landUseType} isRequired />
                <AppSelect name="ownershipStatus" label="Ownership Status *" placeholder="Select status" options={pickOptions(ownershipStatusOptions, OWNERSHIP_STATUS_OPTIONS)} selectedKey={draft.ownershipStatus} onSelectionChange={(v) => { setDraft((d) => ({ ...d, ownershipStatus: v })); setErrors((er) => ({ ...er, ownershipStatus: undefined })); }} errorMessage={errors.ownershipStatus} isRequired />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppTextField name="landSizeHa" label="Land Size (ha)" placeholder="e.g. 0.5" type="number" step={0.0001} value={draft.landSizeHa} onChange={(v) => setDraft((d) => ({ ...d, landSizeHa: v }))} />
                <AppTextField name="year" label="Year" placeholder="e.g. 2024" type="number" value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <AppTextField name="province" label="Province" placeholder="Province" value={draft.province} onChange={(v) => setDraft((d) => ({ ...d, province: v }))} />
                <AppTextField name="district" label="District" placeholder="District" value={draft.district} onChange={(v) => setDraft((d) => ({ ...d, district: v }))} />
                <AppTextField name="sector" label="Sector" placeholder="Sector" value={draft.sector} onChange={(v) => setDraft((d) => ({ ...d, sector: v }))} />
              </div>
              <AppSelect
                name="hasLandTitle"
                label="Has Land Title"
                placeholder="Select"
                options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]}
                selectedKey={draft.hasLandTitle}
                onSelectionChange={(v) => setDraft((d) => ({ ...d, hasLandTitle: v }))}
              />
            </Modal.Body>
            <Modal.Footer className="gap-3">
              <Button variant="outline" slot="close" className="!rounded-3xl">Cancel</Button>
              <Button variant="primary" onPress={handleSave} className="!rounded-3xl">Add</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

// ─── Step 7: Production Record ────────────────────────────────────────────────

function ProductionStep({ entries, onAdd, onRemove }: { entries: ProductionEntry[]; onAdd: (e: ProductionEntry) => void; onRemove: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<ProductionEntry>({ id: "", flagshipId: "", cooperativeId: "", product: "", valueChain: "", season: "", year: "", quantityProduced: "", quantitySold: "", unit: "", revenueRwf: "", marketChannel: "", notes: "" });
  const [errors, setErrors] = useState<ProductionEntryErrors>({});
  const { options: flagshipOptions } = useFlagshipSelectOptions();
  const { seasonOptions, unitOptions, marketChannelOptions, cooperativeOptions, valueChainOptions } = useIndividualsFormLookups();

  function openModal() {
    setDraft({ id: crypto.randomUUID(), flagshipId: "", cooperativeId: "", product: "", valueChain: "", season: "", year: "", quantityProduced: "", quantitySold: "", unit: "", revenueRwf: "", marketChannel: "", notes: "" });
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const errs = validateProductionEntry(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onAdd(draft);
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--foreground)">Production Records</h2>
        <Button variant="outline" onPress={openModal} className="!rounded-3xl gap-1.5"><IconPlus size={15} />Add Production</Button>
      </div>
      {entries.length === 0 ? (
        <div className="py-10 text-center text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">No production entries yet. Click "Add Production" to add one.</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <EntryCard key={e.id}
              title={e.product || "Production entry"}
              subtitle={[e.season, e.year, e.quantityProduced ? `${e.quantityProduced} ${e.unit}` : null].filter(Boolean).join(" · ")}
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}
      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
          <Modal.Dialog className={INDIVIDUAL_MODAL_DIALOG_CLASS}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Add Production Record</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <AppTextField name="product" label="Product *" placeholder="e.g. maize, milk" value={draft.product} onChange={(v) => { setDraft((d) => ({ ...d, product: v })); setErrors((er) => ({ ...er, product: undefined })); }} errorMessage={errors.product} isRequired />
                <AppSelect name="valueChain" label="Value Chain" placeholder="Select value chain" options={valueChainOptions} selectedKey={draft.valueChain} onSelectionChange={(v) => setDraft((d) => ({ ...d, valueChain: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppSelect name="season" label="Season" placeholder="Select season" options={pickOptions(seasonOptions, SEASON_OPTIONS)} selectedKey={draft.season} onSelectionChange={(v) => setDraft((d) => ({ ...d, season: v }))} />
                <AppTextField name="year" label="Year *" placeholder="e.g. 2024" type="number" value={draft.year} onChange={(v) => { setDraft((d) => ({ ...d, year: v })); setErrors((er) => ({ ...er, year: undefined })); }} errorMessage={errors.year} isRequired />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <AppTextField name="quantityProduced" label="Qty Produced" placeholder="0" type="number" value={draft.quantityProduced} onChange={(v) => setDraft((d) => ({ ...d, quantityProduced: v }))} />
                <AppTextField name="quantitySold" label="Qty Sold" placeholder="0" type="number" value={draft.quantitySold} onChange={(v) => setDraft((d) => ({ ...d, quantitySold: v }))} />
                <AppSelect name="unit" label="Unit" placeholder="Unit" options={pickOptions(unitOptions, UNIT_OPTIONS)} selectedKey={draft.unit} onSelectionChange={(v) => setDraft((d) => ({ ...d, unit: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppTextField name="revenueRwf" label="Revenue (RWF)" placeholder="0" type="number" value={draft.revenueRwf} onChange={(v) => setDraft((d) => ({ ...d, revenueRwf: v }))} />
                <AppSelect name="marketChannel" label="Market Channel" placeholder="Select channel" options={pickOptions(marketChannelOptions, MARKET_CHANNEL_OPTIONS)} selectedKey={draft.marketChannel} onSelectionChange={(v) => setDraft((d) => ({ ...d, marketChannel: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppSelect name="flagshipId" label="Flagship" placeholder="Select flagship" options={flagshipOptions} selectedKey={draft.flagshipId} onSelectionChange={(v) => setDraft((d) => ({ ...d, flagshipId: v }))} />
                <AppSelect name="cooperativeId" label="Cooperative" placeholder="Select cooperative" options={cooperativeOptions} selectedKey={draft.cooperativeId} onSelectionChange={(v) => setDraft((d) => ({ ...d, cooperativeId: v }))} />
              </div>
              <AppTextarea name="notes" label="Notes" placeholder="Additional context..." value={draft.notes} onChange={(v) => setDraft((d) => ({ ...d, notes: v }))} rows={3} />
            </Modal.Body>
            <Modal.Footer className="gap-3">
              <Button variant="outline" slot="close" className="!rounded-3xl">Cancel</Button>
              <Button variant="primary" onPress={handleSave} className="!rounded-3xl">Add</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

// ─── Step 8: Intervention ─────────────────────────────────────────────────────

function InterventionStep({ entries, onAdd, onRemove }: { entries: InterventionEntry[]; onAdd: (e: InterventionEntry) => void; onRemove: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<InterventionEntry>({ id: "", flagshipId: "", cooperativeId: "", interventionType: "", description: "", deliveryDate: null, valueRwf: "", deliveryLocation: "", notes: "" });
  const [errors, setErrors] = useState<InterventionEntryErrors>({});
  const { options: flagshipOptions } = useFlagshipSelectOptions();
  const { interventionTypeOptions, cooperativeOptions } = useIndividualsFormLookups();

  function openModal() {
    setDraft({ id: crypto.randomUUID(), flagshipId: "", cooperativeId: "", interventionType: "", description: "", deliveryDate: null, valueRwf: "", deliveryLocation: "", notes: "" });
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const errs = validateInterventionEntry(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onAdd(draft);
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--foreground)">Interventions</h2>
        <Button variant="outline" onPress={openModal} className="!rounded-3xl gap-1.5"><IconPlus size={15} />Add Intervention</Button>
      </div>
      {entries.length === 0 ? (
        <div className="py-10 text-center text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">No intervention entries yet. Click "Add Intervention" to add one.</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <EntryCard key={e.id}
              title={pickOptions(interventionTypeOptions, INTERVENTION_TYPE_OPTIONS).find((o) => o.value === e.interventionType)?.label || "Intervention entry"}
              subtitle={[e.deliveryLocation, e.valueRwf ? `${Number(e.valueRwf).toLocaleString()} RWF` : null].filter(Boolean).join(" · ")}
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}
      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
          <Modal.Dialog className={INDIVIDUAL_MODAL_DIALOG_CLASS}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Add Intervention</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <AppSelect name="interventionType" label="Intervention Type *" placeholder="Select type" options={pickOptions(interventionTypeOptions, INTERVENTION_TYPE_OPTIONS)} selectedKey={draft.interventionType} onSelectionChange={(v) => { setDraft((d) => ({ ...d, interventionType: v })); setErrors((er) => ({ ...er, interventionType: undefined })); }} errorMessage={errors.interventionType} isRequired />
              <div className="grid grid-cols-2 gap-4">
                <AppSelect name="flagshipId" label="Flagship" placeholder="Select flagship" options={flagshipOptions} selectedKey={draft.flagshipId} onSelectionChange={(v) => setDraft((d) => ({ ...d, flagshipId: v }))} />
                <AppSelect name="cooperativeId" label="Cooperative" placeholder="Select cooperative" options={cooperativeOptions} selectedKey={draft.cooperativeId} onSelectionChange={(v) => setDraft((d) => ({ ...d, cooperativeId: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppDate name="deliveryDate" label="Delivery Date" value={draft.deliveryDate} onChange={(v) => setDraft((d) => ({ ...d, deliveryDate: v }))} />
                <AppTextField name="valueRwf" label="Value (RWF)" placeholder="0" type="number" value={draft.valueRwf} onChange={(v) => setDraft((d) => ({ ...d, valueRwf: v }))} />
              </div>
              <AppTextField name="deliveryLocation" label="Delivery Location" placeholder="Where it was delivered" value={draft.deliveryLocation} onChange={(v) => setDraft((d) => ({ ...d, deliveryLocation: v }))} />
              <AppTextarea name="description" label="Description" placeholder="What was provided..." value={draft.description} onChange={(v) => setDraft((d) => ({ ...d, description: v }))} rows={3} />
              <AppTextarea name="notes" label="Notes" placeholder="Additional context..." value={draft.notes} onChange={(v) => setDraft((d) => ({ ...d, notes: v }))} rows={3} />
            </Modal.Body>
            <Modal.Footer className="gap-3">
              <Button variant="outline" slot="close" className="!rounded-3xl">Cancel</Button>
              <Button variant="primary" onPress={handleSave} className="!rounded-3xl">Add</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

// ─── Step 9: Constraint Feedback ──────────────────────────────────────────────

function ConstraintStep({ entries, onAdd, onRemove }: { entries: ConstraintEntry[]; onAdd: (e: ConstraintEntry) => void; onRemove: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<ConstraintEntry>({ id: "", flagshipId: "", cooperativeId: "", constraintType: "", severity: "", description: "", reportedDate: null, location: "" });
  const [errors, setErrors] = useState<ConstraintEntryErrors>({});
  const { options: flagshipOptions } = useFlagshipSelectOptions();
  const { constraintTypeOptions, severityOptions, cooperativeOptions } = useIndividualsFormLookups();

  function openModal() {
    setDraft({ id: crypto.randomUUID(), flagshipId: "", cooperativeId: "", constraintType: "", severity: "", description: "", reportedDate: null, location: "" });
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const errs = validateConstraintEntry(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onAdd(draft);
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--foreground)">Constraint Feedback</h2>
        <Button variant="outline" onPress={openModal} className="!rounded-3xl gap-1.5"><IconPlus size={15} />Add Constraint</Button>
      </div>
      {entries.length === 0 ? (
        <div className="py-10 text-center text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">No constraint entries yet. Click "Add Constraint" to add one.</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <EntryCard key={e.id}
              title={pickOptions(constraintTypeOptions, CONSTRAINT_TYPE_OPTIONS).find((o) => o.value === e.constraintType)?.label || "Constraint entry"}
              subtitle={[pickOptions(severityOptions, SEVERITY_OPTIONS).find((o) => o.value === e.severity)?.label ? `Severity: ${pickOptions(severityOptions, SEVERITY_OPTIONS).find((o) => o.value === e.severity)?.label}` : null, e.location].filter(Boolean).join(" · ")}
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}
      <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Container>
          <Modal.Dialog className={INDIVIDUAL_MODAL_DIALOG_CLASS}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Add Constraint Feedback</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <AppSelect name="flagshipId" label="Flagship *" placeholder="Select flagship" options={flagshipOptions} selectedKey={draft.flagshipId} onSelectionChange={(v) => { setDraft((d) => ({ ...d, flagshipId: v })); setErrors((er) => ({ ...er, flagshipId: undefined })); }} errorMessage={errors.flagshipId} isRequired />
              <div className="grid grid-cols-2 gap-4">
                <AppSelect name="constraintType" label="Constraint Type *" placeholder="Select type" options={pickOptions(constraintTypeOptions, CONSTRAINT_TYPE_OPTIONS)} selectedKey={draft.constraintType} onSelectionChange={(v) => { setDraft((d) => ({ ...d, constraintType: v })); setErrors((er) => ({ ...er, constraintType: undefined })); }} errorMessage={errors.constraintType} isRequired />
                <AppSelect name="severity" label="Severity" placeholder="Select severity" options={pickOptions(severityOptions, SEVERITY_OPTIONS)} selectedKey={draft.severity} onSelectionChange={(v) => setDraft((d) => ({ ...d, severity: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AppSelect name="cooperativeId" label="Cooperative" placeholder="Select cooperative" options={cooperativeOptions} selectedKey={draft.cooperativeId} onSelectionChange={(v) => setDraft((d) => ({ ...d, cooperativeId: v }))} />
                <AppDate name="reportedDate" label="Reported Date" value={draft.reportedDate} onChange={(v) => setDraft((d) => ({ ...d, reportedDate: v }))} />
              </div>
              <AppTextField name="location" label="Location" placeholder="Where the constraint was observed" value={draft.location} onChange={(v) => setDraft((d) => ({ ...d, location: v }))} />
              <AppTextarea name="description" label="Description" placeholder="Detailed explanation of the issue..." value={draft.description} onChange={(v) => setDraft((d) => ({ ...d, description: v }))} rows={4} />
            </Modal.Body>
            <Modal.Footer className="gap-3">
              <Button variant="outline" slot="close" className="!rounded-3xl">Cancel</Button>
              <Button variant="primary" onPress={handleSave} className="!rounded-3xl">Add</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ onAddAnother, onBack }: { onAddAnother: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="w-16 h-16 rounded-full bg-(--success)/15 flex items-center justify-center">
        <IconCheck size={32} className="text-(--success)" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-(--foreground)">Individual Added</h2>
        <p className="text-sm text-(--muted-foreground) mt-1">The individual has been successfully registered.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onPress={onBack} className="!rounded-3xl">Back to list</Button>
        <Button variant="primary" onPress={onAddAnother} className="!rounded-3xl">Add another</Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AddIndividualProps {
  backPath: string;
}

const DEFAULT_BASIC: BasicInfoFields = {
  nationalId: "",
  phoneNumber: "",
  firstName: "",
  lastName: "",
  sex: "",
  dateOfBirth: null,
  youthCategory: "",
  educationLevel: "",
  disabilityStatus: "",
  registrationSource: "",
  location: DEFAULT_LOCATION,
  latitude: "",
  longitude: "",
};

export default function AddIndividual({ backPath }: AddIndividualProps) {
  const navigate = useNavigate();
  const {
    sexOptions,
    youthCategoryOptions,
    educationLevelOptions,
    registrationSourceOptions,
  } = useIndividualsFormLookups();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = Number(searchParams.get("editId") || 0);
  const isUpdateMode = Number.isFinite(editId) && editId > 0;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const { data: existingIndividual, isLoading: detailLoading } = useQuery({
    ...individualQueryOptions(editId),
    enabled: isUpdateMode,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [basicTouched, setBasicTouched] = useState(false);

  const [basic, setBasic] = useState<BasicInfoFields>(DEFAULT_BASIC);
  const [basicErrors, setBasicErrors] = useState<BasicInfoErrors>({});

  const [flagshipEntries, setFlagshipEntries] = useState<FlagshipEntry[]>([]);
  const [cooperativeEntries, setCooperativeEntries] = useState<CooperativeEntry[]>([]);
  const [valueChainEntries, setValueChainEntries] = useState<ValueChainEntry[]>([]);
  const [employmentEntries, setEmploymentEntries] = useState<EmploymentEntry[]>([]);
  const [landEntries, setLandEntries] = useState<LandEntry[]>([]);
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([]);
  const [interventionEntries, setInterventionEntries] = useState<InterventionEntry[]>([]);
  const [constraintEntries, setConstraintEntries] = useState<ConstraintEntry[]>([]);

  useEffect(() => {
    setPrefilled(false);
    setFlagshipEntries([]);
    setCooperativeEntries([]);
    setValueChainEntries([]);
    setEmploymentEntries([]);
    setLandEntries([]);
    setProductionEntries([]);
    setInterventionEntries([]);
    setConstraintEntries([]);
  }, [editId]);

  useEffect(() => {
    if (!isUpdateMode || !existingIndividual || prefilled) return;
    setBasic((prev) => ({
      ...prev,
      nationalId: existingIndividual.nationalId ?? "",
      phoneNumber: existingIndividual.phoneNumber ?? "",
      firstName: existingIndividual.firstName ?? "",
      lastName: existingIndividual.lastName ?? "",
      sex: existingIndividual.sex ?? "",
      dateOfBirth: existingIndividual.dateOfBirth
        ? parseDate(existingIndividual.dateOfBirth.slice(0, 10))
        : null,
      youthCategory: existingIndividual.youthCategory ?? "",
      educationLevel: existingIndividual.educationLevel ?? "",
      disabilityStatus:
        existingIndividual.disabilityStatus == null ? "" : String(existingIndividual.disabilityStatus),
      registrationSource: existingIndividual.registrationSource ?? "",
      location: {
        province: existingIndividual.province ?? "",
        district: existingIndividual.district ?? "",
        sector: existingIndividual.sector ?? "",
        cell: existingIndividual.cell ?? "",
        village: existingIndividual.village ?? "",
      },
      latitude: existingIndividual.latitude == null ? "" : String(existingIndividual.latitude),
      longitude: existingIndividual.longitude == null ? "" : String(existingIndividual.longitude),
    }));
    setFlagshipEntries((existingIndividual.flagships ?? []).map(flagshipRelationToEntry));
    setCooperativeEntries((existingIndividual.cooperatives ?? []).map(cooperativeRelationToEntry));
    setValueChainEntries(
      (existingIndividual.valueChains ?? []).map((row) => {
        const entry = row as {
          cluster?: string;
          valueChain?: string;
          valueChainStage?: string;
          primary?: boolean;
          details?: string;
          year?: number;
        };
        return {
          id: crypto.randomUUID(),
          cluster: entry.cluster ?? "",
          valueChain: entry.valueChain ?? "",
          valueChainStage: entry.valueChainStage ?? "",
          isPrimary: entry.primary ?? false,
          details: entry.details ?? "",
          year: entry.year == null ? "" : String(entry.year),
        };
      }),
    );
    setEmploymentEntries(
      (existingIndividual.employments ?? []).map((row) => {
        const entry = row as {
          flagshipId?: number;
          cooperativeId?: number;
          employmentType?: string;
          employmentStatus?: string;
          employerName?: string;
          employerType?: string;
          jobTitle?: string;
          incomeRangeRwf?: string;
          primaryJob?: boolean;
          startDate?: string;
          endDate?: string;
        };
        return {
          id: crypto.randomUUID(),
          flagshipId: entry.flagshipId == null ? "" : String(entry.flagshipId),
          cooperativeId: entry.cooperativeId == null ? "" : String(entry.cooperativeId),
          employmentType: entry.employmentType ?? "",
          employmentStatus: entry.employmentStatus ?? "",
          employerName: entry.employerName ?? "",
          employerType: entry.employerType ?? "",
          jobTitle: entry.jobTitle ?? "",
          incomeRange: entry.incomeRangeRwf ?? "",
          isPrimaryJob: entry.primaryJob ?? false,
          startDate: isoToDateValue(entry.startDate),
          endDate: isoToDateValue(entry.endDate),
        };
      }),
    );
    setLandEntries(
      (existingIndividual.landAccess ?? []).map((row) => {
        const entry = row as {
          landUseType?: string;
          ownershipStatus?: string;
          province?: string;
          district?: string;
          sector?: string;
          landSizeHa?: number;
          hasLandTitle?: boolean;
          year?: number;
        };
        return {
          id: crypto.randomUUID(),
          landSizeHa: entry.landSizeHa == null ? "" : String(entry.landSizeHa),
          landUseType: entry.landUseType ?? "",
          ownershipStatus: entry.ownershipStatus ?? "",
          province: entry.province ?? "",
          district: entry.district ?? "",
          sector: entry.sector ?? "",
          hasLandTitle: entry.hasLandTitle == null ? "" : String(entry.hasLandTitle),
          year: entry.year == null ? "" : String(entry.year),
        };
      }),
    );
    setProductionEntries(
      (existingIndividual.productionRecords ?? []).map((row) => {
        const entry = row as {
          flagshipId?: number;
          cooperativeId?: number;
          product?: string;
          valueChain?: string;
          season?: string;
          year?: number;
          quantityProduced?: number;
          quantitySold?: number;
          unit?: string;
          revenueRwf?: number;
          marketChannel?: string;
          notes?: string;
        };
        return {
          id: crypto.randomUUID(),
          flagshipId: entry.flagshipId == null ? "" : String(entry.flagshipId),
          cooperativeId: entry.cooperativeId == null ? "" : String(entry.cooperativeId),
          product: entry.product ?? "",
          valueChain: entry.valueChain ?? "",
          season: entry.season ?? "",
          year: entry.year == null ? "" : String(entry.year),
          quantityProduced: entry.quantityProduced == null ? "" : String(entry.quantityProduced),
          quantitySold: entry.quantitySold == null ? "" : String(entry.quantitySold),
          unit: entry.unit ?? "",
          revenueRwf: entry.revenueRwf == null ? "" : String(entry.revenueRwf),
          marketChannel: entry.marketChannel ?? "",
          notes: entry.notes ?? "",
        };
      }),
    );
    setInterventionEntries(
      (existingIndividual.interventions ?? []).map((row) => {
        const entry = row as {
          flagshipId?: number;
          cooperativeId?: number;
          interventionType?: string;
          description?: string;
          deliveryDate?: string;
          valueRwf?: number;
          deliveryLocation?: string;
          notes?: string;
        };
        return {
          id: crypto.randomUUID(),
          flagshipId: entry.flagshipId == null ? "" : String(entry.flagshipId),
          cooperativeId: entry.cooperativeId == null ? "" : String(entry.cooperativeId),
          interventionType: entry.interventionType ?? "",
          description: entry.description ?? "",
          deliveryDate: isoToDateValue(entry.deliveryDate),
          valueRwf: entry.valueRwf == null ? "" : String(entry.valueRwf),
          deliveryLocation: entry.deliveryLocation ?? "",
          notes: entry.notes ?? "",
        };
      }),
    );
    setConstraintEntries(
      (existingIndividual.constraintFeedback ?? []).map((row) => {
        const entry = row as {
          flagshipId?: number;
          cooperativeId?: number;
          constraintType?: string;
          severity?: string;
          description?: string;
          reportedDate?: string;
          location?: string;
        };
        return {
          id: crypto.randomUUID(),
          flagshipId: entry.flagshipId == null ? "" : String(entry.flagshipId),
          cooperativeId: entry.cooperativeId == null ? "" : String(entry.cooperativeId),
          constraintType: entry.constraintType ?? "",
          severity: entry.severity ?? "",
          description: entry.description ?? "",
          reportedDate: isoToDateValue(entry.reportedDate),
          location: entry.location ?? "",
        };
      }),
    );
    setPrefilled(true);
  }, [isUpdateMode, existingIndividual, prefilled]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entryState = {
        flagshipEntries,
        cooperativeEntries,
        valueChainEntries,
        employmentEntries,
        landEntries,
        productionEntries,
        interventionEntries,
        constraintEntries,
      };
      const relations = buildRelationsPayload(basic, entryState);
      const payload = {
        nationalId: basic.nationalId || undefined,
        phoneNumber: basic.phoneNumber.trim(),
        firstName: basic.firstName.trim(),
        lastName: basic.lastName.trim(),
        sex: basic.sex,
        dateOfBirth: dateValueToIso(basic.dateOfBirth),
        youthCategory: basic.youthCategory || undefined,
        educationLevel: basic.educationLevel || undefined,
        disabilityStatus: basic.disabilityStatus ? basic.disabilityStatus === "true" : undefined,
        registrationSource: basic.registrationSource,
        province: basic.location.province,
        district: basic.location.district,
        sector: basic.location.sector,
        cell: basic.location.cell || "",
        village: basic.location.village || "",
        latitude: basic.latitude ? parseOptionalNumber(basic.latitude) : undefined,
        longitude: basic.longitude ? parseOptionalNumber(basic.longitude) : undefined,
      };

      if (isUpdateMode) {
        return updateIndividual(editId, { ...payload, ...relations });
      }

      return createIndividual({ ...payload, ...relations });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: individualsQueryOptions.queryKey });
      if (isUpdateMode) {
        void queryClient.invalidateQueries({ queryKey: ["individuals", editId] });
        navigate(backPath, { viewTransition: true });
      } else {
        setSubmitted(true);
      }
    },
    onError: (error: Error) => {
      if (error instanceof ApiError) {
        setSubmitError(formatApiErrorMessage(error.message));
      } else {
        setSubmitError(error.message || "Failed to save individual.");
      }
    },
  });

  const updateBasic = useCallback(<K extends keyof BasicInfoFields>(key: K, value: BasicInfoFields[K]) => {
    setBasic((prev) => ({ ...prev, [key]: value }));
    setBasicTouched(true);
    setBasicErrors((prev) => {
      const next = { ...prev };
      delete next[key as keyof BasicInfoErrors];
      if (key === "location") delete next.province;
      return next;
    });
  }, []);

  function goNext() {
    if (currentStep === 0) {
      const errs = validateBasicInfo(basic);
      if (Object.keys(errs).length > 0) { setBasicErrors(errs); return; }
    }
    setCurrentStep((s) => s + 1);
  }

  function handleSubmit() {
    setSubmitError(null);
    saveMutation.mutate();
  }

  function resetForm() {
    setBasic(DEFAULT_BASIC);
    setBasicErrors({});
    setBasicTouched(false);
    setFlagshipEntries([]);
    setCooperativeEntries([]);
    setValueChainEntries([]);
    setEmploymentEntries([]);
    setLandEntries([]);
    setProductionEntries([]);
    setInterventionEntries([]);
    setConstraintEntries([]);
    setCurrentStep(0);
    setSubmitted(false);
  }

  const stepHasError = currentStep === 0 && Object.values(basicErrors).some(Boolean);
  const stepHasValue =
    currentStep === 0 ? (basicTouched && hasAnyBasicValue(basic)) :
    currentStep === 1 ? flagshipEntries.length > 0 :
    currentStep === 2 ? cooperativeEntries.length > 0 :
    currentStep === 3 ? valueChainEntries.length > 0 :
    currentStep === 4 ? employmentEntries.length > 0 :
    currentStep === 5 ? landEntries.length > 0 :
    currentStep === 6 ? productionEntries.length > 0 :
    currentStep === 7 ? interventionEntries.length > 0 :
    currentStep === 8 ? constraintEntries.length > 0 :
    false;

  if (isUpdateMode && detailLoading) {
    return (
      <div className="space-y-6">
        <PageTitleCard title="Update Individual" />
        <Card className="p-6">
          <p className="text-sm text-(--muted-foreground)">Loading individual...</p>
        </Card>
      </div>
    );
  }

  if (!isUpdateMode && submitted) {
    return (
      <div className="space-y-6">
        <PageTitleCard title="Add Individual" />
        <Card className="p-6">
          <SuccessScreen onAddAnother={resetForm} onBack={() => navigate(backPath, { viewTransition: true })} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard title={isUpdateMode ? "Update Individual" : "Add Individual"} />
      {submitError ? (
        <p className="rounded-lg border border-(--danger) bg-(--danger)/10 px-4 py-3 text-sm text-(--danger)">
          {submitError}
        </p>
      ) : null}

      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        onBack={() => {
          if (currentStep === 0) navigate(backPath, { viewTransition: true });
          else setCurrentStep((s) => s - 1);
        }}
        onNext={goNext}
        onSkip={() => setCurrentStep((s) => s + 1)}
        onSubmit={handleSubmit}
        submitLabel={isUpdateMode ? "Update" : "Save"}
        stepHasValue={stepHasValue}
        stepHasError={stepHasError}
        isSubmitting={saveMutation.isPending}
      >
          {/* ── Step 0: Basic Information ── */}
          {currentStep === 0 && (
            <Form className="w-full" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
              <h2 className="text-base font-semibold text-(--foreground) mb-4">Basic Information</h2>
              <Fieldset className="w-full border-none p-0">
                <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 w-full">
                  <AppTextField
                    name="nationalId"
                    label="National ID"
                    placeholder="e.g. 1199880012345678"
                    value={basic.nationalId}
                    onChange={(v) => updateBasic("nationalId", v)}
                  />
                  <AppTextField
                    name="phoneNumber"
                    label="Phone Number *"
                    placeholder="+250 788 000 000"
                    value={basic.phoneNumber}
                    onChange={(v) => updateBasic("phoneNumber", v)}
                    errorMessage={basicErrors.phoneNumber}
                    isRequired
                  />
                  <AppTextField
                    name="firstName"
                    label="First Name *"
                    placeholder="First name"
                    value={basic.firstName}
                    onChange={(v) => updateBasic("firstName", v)}
                    errorMessage={basicErrors.firstName}
                    isRequired
                  />
                  <AppTextField
                    name="lastName"
                    label="Last Name *"
                    placeholder="Last name"
                    value={basic.lastName}
                    onChange={(v) => updateBasic("lastName", v)}
                    errorMessage={basicErrors.lastName}
                    isRequired
                  />
                  <AppSelect
                    name="sex"
                    label="Sex *"
                    placeholder="Select sex"
                    options={pickOptions(sexOptions, SEX_OPTIONS)}
                    selectedKey={basic.sex}
                    onSelectionChange={(v) => updateBasic("sex", v)}
                    errorMessage={basicErrors.sex}
                    isRequired
                  />
                  <AppDate
                    name="dateOfBirth"
                    label="Date of Birth"
                    value={basic.dateOfBirth}
                    onChange={(v) => updateBasic("dateOfBirth", v)}
                  />
                  <AppSelect
                    name="youthCategory"
                    label="Youth Category"
                    placeholder="Select category"
                    options={pickOptions(youthCategoryOptions, YOUTH_CATEGORY_OPTIONS)}
                    selectedKey={basic.youthCategory}
                    onSelectionChange={(v) => updateBasic("youthCategory", v)}
                  />
                  <AppSelect
                    name="educationLevel"
                    label="Education Level"
                    placeholder="Select education level"
                    options={pickOptions(educationLevelOptions, EDUCATION_LEVEL_OPTIONS)}
                    selectedKey={basic.educationLevel}
                    onSelectionChange={(v) => updateBasic("educationLevel", v)}
                  />
                  <AppSelect
                    name="disabilityStatus"
                    label="Disability Status"
                    placeholder="Select status"
                    options={[
                      { value: "false", label: "No disability" },
                      { value: "true", label: "Has registered disability" },
                    ]}
                    selectedKey={basic.disabilityStatus}
                    onSelectionChange={(v) => updateBasic("disabilityStatus", v)}
                  />
                  <AppSelect
                    name="registrationSource"
                    label="Registration Source *"
                    placeholder="Select source"
                    options={pickOptions(registrationSourceOptions, REGISTRATION_SOURCE_OPTIONS)}
                    selectedKey={basic.registrationSource}
                    onSelectionChange={(v) => updateBasic("registrationSource", v)}
                    errorMessage={basicErrors.registrationSource}
                    isRequired
                  />
                </FieldGroup>
              </Fieldset>

              <div className="w-full mt-4 space-y-2">
                <label className="mb-1 block text-sm font-semibold text-neutral-800">
                  Location <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs font-normal text-(--muted-foreground)">(province, district, and sector required)</span>
                </label>
                {basicErrors.province && (
                  <p className="text-xs text-red-500">{basicErrors.province}</p>
                )}
                <RwandaLocationSelector
                  value={basic.location}
                  onChange={(loc) => updateBasic("location", loc)}
                />
              </div>

              <div className="w-full mt-4">
                <p className="text-sm font-semibold text-neutral-800 mb-3">
                  GPS Coordinates{" "}
                  <span className="text-xs font-normal text-(--muted-foreground)">(optional)</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <AppTextField
                    name="latitude"
                    label="Latitude"
                    placeholder="-1.9403 to -1.0500"
                    type="number"
                    step={0.000001}
                    value={basic.latitude}
                    onChange={(v) => updateBasic("latitude", v)}
                  />
                  <AppTextField
                    name="longitude"
                    label="Longitude"
                    placeholder="28.8617 to 30.8990"
                    type="number"
                    step={0.000001}
                    value={basic.longitude}
                    onChange={(v) => updateBasic("longitude", v)}
                  />
                </div>
              </div>
            </Form>
          )}

          {/* ── Step 1: Flagship Information ── */}
          {currentStep === 1 && (
            <FlagshipStep
              entries={flagshipEntries}
              onAdd={(e) => setFlagshipEntries((prev) => [...prev, e])}
              onRemove={(id) => setFlagshipEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          )}

          {/* ── Step 2: Cooperative Information ── */}
          {currentStep === 2 && (
            <CooperativeStep
              entries={cooperativeEntries}
              onAdd={(e) => setCooperativeEntries((prev) => [...prev, e])}
              onRemove={(id) => setCooperativeEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          )}

          {/* ── Step 3: Value Chain ── */}
          {currentStep === 3 && (
            <ValueChainStep
              entries={valueChainEntries}
              onAdd={(e) => setValueChainEntries((prev) => [...prev, e])}
              onRemove={(id) => setValueChainEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          )}

          {/* ── Step 4: Employment ── */}
          {currentStep === 4 && (
            <EmploymentStep
              entries={employmentEntries}
              onAdd={(e) => setEmploymentEntries((prev) => [...prev, e])}
              onRemove={(id) => setEmploymentEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          )}

          {/* ── Step 5: Land Access ── */}
          {currentStep === 5 && (
            <LandStep
              entries={landEntries}
              onAdd={(e) => setLandEntries((prev) => [...prev, e])}
              onRemove={(id) => setLandEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          )}

          {/* ── Step 6: Production Record ── */}
          {currentStep === 6 && (
            <ProductionStep
              entries={productionEntries}
              onAdd={(e) => setProductionEntries((prev) => [...prev, e])}
              onRemove={(id) => setProductionEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          )}

          {/* ── Step 7: Intervention ── */}
          {currentStep === 7 && (
            <InterventionStep
              entries={interventionEntries}
              onAdd={(e) => setInterventionEntries((prev) => [...prev, e])}
              onRemove={(id) => setInterventionEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          )}

          {/* ── Step 8: Constraint Feedback ── */}
          {currentStep === 8 && (
            <ConstraintStep
              entries={constraintEntries}
              onAdd={(e) => setConstraintEntries((prev) => [...prev, e])}
              onRemove={(id) => setConstraintEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          )}
        </Stepper>
    </div>
  );
}
