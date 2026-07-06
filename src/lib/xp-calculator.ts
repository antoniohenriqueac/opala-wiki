import type { Hunt, Monster, XPCalcSettings } from './types';
import {
  cappedDpsForHunt,
  clampLureTier,
  cycleTimeSeconds,
  estimateRespawnInterval,
  huntCycleSeconds,
  isManualRespawn,
  lureCreatureInterval,
} from './respawn-model';
import {
  normalizeStaminaHours,
  migrateLegacyStaminaHours,
  STAMINA_DEFAULT_HOURS,
  STAMINA_MAX_HOURS,
} from './stamina-model';

export { STAMINA_MAX_HOURS, STAMINA_DEFAULT_HOURS };

/** Bump when persisted calc settings change shape (stamina is hours since v2). */
export const XP_SETTINGS_SCHEMA = 3;

type StoredXPSettings = Partial<XPCalcSettings> & { schema?: number };

export const XP_DEFAULTS: XPCalcSettings = {
  dps: 50,
  speed: 220,
  boost: 1.0,
  stamina: STAMINA_DEFAULT_HOURS,
  xpBoost: false,
  partySize: 1,
  dmgShare: 100,
  lure: null,
  charLevel: 50,
  gainRate: 120,
};

export const XP_PRESETS: Record<string, Partial<XPCalcSettings> | null> = {
  custom: null,
  'Sorc lvl 30 (~30 dps)': { dps: 30, speed: 220, charLevel: 30 },
  'Sorc lvl 40 (~50 dps)': { dps: 50, speed: 220, charLevel: 40 },
  'Sorc lvl 60 (~100 dps)': { dps: 100, speed: 240, charLevel: 60 },
  'Sorc lvl 100 (~250 dps)': { dps: 250, speed: 260, charLevel: 100 },
  'Sorc lvl 150 (~500 dps)': { dps: 500, speed: 280, charLevel: 150 },
  'Druid lvl 60 (~120 dps)': { dps: 120, speed: 240, charLevel: 60 },
  'Paladin lvl 80 (~180 dps)': { dps: 180, speed: 250, charLevel: 80 },
  'Knight lvl 80 (~100 dps)': { dps: 100, speed: 245, charLevel: 80 },
  'End-game (~1500 dps)': { dps: 1500, speed: 320, charLevel: 200 },
};

export interface XPRow {
  id: number;
  name: string;
  hp: number;
  xp: number;
  xpReceived: number;
  killTime: number;
  respawnInterval: number;
  cycleTime: number;
  respawnLimited: boolean;
  timePerKill: number;
  xph_solo: number;
  xph_hunt: number;
  share: number;
  weight: number;
}

export interface XPResult {
  rows: XPRow[];
  totalXpPerHour: number;
  speedMul: number;
  lureMul: number;
  boost: number;
  maxLure: number;
  lure: number;
  creatureCount: number;
  creatureMin: number;
  creatureMax: number;
  partySize: number;
  shareInput: number;
  xpFraction: number;
  totalPartyDps: number;
  respawnInterval: number;
  respawnLimited: boolean;
}

export interface XPRangeResult {
  low: XPResult;
  high: XPResult;
  mid: XPResult;
  xpPerHourLow: number;
  xpPerHourHigh: number;
  xpPerHourMid: number;
}

function computeXPWithCreatures(
  monsters: Monster[],
  huntMeta: Hunt,
  settings: XPCalcSettings,
  creatureCount: number,
): XPResult {
  const weights = huntMeta.monsterWeights || {};
  let totalWeight = 0;
  const parts = monsters.map((m) => {
    const w = weights[String(m.id)] ?? weights[m.id as unknown as string] ?? 10;
    totalWeight += w;
    return { m, w };
  });
  if (!totalWeight) totalWeight = monsters.length || 1;

  const charLevel = settings.charLevel ?? huntMeta.recommendedLevel ?? 50;
  const recLevel = huntMeta.recommendedLevel ?? huntMeta.levelMin ?? 50;
  const rawDps = Math.max(1, settings.dps);
  const maxLure = Math.max(1, huntMeta.maxLure || 1);
  const lure = clampLureTier(huntMeta, settings.lure ?? maxLure);
  const { min: creatureMin, max: creatureMax } = lureCreatureInterval(huntMeta, lure);
  const respawnInterval = estimateRespawnInterval(huntMeta, { ...settings, lure, charLevel });
  const manualRespawn = isManualRespawn(settings);

  const partySize = Math.max(1, Math.min(8, settings.partySize | 0 || 1));
  const shareInput = Math.max(1, Math.min(100, settings.dmgShare || 100)) / 100;
  const dmgSharePct = Math.round(shareInput * 100);
  const dps = cappedDpsForHunt(
    rawDps,
    monsters,
    charLevel,
    huntMeta.recommendedLevel,
    respawnInterval,
    creatureCount,
    dmgSharePct,
    manualRespawn,
  );
  const totalPartyDps = dps / Math.max(0.05, shareInput);

  const sharedCycle =
    charLevel >= recLevel + 20
      ? huntCycleSeconds(
          monsters,
          huntMeta.monsterWeights || {},
          totalPartyDps,
          respawnInterval,
          creatureCount,
          charLevel,
          recLevel,
          manualRespawn,
        )
      : null;
  const speedMul = Math.min(1.2, 1 + Math.max(0, settings.speed - 220) / 800);
  const lureMul = Math.min(1.0, 0.68 + lure * 0.05);
  const boost = Math.max(0.1, settings.boost);

  const xpFraction = shareInput;

  let totalXpPerHour = 0;
  let anyRespawnLimited = false;
  const rows: XPRow[] = parts.map(({ m, w }) => {
    const share = w / totalWeight;
    const perMonster = cycleTimeSeconds(
      m.hp,
      totalPartyDps,
      respawnInterval,
      creatureCount,
      manualRespawn,
    );
    const cycleTime = sharedCycle ?? perMonster.cycleTime;
    const killTime = perMonster.killTime;
    const respawnLimited =
      sharedCycle != null
        ? sharedCycle >= perMonster.respawnPerKill * 0.98
        : perMonster.respawnLimited;
    if (respawnLimited) anyRespawnLimited = true;
    const kills_h = 3600 / cycleTime;
    const xpReceived = m.xp * xpFraction;
    const xph_solo = kills_h * xpReceived;
    const xph_hunt = xph_solo * share * lureMul * speedMul * boost;
    totalXpPerHour += xph_hunt;
    return {
      id: m.id,
      name: m.name,
      hp: m.hp,
      xp: m.xp,
      xpReceived,
      killTime,
      respawnInterval,
      cycleTime,
      respawnLimited,
      timePerKill: cycleTime,
      xph_solo,
      xph_hunt,
      share,
      weight: w,
    };
  });
  rows.sort((a, b) => b.xph_hunt - a.xph_hunt);

  return {
    rows,
    totalXpPerHour,
    speedMul,
    lureMul,
    boost,
    maxLure,
    lure,
    creatureCount,
    creatureMin,
    creatureMax,
    partySize,
    shareInput,
    xpFraction,
    totalPartyDps,
    respawnInterval,
    respawnLimited: anyRespawnLimited,
  };
}

