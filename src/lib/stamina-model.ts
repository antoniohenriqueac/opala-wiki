/** Max hunt duration selector (12h). */
export const STAMINA_MAX_HOURS = 12;
export const STAMINA_DEFAULT_HOURS = 1;

export function formatStaminaTime(hours: number): string {
  const totalMin = Math.round(clampStaminaHours(hours) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function clampStaminaHours(hours: number): number {
  return Math.max(0, Math.min(STAMINA_MAX_HOURS, hours));
}

/** Hunt duration in hours (0–12). Does not change raw xp/h — only scales totals. */
export function normalizeStaminaHours(raw: unknown): number {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : STAMINA_DEFAULT_HOURS;
  if (n <= 0) return 0;
  return clampStaminaHours(n);
}

/**
 * v1 saves used stamina as an XP multiplier (0.1–1.5). Integer 1 was misread as 1.0× → 10h.
 * Used once when upgrading old localStorage entries.
 */
export function migrateLegacyStaminaHours(raw: unknown): number {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : STAMINA_DEFAULT_HOURS;
  if (n <= 0) return 0;
  if (n === 10) return STAMINA_DEFAULT_HOURS;
  if (Number.isInteger(n) && n >= 1 && n <= STAMINA_MAX_HOURS) return n;
  if (n > 1 && n <= STAMINA_MAX_HOURS) return clampStaminaHours(n);
  if (n > 0 && n < 1) return clampStaminaHours(n);
  if (n <= 3) {
    if (n >= 1.45) return STAMINA_MAX_HOURS;
    if (n >= 0.95) return STAMINA_DEFAULT_HOURS;
    if (n >= 0.45) return STAMINA_DEFAULT_HOURS;
    return STAMINA_DEFAULT_HOURS;
  }
  return clampStaminaHours(n);
}

export function staminaFromParts(hours: number, minutes: number): number {
  return clampStaminaHours(hours + Math.max(0, Math.min(59, minutes)) / 60);
}

export function splitStaminaHours(hours: number): { h: number; m: number } {
  const totalMin = Math.round(clampStaminaHours(hours) * 60);
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}

/** Total raw xp or gp for a hunt session (linear: rate × hours). */
export function valueForHuntDuration(perHour: number, huntHours: number): number {
  return Math.round(perHour * clampStaminaHours(huntHours));
}

/** @deprecated use valueForHuntDuration */
export const valueForStaminaSession = valueForHuntDuration;
