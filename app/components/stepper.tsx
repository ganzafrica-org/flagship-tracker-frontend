import { createContext, useContext, type ReactNode } from "react";
import { Button, Card } from "@heroui/react";
import { IconCheck } from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepConfig {
  /** Unique step id */
  id: string;
  /** Display label shown under / next to the step number */
  label: string;
  /**
   * When true the step is considered optional — a "Skip" button is shown
   * instead of "Next" unless the user has touched at least one field on
   * the step (then it switches back to "Next").
   */
  optional?: boolean;
}

export interface StepperProps {
  steps: StepConfig[];
  /** Zero-based index of the currently visible step */
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  /** Called when the user skips an optional step */
  onSkip: () => void;
  /** Called when the user submits (last step) */
  onSubmit: () => void;
  /** Whether any field on the current step has been touched/filled */
  stepHasValue?: boolean;
  /** Whether any required field on the current step is invalid (zod / react-aria) */
  stepHasError?: boolean;
  /** Disable the Next/Submit button */
  isNextDisabled?: boolean;
  /** Show spinner on Next/Submit */
  isSubmitting?: boolean;
  /** Optional label for submit action */
  submitLabel?: string;
  /** Layout direction */
  orientation?: "horizontal" | "vertical";
  /** Content for the current step */
  children: ReactNode;
  className?: string;
}

// ─── Context (so children can read current step index) ────────────────────────

interface StepperContextValue {
  currentStep: number;
  totalSteps: number;
}

const StepperContext = createContext<StepperContextValue>({ currentStep: 0, totalSteps: 1 });
export const useStepperContext = () => useContext(StepperContext);

// ─── Step indicator ──────────────────────────────────────────────────────────

interface StepIndicatorProps {
  index: number;
  label: string;
  isCurrent: boolean;
  isCompleted: boolean;
  isLast: boolean;
  orientation: "horizontal" | "vertical";
}

function StepIndicator({ index, label, isCurrent, isCompleted, isLast, orientation }: StepIndicatorProps) {
  const circleBase = "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 transition-colors";

  const circleClass = isCompleted
    ? `${circleBase} bg-(--accent) text-(--accent-foreground)`
    : isCurrent
    ? `${circleBase} bg-(--accent) text-(--accent-foreground) ring-4 ring-(--accent)/20`
    : `${circleBase} bg-(--default) text-(--muted-foreground)`;

  const labelClass = `text-xs font-medium mt-1 transition-colors ${
    isCurrent ? "text-(--accent)" : isCompleted ? "text-(--foreground)" : "text-(--muted-foreground)"
  }`;

  if (orientation === "vertical") {
    return (
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={circleClass}>
            {isCompleted ? <IconCheck size={16} /> : index + 1}
          </div>
          {!isLast && <div className="w-0.5 flex-1 mt-1 bg-(--border) min-h-6" />}
        </div>
        <div className={`pt-1 pb-4 ${labelClass} mt-0`}>{label}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={circleClass}>
        {isCompleted ? <IconCheck size={16} /> : index + 1}
      </div>
      <span className={`${labelClass} whitespace-nowrap`}>{label}</span>
    </div>
  );
}

// ─── Connector line (horizontal) ─────────────────────────────────────────────

function HorizontalConnector({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div
      className={`w-8 h-0.5 transition-colors self-start mt-4 shrink-0 ${
        isCompleted ? "bg-(--accent)" : "bg-(--border)"
      }`}
    />
  );
}

// ─── Ellipsis node ────────────────────────────────────────────────────────────

function StepEllipsis({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="flex items-center justify-center w-8 h-8">
        <span className={`text-sm font-bold tracking-widest leading-none ${isCompleted ? "text-(--accent)" : "text-(--muted-foreground)"}`}>
          ···
        </span>
      </div>
      {/* spacer matches the label height so rows align */}
      <span className="text-xs text-transparent select-none mt-1">·</span>
    </div>
  );
}

// ─── Build visible track items ────────────────────────────────────────────────

type TrackItem =
  | { kind: "step"; index: number }
  | { kind: "ellipsis"; allCompleted: boolean };

/**
 * When steps > 4, collapses the middle into a single ellipsis.
 * Always shows: first, (ellipsis?), currentStep-1, currentStep, currentStep+1, (ellipsis?), last.
 * Deduplicates so first/last are never shown twice.
 */
function buildTrack(total: number, current: number): TrackItem[] {
  if (total <= 4) {
    return Array.from({ length: total }, (_, i) => ({ kind: "step" as const, index: i }));
  }

  const visible = new Set<number>();
  visible.add(0);
  visible.add(total - 1);
  if (current - 1 >= 0) visible.add(current - 1);
  visible.add(current);
  if (current + 1 < total) visible.add(current + 1);

  const sorted = Array.from(visible).sort((a, b) => a - b);
  const track: TrackItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const idx = sorted[i];
    const prev = sorted[i - 1] ?? -1;

    if (i > 0 && idx > prev + 1) {
      // There's a gap — insert ellipsis. It's "completed" if all hidden steps are behind current.
      track.push({ kind: "ellipsis", allCompleted: prev + 1 < current && idx <= current });
    }

    track.push({ kind: "step", index: idx });
  }

  return track;
}

