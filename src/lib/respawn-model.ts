import type { Hunt, Monster, XPCalcSettings } from './types';

/** Each 20 equipment SPEED reduces respawn by 1 second (in-game rule). */
export const SPEED_POINTS_PER_SEC = 20;

/** @deprecated use SPEED_POINTS_PER_SEC — kept for grep compatibility */
export const SPEED_COEFF = 1 / SPEED_POINTS_PER_SEC;

/** Orc Fortress baseline at max lure — see docs/lure-pace-samples.json */
export const DEFAULT_BASE_INTERVAL_SEC = 3.5;

/** Not every lured slot yields a kill each respawn tick (calibrated ~217k Orc Fortress). */
export const LURE_PARALLEL_FACTOR = 0.69;

export function estimateRespawnInterval(hunt: Hunt, settings: XPCalcSettings): number {
  const maxLure = Math.max(1, hunt.maxLure || 1);
  const minLure = Math.max(1, hunt.minLure || 1);
  const lure = Math.max(minLure, Math.min(maxLure, settings.lure ?? maxLure));

  const lureSpan = maxLure - minLure || 1;
  const lureT = (lure - minLure) / lureSpan;
  const huntMin = hunt.minRespawnSec;
  const huntMax = hunt.maxRespawnSec;
  const baseSlow = huntMax ?? 5.0;
  const baseFast = huntMin ?? DEFAULT_BASE_INTERVAL_SEC;
  let interval = baseSlow - lureT * (baseSlow - baseFast);

  const recLevel = Math.max(1, hunt.recommendedLevel ?? hunt.levelMin ?? 1);
  const charLevel = Math.max(1, settings.charLevel ?? recLevel);
  const levelRatio = charLevel / recLevel;
  if (levelRatio < 1) {
    interval *= Math.min(1.35, 1 / levelRatio);
  } else if (levelRatio > 1) {
    // Over recommended: respawn stops improving (plateau) — in-game ~3.5s Orc Fortress
    const cappedRatio = Math.min(levelRatio, 1.25);
    interval *= Math.max(0.92, 1 / Math.sqrt(cappedRatio));
  }

  const totalSpeed = Math.max(0, settings.totalItemSpeed ?? 0);
  interval -= totalSpeed / SPEED_POINTS_PER_SEC;

  const maxSec = (huntMax ?? baseSlow) * 1.1;
  const absoluteMin = huntMin ?? 1.5;
  return Math.max(absoluteMin, Math.min(maxSec, interval));
}

/** Seconds removed from respawn for a given SPEED total. */
export function speedRespawnReductionSec(totalSpeed: number): number {
  return Math.max(0, totalSpeed) / SPEED_POINTS_PER_SEC;
}

export function cycleTimeSeconds(
  monsterHp: number,
  partyDps: number,
  respawnInterval: number,
  lure = 1,
): { killTime: number; cycleTime: number; respawnLimited: boolean; respawnPerKill: number } {
  const killTime = monsterHp / Math.max(1, partyDps);
  const parallel = Math.max(1, lure) * LURE_PARALLEL_FACTOR;
  const respawnPerKill = respawnInterval / parallel;
  const cycleTime = Math.max(killTime, respawnPerKill);
  return { killTime, cycleTime, respawnLimited: respawnPerKill >= killTime * 1.02, respawnPerKill };
}

export function cappedDpsForHunt(
  baseDps: number,
  monsters: Monster[],
  charLevel: number,
  recommendedLevel?: number,
  respawnInterval?: number,
  lure = 1,
  dmgSharePct = 100,
): number {
  if (!monsters.length) return baseDps;
  const maxHp = Math.max(...monsters.map((m) => m.hp));
  const rec = recommendedLevel ?? 1;
  let capped = baseDps;
  if (charLevel >= rec + 5) {
    capped = Math.min(capped, maxHp);
  }
  if (respawnInterval && charLevel >= rec) {
    const share = Math.max(0.05, Math.min(1, dmgSharePct / 100));
    const respawnPerKill = respawnInterval / (Math.max(1, lure) * LURE_PARALLEL_FACTOR);
    const maxPartyDps = maxHp / respawnPerKill;
    capped = Math.min(capped, maxPartyDps * share);
  }
  return capped;
}

/** Shared cycle when over recommended level — respawn plateau across the hunt. */
export function huntCycleSeconds(
  monsters: Monster[],
  weights: Record<string, number>,
  partyDps: number,
  respawnInterval: number,
  lure: number,
  charLevel: number,
  recommendedLevel: number,
): number {
  const respawnPerKill = respawnInterval / (Math.max(1, lure) * LURE_PARALLEL_FACTOR);
  let totalWeight = 0;
  let weightedKill = 0;
  for (const m of monsters) {
    const w = weights[String(m.id)] ?? weights[m.id as unknown as string] ?? 10;
    totalWeight += w;
    weightedKill += w * (m.hp / Math.max(1, partyDps));
  }
  if (!totalWeight) totalWeight = monsters.length || 1;
  weightedKill /= totalWeight;

  const overLevel = charLevel - recommendedLevel;
  if (overLevel >= 20) {
    return respawnPerKill;
  }
  if (charLevel >= recommendedLevel) {
    return Math.max(weightedKill, respawnPerKill);
  }
  return weightedKill;
}
