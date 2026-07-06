import { clampStaminaHours, valueForHuntDuration } from './stamina-model';
import { applyGainRate } from './xp-calculator';

/** In-game XP Boost: +50% gain rate for 1 hour in the hunt window (additive on premium). */
export const XP_BOOST_DURATION_H = 1;
export const XP_BOOST_BONUS_PERCENT = 50;

export function xpBoostBonusHours(huntHours: number): number {
  return Math.min(XP_BOOST_DURATION_H, clampStaminaHours(huntHours));
}

export function effectiveGainRatePercent(
  gainRate: number,
  xpBoost: boolean,
  isBoostHour: boolean,
): number {
  const base = Math.max(1, gainRate);
  if (xpBoost && isBoostHour) return base + XP_BOOST_BONUS_PERCENT;
  return base;
}

/** Total XP over hunt duration with gain rate and optional 1h +50% boost (additive). */
export function xpForHuntDuration(
  rawPerHour: number,
  huntHours: number,
  gainRate: number,
  xpBoost: boolean,
): number {
  const h = clampStaminaHours(huntHours);
  if (h <= 0 || rawPerHour <= 0) return 0;
  const rate = Math.max(1, gainRate);
  if (!xpBoost) return Math.round(valueForHuntDuration(rawPerHour, h) * (rate / 100));
  const boostH = xpBoostBonusHours(h);
  const normalH = Math.max(0, h - boostH);
  const normalXp = rawPerHour * normalH * (rate / 100);
  const boostXp = rawPerHour * boostH * ((rate + XP_BOOST_BONUS_PERCENT) / 100);
  return Math.round(normalXp + boostXp);
}

export function displayXpPerHour(rawPerHour: number, gainRate: number): number {
  return applyGainRate(rawPerHour, gainRate);
}

export function displayXpRange(
  perHourLow: number,
  perHourHigh: number,
  huntHours: number,
  gainRate: number,
  xpBoost: boolean,
): { low: number; high: number } {
  return {
    low: xpForHuntDuration(perHourLow, huntHours, gainRate, xpBoost),
    high: xpForHuntDuration(perHourHigh, huntHours, gainRate, xpBoost),
  };
}

/** Total raw XP over hunt duration with optional 1h +50% on raw (legacy / breakdown). */
export function rawXpForHuntDuration(
  perHour: number,
  huntHours: number,
  xpBoost: boolean,
): number {
  const h = clampStaminaHours(huntHours);
  if (h <= 0 || perHour <= 0) return 0;
  if (!xpBoost) return valueForHuntDuration(perHour, h);
  const boostH = xpBoostBonusHours(h);
  const normalH = Math.max(0, h - boostH);
  const boostMul = 1 + XP_BOOST_BONUS_PERCENT / 100;
  return Math.round(perHour * normalH + perHour * boostMul * boostH);
}

/** @deprecated use rawXpForHuntDuration */
export const rawXpForStaminaWindow = rawXpForHuntDuration;

export function displayRawXp(
  basePerHour: number,
  huntHours: number,
  xpBoost: boolean,
): number {
  return rawXpForHuntDuration(basePerHour, huntHours, xpBoost);
}

export function displayRawXpRange(
  perHourLow: number,
  perHourHigh: number,
  huntHours: number,
  xpBoost: boolean,
): { low: number; high: number } {
  return {
    low: displayRawXp(perHourLow, huntHours, xpBoost),
    high: displayRawXp(perHourHigh, huntHours, xpBoost),
  };
}

export function displayRealXpRange(
  perHourLow: number,
  perHourHigh: number,
  huntHours: number,
  xpBoost: boolean,
  gainRate?: number,
): { low: number; high: number } {
  const rate = gainRate ?? 120;
  return displayXpRange(perHourLow, perHourHigh, huntHours, rate, xpBoost);
}

export function isXpBoostActive(xpBoost: boolean | undefined): boolean {
  return xpBoost === true;
}