/** Single-point calc at max creatures in lure interval (breakdown table). */
export function computeXP(
  monsters: Monster[],
  huntMeta: Hunt,
  settings: XPCalcSettings,
): XPResult {
  const maxLure = Math.max(1, huntMeta.maxLure || 1);
  const lure = clampLureTier(huntMeta, settings.lure ?? maxLure);
  const { max: creatureMax } = lureCreatureInterval(huntMeta, lure);
  return computeXPWithCreatures(monsters, huntMeta, settings, creatureMax);
}

/** Raw xp/h range from min/max creatures pulled per respawn tick. */
export function computeXPRange(
  monsters: Monster[],
  huntMeta: Hunt,
  settings: XPCalcSettings,
): XPRangeResult {
  const maxLure = Math.max(1, huntMeta.maxLure || 1);
  const lure = clampLureTier(huntMeta, settings.lure ?? maxLure);
  const { min, max } = lureCreatureInterval(huntMeta, lure);
  const low = computeXPWithCreatures(monsters, huntMeta, settings, min);
  const high = computeXPWithCreatures(monsters, huntMeta, settings, max);
  const xpPerHourLow = low.totalXpPerHour;
  const xpPerHourHigh = high.totalXpPerHour;
  const xpPerHourMid = (xpPerHourLow + xpPerHourHigh) / 2;
  return {
    low,
    high,
    mid: high,
    xpPerHourLow,
    xpPerHourHigh,
    xpPerHourMid,
  };
}

export function partyDmgShare(partySize: number): number {
  if (partySize <= 1) return 100;
  if (partySize === 2) return 50;
  return Math.round(100 / partySize);
}

export function clampPartySize(partySize: number): number {
  return Math.max(1, Math.min(8, partySize | 0 || 1));
}

export function patchPartySize(partySize: number): Pick<XPCalcSettings, 'partySize' | 'dmgShare'> {
  const size = clampPartySize(partySize);
  return { partySize: size, dmgShare: partyDmgShare(size) };
}

function normalizeGainRate(raw: unknown): number {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : 120;
  return Math.max(1, Math.min(1000, n));
}

function normalizeRespawnSec(raw: unknown): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(120, n);
}

function mergeXPSettings(partial: StoredXPSettings): XPCalcSettings {
  const merged = { ...XP_DEFAULTS, ...partial };
  const schema = partial.schema ?? 1;
  merged.stamina =
    schema < 2
      ? migrateLegacyStaminaHours(partial.stamina)
      : normalizeStaminaHours(partial.stamina);
  merged.xpBoost = merged.xpBoost === true;
  merged.boost = 1.0;
  merged.gainRate = normalizeGainRate(partial.gainRate ?? merged.gainRate);
  merged.respawnSec = normalizeRespawnSec(partial.respawnSec);
  return merged;
}

export function loadXPSettings(huntId: number): XPCalcSettings {
  try {
    const raw = localStorage.getItem(`xpcalc:${huntId}`);
    if (raw) return mergeXPSettings(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  try {
    const g = localStorage.getItem('xpcalc:global');
    if (g) return mergeXPSettings(JSON.parse(g));
  } catch {
    /* ignore */
  }
  return { ...XP_DEFAULTS };
}

export function saveXPSettings(huntId: number, s: XPCalcSettings): void {
  try {
    const payload: StoredXPSettings = { ...s, schema: XP_SETTINGS_SCHEMA };
    localStorage.setItem(`xpcalc:${huntId}`, JSON.stringify(payload));
    localStorage.setItem('xpcalc:global', JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function applyGainRate(rawXp: number, gainRate?: number): number {
  const rate = normalizeGainRate(gainRate ?? 120);
  return Math.round(rawXp * (rate / 100));
}
