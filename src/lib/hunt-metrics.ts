import type { Hunt, Item, Monster, PartySize, Vocation, XPCalcSettings } from './types';
import { computeXP, partyDmgShare, XP_DEFAULTS } from './xp-calculator';

export interface HuntMetrics {
  hunt: Hunt;
  monsters: Monster[];
  xpPerHour: number;
  profitPerHour: number;
  avgXpPerKill: number;
}

function avgGold(m: Monster): number {
  const g = m.goldCoins;
  if (!g) return 0;
  return (g.min + g.max) / 2;
}

function avgLootValuePerKill(m: Monster, itemById: Record<number, Item>): number {
  let total = 0;
  for (const d of m.loot || []) {
    const it = itemById[d.itemId];
    if (!it) continue;
    const price = it.npcSellPrice || 0;
    const chance = (d.chance || 0) / 100;
    const cnt = d.maxCount || 1;
    total += price * chance * cnt;
  }
  return total;
}

function getWeight(hunt: Hunt, monsterId: number): number {
  const w = hunt.monsterWeights;
  if (!w) return 10;
  return w[String(monsterId)] ?? w[monsterId as unknown as string] ?? 10;
}

const VOCATION_DPS: Record<Vocation, number> = {
  ALL: 1,
  SORCERER: 1.1,
  DRUID: 1.05,
  PALADIN: 0.95,
  KNIGHT: 0.75,
};

export function buildCalcSettings(
  partySize: PartySize,
  charLevel: number,
  vocation: Vocation = 'ALL',
): XPCalcSettings {
  const baseDps = Math.max(20, Math.round(charLevel * 1.2 * (VOCATION_DPS[vocation] || 1)));
  return {
    ...XP_DEFAULTS,
    dps: baseDps,
    speed: 220 + Math.min(80, Math.floor(charLevel / 5)),
    partySize,
    dmgShare: partyDmgShare(partySize),
  };
}

export function computeHuntMetrics(
  hunt: Hunt,
  monsters: Monster[],
  itemById: Record<number, Item>,
  settings: XPCalcSettings,
): HuntMetrics {
  const xpResult = computeXP(monsters, hunt, settings);
  const totalPartyDps = xpResult.totalPartyDps;
  const lureMul = xpResult.lureMul;
  const speedMul = xpResult.speedMul;
  const boost = xpResult.boost;

  let totalWeight = 0;
  for (const m of monsters) totalWeight += getWeight(hunt, m.id);
  if (!totalWeight) totalWeight = monsters.length || 1;

  let profitPerHour = 0;
  let weightedXp = 0;
  for (const m of monsters) {
    const w = getWeight(hunt, m.id);
    const share = w / totalWeight;
    const timePerKill = m.hp / totalPartyDps;
    const kills_h = 3600 / timePerKill;
    const goldPerKill = avgGold(m) + avgLootValuePerKill(m, itemById);
    profitPerHour += kills_h * goldPerKill * share * lureMul * speedMul * boost;
    weightedXp += m.xp * share;
  }

  return {
    hunt,
    monsters,
    xpPerHour: xpResult.totalXpPerHour,
    profitPerHour,
    avgXpPerKill: weightedXp,
  };
}

export function huntMonsters(
  hunt: Hunt,
  monById: Record<number, Monster>,
): Monster[] {
  return (hunt.monsters || []).map((id) => monById[id]).filter(Boolean);
}

export function isHuntEligible(hunt: Hunt, charLevel: number): boolean {
  if (hunt.tutorialOnly) return false;
  const min = hunt.levelMin ?? hunt.recommendedLevel ?? 1;
  return charLevel >= min;
}