// ─── Main Stepper ─────────────────────────────────────────────────────────────

export function Stepper({
  steps,
  currentStep,
  onNext,
  onBack,
  onSkip,
  onSubmit,
  stepHasValue = false,
  stepHasError = false,
  isNextDisabled = false,
  isSubmitting = false,
  submitLabel,
  orientation = "horizontal",
  children,
  className = "",
}: StepperProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const currentConfig = steps[currentStep];
  const isOptional = Boolean(currentConfig?.optional);

  // "Skip" shows only if the step is optional AND the user hasn't filled anything
  const showSkip = isOptional && !stepHasValue;

  if (orientation === "vertical") {
    return (
      <StepperContext.Provider value={{ currentStep, totalSteps: steps.length }}>
        <div className={`flex gap-6 ${className}`}>
          {/* Left: vertical step track */}
          <div className="flex flex-col w-44 shrink-0">
            {steps.map((step, i) => (
              <StepIndicator
                key={step.id}
                index={i}
                label={step.label}
                isCurrent={i === currentStep}
                isCompleted={i < currentStep}
                isLast={i === steps.length - 1}
                orientation="vertical"
              />
            ))}
          </div>

          {/* Right: content + actions */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="flex-1">{children}</div>
            <StepperActions
              isFirst={isFirst}
              isLast={isLast}
              showSkip={showSkip}
              isNextDisabled={isNextDisabled || stepHasError}
              isSubmitting={isSubmitting}
              onBack={onBack}
              onNext={onNext}
              onSkip={onSkip}
              onSubmit={onSubmit}
              submitLabel={submitLabel}
            />
          </div>
        </div>
      </StepperContext.Provider>
    );
  }

  // ── Horizontal layout ──
  const track = buildTrack(steps.length, currentStep);

  return (
    <StepperContext.Provider value={{ currentStep, totalSteps: steps.length }}>
      <div className={`flex flex-col gap-4 ${className}`}>
        {/* Step track card */}
        <Card className="px-6 py-4 flex items-center justify-center">
          <div className="flex items-start justify-center">
            {track.map((item, ti) => {
              const isLast = ti === track.length - 1;

              if (item.kind === "ellipsis") {
                return (
                  <div key={`ellipsis-${ti}`} className="flex items-start shrink-0">
                    <HorizontalConnector isCompleted={item.allCompleted} />
                    <StepEllipsis isCompleted={item.allCompleted} />
                    {!isLast && <HorizontalConnector isCompleted={false} />}
                  </div>
                );
              }

              const i = item.index;
              const step = steps[i];

              return (
                <div key={step.id} className="flex items-start shrink-0">
                  <StepIndicator
                    index={i}
                    label={step.label}
                    isCurrent={i === currentStep}
                    isCompleted={i < currentStep}
                    isLast={i === steps.length - 1}
                    orientation="horizontal"
                  />
                  {!isLast && <HorizontalConnector isCompleted={i < currentStep} />}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Content + actions card */}
        <Card className="p-6 flex flex-col gap-6">
          <div>{children}</div>
          <StepperActions
            isFirst={isFirst}
            isLast={isLast}
            showSkip={showSkip}
            isNextDisabled={isNextDisabled || stepHasError}
            isSubmitting={isSubmitting}
            onBack={onBack}
            onNext={onNext}
            onSkip={onSkip}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
          />
        </Card>
      </div>
    </StepperContext.Provider>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────

interface StepperActionsProps {
  isFirst: boolean;
  isLast: boolean;
  showSkip: boolean;
  isNextDisabled: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}

function StepperActions({
  isFirst,
  isLast,
  showSkip,
  isNextDisabled,
  isSubmitting,
  onBack,
  onNext,
  onSkip,
  onSubmit,
  submitLabel,
}: StepperActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2 border-t border-(--border)">
      <Button
        variant="outline"
        onPress={onBack}
        isDisabled={isFirst}
        className="!rounded-3xl"
      >
        Back
      </Button>

      <div className="flex gap-3">
        {showSkip && (
          <Button
            variant="ghost"
            onPress={onSkip}
            className="!rounded-3xl"
          >
            Skip
          </Button>
        )}

        {isLast ? (
          <Button
            variant="primary"
            onPress={onSubmit}
            isDisabled={isNextDisabled}
            isLoading={isSubmitting}
            className="!rounded-3xl"
          >
            {submitLabel ?? "Submit"}
          </Button>
        ) : (
          <Button
            variant="primary"
            onPress={onNext}
            isDisabled={isNextDisabled}
            className="!rounded-3xl"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
