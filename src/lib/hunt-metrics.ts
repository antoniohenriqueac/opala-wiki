import type { Hunt, Item, Monster, PartySize, Vocation, XPCalcSettings } from './types';
import { computeXP, partyDmgShare, XP_DEFAULTS } from './xp-calculator';
import { cycleTimeSeconds, estimateRespawnInterval, cappedDpsForHunt, huntCycleSeconds } from './respawn-model';

export interface HuntMetricsOptions {
  excludedLootIds?: Set<number>;
}

export interface HuntMetrics {
  hunt: Hunt;
  monsters: Monster[];
  xpPerHour: number;
  profitPerHour: number;
  profitPerHourBase: number;
  avgXpPerKill: number;
  respawnInterval: number;
  respawnLimited: boolean;
}

function avgGold(m: Monster): number {
  const g = m.goldCoins;
  if (!g) return 0;
  return (g.min + g.max) / 2;
}

export function avgLootValuePerKill(
  m: Monster,
  itemById: Record<number, Item>,
  excludedItemIds?: Set<number>,
): number {
  let total = 0;
  for (const d of m.loot || []) {
    if (excludedItemIds?.has(d.itemId)) continue;
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

interface HuntProfitContext {
  hunt: Hunt;
  monsters: Monster[];
  settings: XPCalcSettings;
  totalWeight: number;
  totalPartyDps: number;
  sharedCycle: number | null;
  respawnInterval: number;
  lure: number;
  speedMul: number;
  lureMul: number;
  boost: number;
}

function buildHuntProfitContext(
  hunt: Hunt,
  monsters: Monster[],
  settings: XPCalcSettings,
): HuntProfitContext {
  const charLevel = settings.charLevel ?? hunt.recommendedLevel ?? 50;
  const recLevel = hunt.recommendedLevel ?? hunt.levelMin ?? 50;
  const rawDps = Math.max(1, settings.dps);
  const maxLure = Math.max(1, hunt.maxLure || 1);
  const lure = Math.max(1, Math.min(maxLure, settings.lure ?? maxLure));
  const respawnInterval = estimateRespawnInterval(hunt, { ...settings, lure, charLevel });
  const shareInput = Math.max(1, Math.min(100, settings.dmgShare || 100)) / 100;
  const dmgSharePct = Math.round(shareInput * 100);
  const dps = cappedDpsForHunt(
    rawDps,
    monsters,
    charLevel,
    hunt.recommendedLevel,
    respawnInterval,
    lure,
    dmgSharePct,
  );
  const totalPartyDps = dps / Math.max(0.05, shareInput);
  const sharedCycle =
    charLevel >= recLevel + 20
      ? huntCycleSeconds(
          monsters,
          hunt.monsterWeights || {},
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

  let totalWeight = 0;
  for (const m of monsters) totalWeight += getWeight(hunt, m.id);
  if (!totalWeight) totalWeight = monsters.length || 1;

  return {
    hunt,
    monsters,
    settings,
    totalWeight,
    totalPartyDps,
    sharedCycle,
    respawnInterval,
    lure,
    speedMul,
    lureMul,
    boost,
  };
}

/** Expected NPC gp/h from one loot item across all hunt monsters (current calc settings). */
export function computeLootItemProfitPerHour(
  hunt: Hunt,
  monsters: Monster[],
  itemId: number,
  itemById: Record<number, Item>,
  settings: XPCalcSettings,
): number {
  const it = itemById[itemId];
  const price = it?.npcSellPrice ?? 0;
  if (!price) return 0;

  const ctx = buildHuntProfitContext(hunt, monsters, settings);
  let profitPerHour = 0;

  for (const m of ctx.monsters) {
    const drop = (m.loot || []).find((d) => d.itemId === itemId);
    if (!drop) continue;
    const w = getWeight(ctx.hunt, m.id);
    const share = w / ctx.totalWeight;
    const { cycleTime: perMonsterCycle } = cycleTimeSeconds(
      m.hp,
      ctx.totalPartyDps,
      ctx.respawnInterval,
      ctx.lure,
    );
    const cycleTime = ctx.sharedCycle ?? perMonsterCycle;
    const kills_h = 3600 / cycleTime;
    const expectedGp =
      price * ((drop.chance || 0) / 100) * (drop.maxCount || 1);
    profitPerHour += kills_h * expectedGp * share * ctx.lureMul * ctx.speedMul * ctx.boost;
  }

  return profitPerHour;
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
  hunt?: Hunt,
  totalItemSpeed = 0,
): XPCalcSettings {
  const baseDps = Math.max(20, Math.round(charLevel * 1.2 * (VOCATION_DPS[vocation] || 1)));
  return {
    ...XP_DEFAULTS,
    dps: baseDps,
    charLevel,
    totalItemSpeed,
    speed: 220 + Math.min(80, Math.floor(charLevel / 5)),
    partySize,
    dmgShare: partyDmgShare(partySize),
    lure: hunt?.maxLure ?? null,
  };
}

function profitForMonsters(
  hunt: Hunt,
  monsters: Monster[],
  itemById: Record<number, Item>,
  settings: XPCalcSettings,
  excludedItemIds?: Set<number>,
): number {
  const ctx = buildHuntProfitContext(hunt, monsters, settings);
  let profitPerHour = 0;
  for (const m of ctx.monsters) {
    const w = getWeight(ctx.hunt, m.id);
    const share = w / ctx.totalWeight;
    const { cycleTime: perMonsterCycle } = cycleTimeSeconds(
      m.hp,
      ctx.totalPartyDps,
      ctx.respawnInterval,
      ctx.lure,
    );
    const cycleTime = ctx.sharedCycle ?? perMonsterCycle;
    const kills_h = 3600 / cycleTime;
    const goldPerKill = avgGold(m) + avgLootValuePerKill(m, itemById, excludedItemIds);
    profitPerHour += kills_h * goldPerKill * share * ctx.lureMul * ctx.speedMul * ctx.boost;
  }
  return profitPerHour;
}

export function computeHuntMetrics(
  hunt: Hunt,
  monsters: Monster[],
  itemById: Record<number, Item>,
  settings: XPCalcSettings,
  options: HuntMetricsOptions = {},
): HuntMetrics {
  const xpResult = computeXP(monsters, hunt, settings);
  const profitPerHourBase = profitForMonsters(hunt, monsters, itemById, settings);
  const profitPerHour = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    options.excludedLootIds,
  );

  let totalWeight = 0;
  for (const m of monsters) totalWeight += getWeight(hunt, m.id);
  if (!totalWeight) totalWeight = monsters.length || 1;

  let weightedXp = 0;
  for (const m of monsters) {
    const w = getWeight(hunt, m.id);
    weightedXp += m.xp * (w / totalWeight);
  }

  return {
    hunt,
    monsters,
    xpPerHour: xpResult.totalXpPerHour,
    profitPerHour,
    profitPerHourBase,
    avgXpPerKill: weightedXp,
    respawnInterval: xpResult.respawnInterval,
    respawnLimited: xpResult.respawnLimited,
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

export function collectHuntLoot(
  hunt: Hunt,
  monById: Record<number, Monster>,
): { itemId: number; chance: number; maxCount?: number; from: string }[] {
  const mons = huntMonsters(hunt, monById);
  const lootMap: Record<number, { itemId: number; chance: number; maxCount?: number; from: string }> =
    {};
  for (const mn of mons) {
    for (const d of mn.loot || []) {
      if (!d.itemId) continue;
      const cur = lootMap[d.itemId];
      if (!cur || (d.chance || 0) > cur.chance) {
        lootMap[d.itemId] = { ...d, from: mn.name };
      }
    }
  }
  return Object.values(lootMap).sort((a, b) => b.chance - a.chance);
}
