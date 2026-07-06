interface StepDef {
  id: string;
  label: string;
}

interface HuntCalcStepperProps {
  steps: StepDef[];
  active: string;
  onSelect: (id: string) => void;
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

export function HuntCalcStepper({ steps, active, onSelect }: HuntCalcStepperProps) {
  const activeIdx = steps.findIndex((s) => s.id === active);
  const progress = steps.length > 1 ? (activeIdx / (steps.length - 1)) * 100 : 0;

  return (
    <nav class="calc-stepper" aria-label="Passos da calculadora">
      <div class="calc-stepper-track" aria-hidden="true">
        <div class="calc-stepper-track-fill" style={{ width: `${progress}%` }} />
      </div>
      <div class="calc-stepper-steps">
        {steps.map((step, i) => {
          const isActive = step.id === active;
          const isDone = i < activeIdx;
          return (
            <button
              type="button"
              key={step.id}
              class={`calc-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
              onClick={() => onSelect(step.id)}
              aria-current={isActive ? 'step' : undefined}
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
