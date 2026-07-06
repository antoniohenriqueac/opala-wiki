import type { Hunt, Item, Monster, PartySize, Vocation, XPCalcSettings } from './types';
import { computeXPRange, computeXPEstimate, partyDmgShare, XP_DEFAULTS } from './xp-calculator';
import {
  cycleTimeSeconds,
  estimateRespawnInterval,
  cappedDpsForHunt,
  clampLureTier,
  huntCycleSeconds,
  isManualRespawn,
  lureCreatureInterval,
  respawnAverageSec,
  respawnBounds,
} from './respawn-model';

export interface HuntMetricsOptions {
  excludedLootIds?: Set<number>;
  /** Hunt Finder cards: xp/gp at avg respawn (min+max)/2, not the fast estimate. */
  cardPreview?: boolean;
}

export interface HuntMetrics {
  hunt: Hunt;
  monsters: Monster[];
  xpPerHour: number;
  xpPerHourLow: number;
  xpPerHourHigh: number;
  profitPerHour: number;
  profitPerHourLow: number;
  profitPerHourHigh: number;
  profitPerHourBase: number;
  profitPerHourBaseLow: number;
  profitPerHourBaseHigh: number;
  /** Direct gold coin drops (goldCoins field) — not affected by loot filter. */
  profitGoldPerHour: number;
  profitGoldPerHourLow: number;
  profitGoldPerHourHigh: number;
  /** Loot items only (wiki EV × NPC), after filter. */
  profitLootPerHour: number;
  profitLootPerHourLow: number;
  profitLootPerHourHigh: number;
  profitLootPerHourBase: number;
  profitLootPerHourBaseLow: number;
  profitLootPerHourBaseHigh: number;
  avgXpPerKill: number;
  respawnInterval: number;
  respawnIntervalMin: number;
  respawnIntervalMax: number;
  respawnLimited: boolean;
  creatureMin: number;
  creatureMax: number;
  killsPerHour: number;
  killsPerHourLow: number;
  killsPerHourHigh: number;
  /** Weighted (min+max)/2 from goldCoins — matches gold na BP / kills. */
  goldGpPerKillWiki: number;
  /** Loot EV per kill after filter (NPC wiki × chance). */
  lootGpPerKill: number;
  /** Loot EV per kill, all drops active. */
  lootGpPerKillBase: number;
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
  creatureCount: number,
  respawnIntervalOverride?: number,
): HuntProfitContext {
  const charLevel = settings.charLevel ?? hunt.recommendedLevel ?? 50;
  const recLevel = hunt.recommendedLevel ?? hunt.levelMin ?? 50;
  const rawDps = Math.max(1, settings.dps);
  const maxLure = Math.max(1, hunt.maxLure || 1);
  const lure = clampLureTier(hunt, settings.lure ?? maxLure);
  const respawnInterval =
    respawnIntervalOverride ??
    estimateRespawnInterval(hunt, { ...settings, lure, charLevel });
  const manualRespawn = isManualRespawn(settings);
  const shareInput = Math.max(1, Math.min(100, settings.dmgShare || 100)) / 100;
  const dmgSharePct = Math.round(shareInput * 100);
  const dps = cappedDpsForHunt(
    rawDps,
    monsters,
    charLevel,
    hunt.recommendedLevel,
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
          hunt.monsterWeights || {},
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

export function computeLootItemProfitPerHour(
  hunt: Hunt,
  monsters: Monster[],
  itemId: number,
  itemById: Record<number, Item>,
  settings: XPCalcSettings,
): number {
  const maxLure = Math.max(1, hunt.maxLure || 1);
  const lure = clampLureTier(hunt, settings.lure ?? maxLure);
  const { max } = lureCreatureInterval(hunt, lure);
  const it = itemById[itemId];
  const price = it?.npcSellPrice ?? 0;
  if (!price) return 0;

  const ctx = buildHuntProfitContext(hunt, monsters, settings, max);
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
      max,
      isManualRespawn(ctx.settings),
    );
    const cycleTime = ctx.sharedCycle ?? perMonsterCycle;
    const kills_h = 3600 / cycleTime;
    const expectedGp = price * ((drop.chance || 0) / 100) * (drop.maxCount || 1);
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
): XPCalcSettings {
  const baseDps = Math.max(20, Math.round(charLevel * 1.2 * (VOCATION_DPS[vocation] || 1)));
  return {
    ...XP_DEFAULTS,
    dps: baseDps,
    charLevel,
    speed: 220,
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
  creatureCount: number,
  excludedItemIds?: Set<number>,
  goldOnly = false,
  lootOnly = false,
  respawnIntervalOverride?: number,
): number {
  const ctx = buildHuntProfitContext(
    hunt,
    monsters,
    settings,
    creatureCount,
    respawnIntervalOverride,
  );
  let profitPerHour = 0;
  for (const m of ctx.monsters) {
    const w = getWeight(ctx.hunt, m.id);
    const share = w / ctx.totalWeight;
    const { cycleTime: perMonsterCycle } = cycleTimeSeconds(
      m.hp,
      ctx.totalPartyDps,
      ctx.respawnInterval,
      creatureCount,
      isManualRespawn(ctx.settings),
    );
    const cycleTime = ctx.sharedCycle ?? perMonsterCycle;
    const kills_h = 3600 / cycleTime;
    let goldPerKill = 0;
    if (!lootOnly) goldPerKill += avgGold(m);
    if (!goldOnly) goldPerKill += avgLootValuePerKill(m, itemById, excludedItemIds);
    profitPerHour += kills_h * goldPerKill * share * ctx.lureMul * ctx.speedMul * ctx.boost;
  }
  return profitPerHour;
}

function killsPerHourForCreatures(
  hunt: Hunt,
  monsters: Monster[],
  settings: XPCalcSettings,
  creatureCount: number,
  respawnIntervalOverride?: number,
): number {
  const ctx = buildHuntProfitContext(
    hunt,
    monsters,
    settings,
    creatureCount,
    respawnIntervalOverride,
  );
  let killsPerHour = 0;
  for (const m of ctx.monsters) {
    const w = getWeight(ctx.hunt, m.id);
    const share = w / ctx.totalWeight;
    const { cycleTime: perMonsterCycle } = cycleTimeSeconds(
      m.hp,
      ctx.totalPartyDps,
      ctx.respawnInterval,
      creatureCount,
      isManualRespawn(ctx.settings),
    );
    const cycleTime = ctx.sharedCycle ?? perMonsterCycle;
    killsPerHour += (3600 / cycleTime) * share;
  }
  return killsPerHour;
}

export function weightedWikiGoldPerKill(hunt: Hunt, monsters: Monster[]): number {
  let totalWeight = 0;
  let weighted = 0;
  for (const m of monsters) {
    const w = getWeight(hunt, m.id);
    totalWeight += w;
    weighted += avgGold(m) * w;
  }
  if (!totalWeight) totalWeight = monsters.length || 1;
  return weighted / totalWeight;
}

function lootGpPerKillForCreatures(
  hunt: Hunt,
  monsters: Monster[],
  itemById: Record<number, Item>,
  settings: XPCalcSettings,
  creatureCount: number,
  excludedItemIds?: Set<number>,
): number {
  let totalWeight = 0;
  let weighted = 0;
  for (const m of monsters) {
    const w = getWeight(hunt, m.id);
    totalWeight += w;
    weighted += avgLootValuePerKill(m, itemById, excludedItemIds) * w;
  }
  if (!totalWeight) totalWeight = monsters.length || 1;
  const ctx = buildHuntProfitContext(hunt, monsters, settings, creatureCount);
  return (weighted / totalWeight) * ctx.lureMul * ctx.speedMul * ctx.boost;
}

export function computeHuntMetrics(
  hunt: Hunt,
  monsters: Monster[],
  itemById: Record<number, Item>,
  settings: XPCalcSettings,
  options: HuntMetricsOptions = {},
): HuntMetrics {
  const xpRange = computeXPRange(monsters, hunt, settings);
  const maxLure = Math.max(1, hunt.maxLure || 1);
  const lure = clampLureTier(hunt, settings.lure ?? maxLure);
  const { min: creatureMin, max: creatureMax } = lureCreatureInterval(hunt, lure);
  const respawn = respawnBounds(hunt, settings);

  const profitBaseLow = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMin,
    undefined,
    false,
    false,
    respawn.maxSec,
  );
  const profitBaseHigh = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMax,
    undefined,
    false,
    false,
    respawn.minSec,
  );
  const profitFilteredLow = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMin,
    options.excludedLootIds,
    false,
    false,
    respawn.maxSec,
  );
  const profitFilteredHigh = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMax,
    options.excludedLootIds,
    false,
    false,
    respawn.minSec,
  );

  const profitGoldLow = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMin,
    undefined,
    true,
    false,
    respawn.maxSec,
  );
  const profitGoldHigh = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMax,
    undefined,
    true,
    false,
    respawn.minSec,
  );
  const profitLootBaseLow = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMin,
    undefined,
    false,
    true,
    respawn.maxSec,
  );
  const profitLootBaseHigh = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMax,
    undefined,
    false,
    true,
    respawn.minSec,
  );
  const profitLootFilteredLow = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMin,
    options.excludedLootIds,
    false,
    true,
    respawn.maxSec,
  );
  const profitLootFilteredHigh = profitForMonsters(
    hunt,
    monsters,
    itemById,
    settings,
    creatureMax,
    options.excludedLootIds,
    false,
    true,
    respawn.minSec,
  );

  let totalWeight = 0;
  for (const m of monsters) totalWeight += getWeight(hunt, m.id);
  if (!totalWeight) totalWeight = monsters.length || 1;

  let weightedXp = 0;
  for (const m of monsters) {
    const w = getWeight(hunt, m.id);
    weightedXp += m.xp * (w / totalWeight);
  }

  const killsLow = killsPerHourForCreatures(hunt, monsters, settings, creatureMin, respawn.maxSec);
  const killsHigh = killsPerHourForCreatures(hunt, monsters, settings, creatureMax, respawn.minSec);
  const killsMid = (killsLow + killsHigh) / 2;
  const goldGpPerKillWiki = weightedWikiGoldPerKill(hunt, monsters);
  const lootGpPerKill = lootGpPerKillForCreatures(
    hunt,
    monsters,
    itemById,
    settings,
    (creatureMin + creatureMax) / 2,
    options.excludedLootIds,
  );
  const lootGpPerKillBase = lootGpPerKillForCreatures(
    hunt,
    monsters,
    itemById,
    settings,
    (creatureMin + creatureMax) / 2,
  );

  const creatureMid = (creatureMin + creatureMax) / 2;

  if (options.cardPreview && !respawn.manual) {
    const avgSec = respawnAverageSec(respawn);
    const xpEst = computeXPEstimate(monsters, hunt, settings, avgSec, creatureMid);
    const profitEst = profitForMonsters(
      hunt,
      monsters,
      itemById,
      settings,
      creatureMid,
      options.excludedLootIds,
      false,
      false,
      avgSec,
    );
    const profitGoldEst = profitForMonsters(
      hunt,
      monsters,
      itemById,
      settings,
      creatureMid,
      undefined,
      true,
      false,
      avgSec,
    );
    const profitLootEst = profitForMonsters(
      hunt,
      monsters,
      itemById,
      settings,
      creatureMid,
      options.excludedLootIds,
      false,
      true,
      avgSec,
    );
    const killsEst = killsPerHourForCreatures(hunt, monsters, settings, creatureMid, avgSec);

    return {
      hunt,
      monsters,
      xpPerHour: xpEst.totalXpPerHour,
      xpPerHourLow: xpEst.totalXpPerHour,
      xpPerHourHigh: xpEst.totalXpPerHour,
      profitPerHour: profitEst,
      profitPerHourLow: profitEst,
      profitPerHourHigh: profitEst,
      profitPerHourBase: profitEst,
      profitPerHourBaseLow: profitEst,
      profitPerHourBaseHigh: profitEst,
      profitGoldPerHour: profitGoldEst,
      profitGoldPerHourLow: profitGoldEst,
      profitGoldPerHourHigh: profitGoldEst,
      profitLootPerHour: profitLootEst,
      profitLootPerHourLow: profitLootEst,
      profitLootPerHourHigh: profitLootEst,
      profitLootPerHourBase: profitLootEst,
      profitLootPerHourBaseLow: profitLootEst,
      profitLootPerHourBaseHigh: profitLootEst,
      avgXpPerKill: weightedXp,
      respawnInterval: avgSec,
      respawnIntervalMin: respawn.minSec,
      respawnIntervalMax: respawn.maxSec,
      respawnLimited: xpEst.respawnLimited,
      creatureMin,
      creatureMax,
      killsPerHour: killsEst,
      killsPerHourLow: killsEst,
      killsPerHourHigh: killsEst,
      goldGpPerKillWiki,
      lootGpPerKill,
      lootGpPerKillBase,
    };
  }

  return {
    hunt,
    monsters,
    xpPerHour: xpRange.xpPerHourMid,
    xpPerHourLow: xpRange.xpPerHourLow,
    xpPerHourHigh: xpRange.xpPerHourHigh,
    profitPerHour: (profitFilteredLow + profitFilteredHigh) / 2,
    profitPerHourLow: profitFilteredLow,
    profitPerHourHigh: profitFilteredHigh,
    profitPerHourBase: (profitBaseLow + profitBaseHigh) / 2,
    profitPerHourBaseLow: profitBaseLow,
    profitPerHourBaseHigh: profitBaseHigh,
    profitGoldPerHour: (profitGoldLow + profitGoldHigh) / 2,
    profitGoldPerHourLow: profitGoldLow,
    profitGoldPerHourHigh: profitGoldHigh,
    profitLootPerHour: (profitLootFilteredLow + profitLootFilteredHigh) / 2,
    profitLootPerHourLow: profitLootFilteredLow,
    profitLootPerHourHigh: profitLootFilteredHigh,
    profitLootPerHourBase: (profitLootBaseLow + profitLootBaseHigh) / 2,
    profitLootPerHourBaseLow: profitLootBaseLow,
    profitLootPerHourBaseHigh: profitLootBaseHigh,
    avgXpPerKill: weightedXp,
    respawnInterval: respawn.currentSec,
    respawnIntervalMin: respawn.minSec,
    respawnIntervalMax: respawn.maxSec,
    respawnLimited: xpRange.high.respawnLimited,
    creatureMin,
    creatureMax,
    killsPerHour: killsMid,
    killsPerHourLow: killsLow,
    killsPerHourHigh: killsHigh,
    goldGpPerKillWiki,
    lootGpPerKill,
    lootGpPerKillBase,
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
