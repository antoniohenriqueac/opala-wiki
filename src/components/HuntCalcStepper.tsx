interface StepDef {
  id: string;
  label: string;
}

interface HuntCalcStepperProps {
  steps: StepDef[];
  active: string;
  onSelect: (id: string) => void;
  /** Steps after this id are not selectable until respawn is configured. */
  lockedAfterStepId?: string;
}

function StepCheck() {
  return (
    <svg class="calc-step-check" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2 6.5 4.5 9 10 3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

export function HuntCalcStepper({
  steps,
  active,
  onSelect,
  lockedAfterStepId,
}: HuntCalcStepperProps) {
  const activeIdx = steps.findIndex((s) => s.id === active);
  const progress = steps.length > 1 ? (activeIdx / (steps.length - 1)) * 100 : 0;
  const lockIdx =
    lockedAfterStepId != null ? steps.findIndex((s) => s.id === lockedAfterStepId) : -1;

  return (
    <nav class="calc-stepper" aria-label="Passos da calculadora">
      <div class="calc-stepper-track" aria-hidden="true">
        <div class="calc-stepper-track-fill" style={{ width: `${progress}%` }} />
      </div>
      <div class="calc-stepper-steps">
        {steps.map((step, i) => {
          const isActive = step.id === active;
          const isDone = i < activeIdx;
          const isLocked = lockIdx >= 0 && i > lockIdx;
          return (
            <button
              type="button"
              key={step.id}
              class={`calc-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}${isLocked ? ' locked' : ''}`}
              onClick={() => !isLocked && onSelect(step.id)}
              disabled={isLocked}
              aria-current={isActive ? 'step' : undefined}
              aria-disabled={isLocked || undefined}
            >
              <span class="calc-step-indicator">
                {isDone ? <StepCheck /> : <span class="calc-step-num">{i + 1}</span>}
              </span>
              <span class="calc-step-label">{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export type { StepDef };
