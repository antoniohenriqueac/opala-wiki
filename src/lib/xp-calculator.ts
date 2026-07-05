import type { Hunt, Monster, XPCalcSettings } from './types';

export const XP_DEFAULTS: XPCalcSettings = {
  dps: 50,
  speed: 220,
  boost: 1.0,
  stamina: 1.0,
  partySize: 1,
  dmgShare: 100,
  lure: null,
};

export const XP_PRESETS: Record<string, Partial<XPCalcSettings> | null> = {
  custom: null,
  'Sorc lvl 30 (~30 dps)': { dps: 30, speed: 220 },
  'Sorc lvl 40 (~50 dps)': { dps: 50, speed: 220 },
  'Sorc lvl 60 (~100 dps)': { dps: 100, speed: 240 },
  'Sorc lvl 100 (~250 dps)': { dps: 250, speed: 260 },
  'Sorc lvl 150 (~500 dps)': { dps: 500, speed: 280 },
  'Druid lvl 60 (~120 dps)': { dps: 120, speed: 240 },
  'Paladin lvl 80 (~180 dps)': { dps: 180, speed: 250 },
  'Knight lvl 80 (~100 dps)': { dps: 100, speed: 245 },
  'End-game (~1500 dps)': { dps: 1500, speed: 320 },
};

const PT_BONUS: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };

export interface XPRow {
  id: number;
  name: string;
  hp: number;
  xp: number;
  xpReceived: number;
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

  const dps = Math.max(1, settings.dps);
  const maxLure = Math.max(1, huntMeta.maxLure || 1);
  const lure = Math.max(1, Math.min(maxLure, settings.lure ?? maxLure));
  const speedMul = Math.min(1.2, 1 + Math.max(0, settings.speed - 220) / 800);
  const lureMul = Math.min(1.0, 0.68 + lure * 0.05);
  const boost = Math.max(0.1, settings.boost) * Math.max(0.1, settings.stamina);

  const partySize = Math.max(1, Math.min(8, settings.partySize | 0 || 1));
  const shareInput = Math.max(1, Math.min(100, settings.dmgShare || 100)) / 100;
  const ptBonus = 1 + (PT_BONUS[partySize] || 0);
  const xpFraction = shareInput * ptBonus;
  const totalPartyDps = dps / Math.max(0.05, shareInput);

  let totalXpPerHour = 0;
  const rows: XPRow[] = parts.map(({ m, w }) => {
    const share = w / totalWeight;
    const timePerKillActual = m.hp / totalPartyDps;
    const kills_h = 3600 / timePerKillActual;
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
      timePerKill: timePerKillActual,
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
