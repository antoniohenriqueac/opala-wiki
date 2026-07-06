import {
  formatStaminaTime,
  splitStaminaHours,
  staminaFromParts,
  STAMINA_MAX_HOURS,
} from '../lib/stamina-model';
import { displayXpPerHour, xpForHuntDuration } from '../lib/xp-boost';
import { fmtCompact, fmtXpPerHour } from '../lib/format';

interface StaminaInputProps {
  hours: number;
  onChange: (hours: number) => void;
  rawXpPerHour?: number;
  gainRate?: number;
  xpBoost?: boolean;
}

export function StaminaInput({
  hours,
  onChange,
  rawXpPerHour,
  gainRate = 120,
  xpBoost,
}: StaminaInputProps) {
  const { h, m } = splitStaminaHours(hours);
  const xpPerHour =
    rawXpPerHour != null && rawXpPerHour > 0 ? displayXpPerHour(rawXpPerHour, gainRate) : null;
  const totalXp =
    rawXpPerHour != null && rawXpPerHour > 0
      ? xpForHuntDuration(rawXpPerHour, hours, gainRate, xpBoost ?? false)
      : null;

  const setParts = (nextH: number, nextM: number) => {
    onChange(staminaFromParts(nextH, nextM));
  };

  return (
    <div class="stamina-input">
      <div class="stamina-input-row">
        <input
          type="number"
          min={0}
          max={STAMINA_MAX_HOURS}
          value={h}
          onInput={(e) => setParts(+(e.target as HTMLInputElement).value, m)}
        />
        <span class="stamina-unit">h</span>
        <input
          type="number"
          min={0}
          max={59}
          value={m}
          onInput={(e) => setParts(h, +(e.target as HTMLInputElement).value)}
        />
        <span class="stamina-unit">min</span>
      </div>
      <div class="stamina-preview">
        <div class="stamina-bar" aria-hidden="true">
          {Array.from({ length: STAMINA_MAX_HOURS }, (_, i) => {
            const filled = i < Math.floor(hours);
            const partial = i === Math.floor(hours) && hours % 1 > 0.001;
            return (
              <span
                key={i}
                class={`stamina-seg${filled ? ' filled' : ''}${partial ? ' partial' : ''}`}
              />
            );
          })}
        </div>
        <span class="stamina-readout">{formatStaminaTime(hours)}</span>
        {xpPerHour != null && xpPerHour > 0 && (
          <span class="stamina-zone">
            {fmtXpPerHour(xpPerHour)}
            {hours > 0 && (
              <span class="stamina-mode-tag">
                {' '}
                · ~{totalXp!.toLocaleString('pt-BR')} XP total
              </span>
            )}
          </span>
        )}
      </div>
      {totalXp != null && totalXp > 0 && (
        <p class="stamina-session-hint muted">
          ~{totalXp.toLocaleString('pt-BR')} XP em {formatStaminaTime(hours)} de caça ({gainRate}%
          {xpBoost ? ` · 1ª h a ${gainRate + 50}% com boost` : ''}). Raw: {fmtCompact(rawXpPerHour!)}{' '}
          xp/h — taxa premium não muda com a duração.
        </p>
      )}
    </div>
  );
}
