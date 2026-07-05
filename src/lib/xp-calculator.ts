import type { Hunt, Monster, XPCalcSettings } from './types';
import {
  cappedDpsForHunt,
  cycleTimeSeconds,
  estimateRespawnInterval,
  huntCycleSeconds,
} from './respawn-model';

export const XP_DEFAULTS: XPCalcSettings = {
  dps: 50,
  speed: 220,
  boost: 1.0,
  stamina: 1.0,
  partySize: 1,
  dmgShare: 100,
  lure: null,
  charLevel: 50,
  totalItemSpeed: 0,
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

const PT_BONUS: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };

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
  partySize: number;
  shareInput: number;
  xpFraction: number;
  totalPartyDps: number;
  respawnInterval: number;
  respawnLimited: boolean;
}

export function computeXP(
  monsters: Monster[],
  huntMeta: Hunt,
  settings: XPCalcSettings,
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
  const lure = Math.max(1, Math.min(maxLure, settings.lure ?? maxLure));
  const respawnInterval = estimateRespawnInterval(huntMeta, { ...settings, lure, charLevel });

  const partySize = Math.max(1, Math.min(8, settings.partySize | 0 || 1));
  const shareInput = Math.max(1, Math.min(100, settings.dmgShare || 100)) / 100;
  const dmgSharePct = Math.round(shareInput * 100);
  const dps = cappedDpsForHunt(
    rawDps,
    monsters,
    charLevel,
    huntMeta.recommendedLevel,
    respawnInterval,
    lure,
    dmgSharePct,
  );
  const totalPartyDps = dps / Math.max(0.05, shareInput);

  const sharedCycle =
    charLevel >= recLevel + 20
      ? huntCycleSeconds(
          monsters,
          huntMeta.monsterWeights || {},
          totalPartyDps,
          respawnInterval,
          lure,
          charLevel,
          recLevel,
        )
      : null;
  const speedMul = Math.min(1.2, 1 + Math.max(0, settings.speed - 220) / 800);
  const lureMul = Math.min(1.0, 0.68 + lure * 0.05);
  const boost = Math.max(0.1, settings.boost) * Math.max(0.1, settings.stamina);

  const ptBonus = 1 + (PT_BONUS[partySize] || 0);
  const xpFraction = shareInput * ptBonus;

  let totalXpPerHour = 0;
  let anyRespawnLimited = false;
  const rows: XPRow[] = parts.map(({ m, w }) => {
    const share = w / totalWeight;
    const perMonster = cycleTimeSeconds(m.hp, totalPartyDps, respawnInterval, lure);
    const cycleTime = sharedCycle ?? perMonster.cycleTime;
    const killTime = perMonster.killTime;
    const respawnLimited = sharedCycle != null ? sharedCycle >= perMonster.respawnPerKill * 0.98 : perMonster.respawnLimited;
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
    partySize,
    shareInput,
    xpFraction,
    totalPartyDps,
    respawnInterval,
    respawnLimited: anyRespawnLimited,
  };
}

export function partyDmgShare(partySize: number): number {
  if (partySize <= 1) return 100;
  if (partySize === 2) return 50;
  return Math.round(100 / partySize);
}

export function loadXPSettings(huntId: number): XPCalcSettings {
  try {
    const raw = localStorage.getItem(`xpcalc:${huntId}`);
    if (raw) return { ...XP_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  try {
    const g = localStorage.getItem('xpcalc:global');
    if (g) return { ...XP_DEFAULTS, ...JSON.parse(g) };
  } catch {
    /* ignore */
  }
  return { ...XP_DEFAULTS };
}

export function saveXPSettings(huntId: number, s: XPCalcSettings): void {
  try {
    localStorage.setItem(`xpcalc:${huntId}`, JSON.stringify(s));
    localStorage.setItem('xpcalc:global', JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
