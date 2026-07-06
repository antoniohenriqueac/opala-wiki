import type { Hunt, Monster, XPCalcSettings } from './types';

/** Orc Fortress baseline at max lure — see docs/lure-pace-samples.json */
export const DEFAULT_BASE_INTERVAL_SEC = 3.5;

/** Default slow respawn when hunt has no lurePace.maxSeconds (min lure / worst case). */
export const DEFAULT_MAX_INTERVAL_SEC = 12;

/** Not every lured slot yields a kill each respawn tick (calibrated ~217k Orc Fortress). */
export const LURE_PARALLEL_FACTOR = 0.69;

export interface RespawnBounds {
  minSec: number;
  maxSec: number;
  currentSec: number;
  manual: boolean;
}

function applyRespawnLevelScale(interval: number, hunt: Hunt, charLevel: number): number {
  const recLevel = Math.max(1, hunt.recommendedLevel ?? hunt.levelMin ?? 1);
  const level = Math.max(1, charLevel);
  const levelRatio = level / recLevel;
  if (levelRatio < 1) {
    return interval * Math.min(1.35, 1 / levelRatio);
  }
  if (levelRatio > 1) {
    const cappedRatio = Math.min(levelRatio, 1.25);
    return interval * Math.max(0.92, 1 / Math.sqrt(cappedRatio));
  }
  return interval;
}

/** Hunt respawn window: fast (minSec) at max lure → slow (maxSec) at min lure, or manual single value. */
export function respawnBounds(hunt: Hunt, settings: XPCalcSettings): RespawnBounds {
  const manual = settings.respawnSec;
  if (typeof manual === 'number' && manual > 0) {
    return { minSec: manual, maxSec: manual, currentSec: manual, manual: true };
  }

  const charLevel = settings.charLevel ?? hunt.recommendedLevel ?? 50;
  const huntMin = hunt.minRespawnSec ?? DEFAULT_BASE_INTERVAL_SEC;
  const huntMax = hunt.maxRespawnSec ?? DEFAULT_MAX_INTERVAL_SEC;
  const minSec = applyRespawnLevelScale(Math.min(huntMin, huntMax), hunt, charLevel);
  const maxSec = applyRespawnLevelScale(Math.max(huntMin, huntMax), hunt, charLevel);
  const maxLure = Math.max(1, hunt.maxLure || 1);
  const lure = clampLureTier(hunt, settings.lure ?? maxLure);
  const currentSec = estimateRespawnInterval(hunt, { ...settings, lure, charLevel, respawnSec: undefined });

  return { minSec, maxSec, currentSec, manual: false };
}

/** Typical respawn for Hunt Finder cards — midpoint of the hunt window (e.g. ~8s on 3,5–12). */
export function respawnAverageSec(bounds: RespawnBounds): number {
  if (bounds.manual) return bounds.currentSec;
  return (bounds.minSec + bounds.maxSec) / 2;
}

export function clampLureTier(hunt: Hunt, lure: number): number {
  const maxLure = Math.max(1, hunt.maxLure || 1);
  const minLure = Math.max(1, hunt.minLure || 1);
  return Math.max(minLure, Math.min(maxLure, lure));
}

/** Client lure tier T → attracts T to T+1 creatures (e.g. Lure 3 → 3–4). */
export function lureCreatureInterval(hunt: Hunt, lure: number): { min: number; max: number } {
  const tier = clampLureTier(hunt, lure);
  return { min: tier, max: tier + 1 };
}

/** Max creatures at top lure tier (client "MAX N" badge). */
export function maxCreaturesForHunt(hunt: Hunt): number {
  const maxLure = Math.max(1, hunt.maxLure || 1);
  return lureCreatureInterval(hunt, maxLure).max;
}

export function lureSelectOptions(hunt: Hunt): { value: number; label: string }[] {
  const maxLure = Math.max(1, hunt.maxLure || 1);
  const minLure = Math.max(1, hunt.minLure || 1);
  const opts: { value: number; label: string }[] = [];
  for (let tier = minLure; tier <= maxLure; tier++) {
    const { min, max } = lureCreatureInterval(hunt, tier);
    opts.push({ value: tier, label: `Lure ${min} a ${max}` });
  }
  return opts;
}

export function estimateRespawnInterval(hunt: Hunt, settings: XPCalcSettings): number {
  const manual = settings.respawnSec;
  if (typeof manual === 'number' && manual > 0) {
    return manual;
  }

  const maxLure = Math.max(1, hunt.maxLure || 1);
  const minLure = Math.max(1, hunt.minLure || 1);
  const lure = Math.max(minLure, Math.min(maxLure, settings.lure ?? maxLure));

  const lureSpan = maxLure - minLure || 1;
  const lureT = (lure - minLure) / lureSpan;
  const huntMin = hunt.minRespawnSec;
  const huntMax = hunt.maxRespawnSec;
  const baseSlow = huntMax ?? DEFAULT_MAX_INTERVAL_SEC;
  const baseFast = huntMin ?? DEFAULT_BASE_INTERVAL_SEC;
  let interval = baseSlow - lureT * (baseSlow - baseFast);

  const recLevel = Math.max(1, hunt.recommendedLevel ?? hunt.levelMin ?? 1);
  const charLevel = Math.max(1, settings.charLevel ?? recLevel);
  interval = applyRespawnLevelScale(interval, hunt, charLevel);

  const maxSec = (huntMax ?? baseSlow) * 1.1;
  const absoluteMin = huntMin ?? 1.5;
  return Math.max(absoluteMin, Math.min(maxSec, interval));
}

export function isManualRespawn(settings: XPCalcSettings): boolean {
  return typeof settings.respawnSec === 'number' && settings.respawnSec > 0;
}

/** Effective seconds per kill — wave interval split by creatures × parallel factor. */
export function respawnPerKillSeconds(
  respawnInterval: number,
  creatureCount: number,
  _manualFromClient = false,
): number {
  const n = Math.max(1, creatureCount);
  return respawnInterval / (n * LURE_PARALLEL_FACTOR);
}

export function cycleTimeSeconds(
  monsterHp: number,
  partyDps: number,
  respawnInterval: number,
  creatureCount = 1,
  manualFromClient = false,
): { killTime: number; cycleTime: number; respawnLimited: boolean; respawnPerKill: number } {
  const killTime = monsterHp / Math.max(1, partyDps);
  const respawnPerKill = respawnPerKillSeconds(respawnInterval, creatureCount, manualFromClient);
  const cycleTime = Math.max(killTime, respawnPerKill);
  return { killTime, cycleTime, respawnLimited: respawnPerKill >= killTime * 1.02, respawnPerKill };
}

export function cappedDpsForHunt(
  baseDps: number,
  monsters: Monster[],
  charLevel: number,
  recommendedLevel?: number,
  respawnInterval?: number,
  creatureCount = 1,
  dmgSharePct = 100,
  manualFromClient = false,
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
    const respawnPerKill = respawnPerKillSeconds(respawnInterval, creatureCount, manualFromClient);
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
  creatureCount: number,
  charLevel: number,
  recommendedLevel: number,
  manualFromClient = false,
): number {
  const respawnPerKill = respawnPerKillSeconds(respawnInterval, creatureCount, manualFromClient);
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
