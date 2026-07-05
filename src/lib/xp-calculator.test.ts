import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeXP, partyDmgShare } from './xp-calculator.ts';
import { buildCalcSettings, computeHuntMetrics } from './hunt-metrics.ts';
import type { Hunt, Monster } from './types.ts';

const orcFortress: Hunt = {
  id: 68,
  title: 'Orc Fortress',
  monsters: [137, 138, 139],
  recommendedLevel: 40,
  levelMin: 15,
  maxLure: 6,
  minLure: 4,
  monsterWeights: { '138': 29.53, '139': 28.26 },
};

const orcMonsters: Monster[] = [
  { id: 137, name: 'Orc Berserker', image: 'x', hp: 210, xp: 195 },
  { id: 138, name: 'Orc Shaman', image: 'x', hp: 115, xp: 110 },
  { id: 139, name: 'Orc Leader', image: 'x', hp: 450, xp: 270 },
];

function settingsFor(level: number, party = 4) {
  return {
    ...buildCalcSettings(party as 4, level, 'ALL', orcFortress),
    lure: 6,
    charLevel: level,
  };
}

describe('xp-calculator respawn model', () => {
  it('Orc Fortress lvl 100 party 4 caps below 280k (not 349k+)', () => {
    const s = settingsFor(100);
    const r = computeXP(orcMonsters, orcFortress, s);
    assert.ok(r.totalXpPerHour <= 280_000, `got ${r.totalXpPerHour}`);
    assert.ok(r.respawnLimited);
  });

  it('Orc Fortress lvl 150 does not exceed lvl 100 by much', () => {
    const s100 = settingsFor(100);
    const s150 = settingsFor(150);
    const r100 = computeXP(orcMonsters, orcFortress, s100);
    const r150 = computeXP(orcMonsters, orcFortress, s150);
    assert.ok(r150.totalXpPerHour <= r100.totalXpPerHour * 1.15);
  });

  it('Orc Fortress lvl 40 party 4 stays in kill-limited range ~100-160k', () => {
    const s = settingsFor(40);
    const r = computeXP(orcMonsters, orcFortress, s);
    assert.ok(r.totalXpPerHour >= 90_000);
    assert.ok(r.totalXpPerHour <= 170_000);
  });

  it('BOH speed reduces respawn interval', () => {
    const base = settingsFor(60);
    const withBoh = { ...base, totalItemSpeed: 20 };
    const rBase = computeXP(orcMonsters, orcFortress, base);
    const rBoh = computeXP(orcMonsters, orcFortress, withBoh);
    assert.ok(rBoh.respawnInterval < rBase.respawnInterval);
    assert.ok(rBoh.totalXpPerHour >= rBase.totalXpPerHour);
  });

  it('partyDmgShare for party 4 is 25', () => {
    assert.equal(partyDmgShare(4), 25);
  });
});

describe('hunt-metrics loot filter', () => {
  it('excluded loot reduces profitPerHour', () => {
    const s = settingsFor(60);
    const itemById = {
      999: { id: 999, name: 'Gold Ring', image: 'x', npcSellPrice: 8000 },
    };
    const monWithLoot: Monster[] = [
      { ...orcMonsters[0], loot: [{ itemId: 999, chance: 10, maxCount: 1 }] },
      orcMonsters[1],
      orcMonsters[2],
    ];
    const full = computeHuntMetrics(orcFortress, monWithLoot, itemById, s);
    const filtered = computeHuntMetrics(orcFortress, monWithLoot, itemById, s, {
      excludedLootIds: new Set([999]),
    });
    assert.ok(filtered.profitPerHour < full.profitPerHour);
    assert.equal(filtered.profitPerHourBase, full.profitPerHour);
  });
});
