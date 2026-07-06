import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatStaminaTime,
  normalizeStaminaHours,
  migrateLegacyStaminaHours,
  valueForHuntDuration,
  STAMINA_DEFAULT_HOURS,
  STAMINA_MAX_HOURS,
} from './stamina-model.ts';
import {
  rawXpForHuntDuration,
  displayRawXp,
  displayRealXpRange,
  xpForHuntDuration,
  displayXpPerHour,
} from './xp-boost.ts';
import {
  applyGainRate,
  computeXP,
  computeXPRange,
  partyDmgShare,
  patchPartySize,
  XP_DEFAULTS,
} from './xp-calculator.ts';
import {
  estimateRespawnInterval,
  lureCreatureInterval,
  lureSelectOptions,
  maxCreaturesForHunt,
} from './respawn-model.ts';
import { buildCalcSettings, computeHuntMetrics, huntMonsters } from './hunt-metrics.ts';
import type { Hunt, Monster } from './types.ts';
import { readFileSync } from 'fs';

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
  { id: 137, name: 'Orc Berserker', image: 'x', hp: 210, xp: 195, goldCoins: { min: 0, max: 30 } },
  { id: 138, name: 'Orc Shaman', image: 'x', hp: 115, xp: 110, goldCoins: { min: 0, max: 20 } },
  { id: 139, name: 'Orc Leader', image: 'x', hp: 450, xp: 270, goldCoins: { min: 0, max: 55 } },
];

function settingsFor(level: number, party = 4) {
  return {
    ...buildCalcSettings(party as 4, level, 'ALL', orcFortress),
    lure: 6,
    charLevel: level,
    stamina: 1,
  };
}

describe('hunt duration model', () => {
  it('formats time like the client', () => {
    assert.equal(formatStaminaTime(10 + 14 / 60), '10:14');
  });

  it('scales totals linearly (rate/h unchanged)', () => {
    assert.equal(valueForHuntDuration(100_000, 1), 100_000);
    assert.equal(valueForHuntDuration(100_000, 2), 200_000);
    assert.equal(valueForHuntDuration(100_000, 12), 1_200_000);
  });

  it('1 hour stays 1 hour (not legacy 1.0× → 10h)', () => {
    assert.equal(normalizeStaminaHours(1), 1);
    assert.equal(migrateLegacyStaminaHours(1), 1);
    assert.equal(migrateLegacyStaminaHours(10), STAMINA_DEFAULT_HOURS);
  });

  it('defaults to 1h when missing', () => {
    assert.equal(normalizeStaminaHours(undefined), STAMINA_DEFAULT_HOURS);
    assert.equal(XP_DEFAULTS.stamina, STAMINA_DEFAULT_HOURS);
    assert.equal(XP_DEFAULTS.gainRate, 120);
  });
});

describe('lure select options', () => {
  it('Stone Golems minLure 2 maxLure 3 → two tiers, MAX 4', () => {
    const hunt: Hunt = { id: 90, title: 'Stone Golems', monsters: [163, 227], minLure: 2, maxLure: 3 };
    const opts = lureSelectOptions(hunt);
    assert.equal(opts.length, 2);
    assert.equal(opts[0].label, 'Lure 2 a 3');
    assert.equal(opts[1].label, 'Lure 3 a 4');
    assert.equal(maxCreaturesForHunt(hunt), 4);
  });
});

describe('lure creature interval', () => {
  it('lure 3 → 3 to 4 creatures (client model)', () => {
    const hunt: Hunt = { id: 1, title: 'x', monsters: [1], maxLure: 3, minLure: 2 };
    assert.deepEqual(lureCreatureInterval(hunt, 3), { min: 3, max: 4 });
  });

  it('lure 2 → 2 to 3 creatures', () => {
    const hunt: Hunt = { id: 1, title: 'x', monsters: [1], maxLure: 3, minLure: 2 };
    assert.deepEqual(lureCreatureInterval(hunt, 2), { min: 2, max: 3 });
  });

  it('respects minLure clamp', () => {
    const hunt: Hunt = { id: 1, title: 'x', monsters: [1], maxLure: 3, minLure: 2 };
    assert.deepEqual(lureCreatureInterval(hunt, 1), { min: 2, max: 3 });
  });
});

describe('xp boost', () => {
  it('adds +50% gain rate for 1h with premium 120% → 170%', () => {
    assert.equal(xpForHuntDuration(100_000, 1, 120, true), 170_000);
    assert.equal(xpForHuntDuration(100_000, 3, 120, true), 410_000);
    assert.equal(xpForHuntDuration(100_000, 3, 120, false), 360_000);
    assert.equal(displayXpPerHour(100_000, 120), 120_000);
  });

  it('legacy raw boost still adds +50% on raw only', () => {
    assert.equal(rawXpForHuntDuration(100_000, 1, true), 150_000);
    assert.equal(rawXpForHuntDuration(100_000, 3, true), 350_000);
    assert.equal(rawXpForHuntDuration(100_000, 3, false), 300_000);
    assert.equal(displayRawXp(120_000, 12, true), 1_500_000);
  });
});

describe('gain rate', () => {
  it('scales premium xp total with gain rate and boost', () => {
    const rawLow = 100_000;
    const rawHigh = 120_000;
    const real = displayRealXpRange(rawLow, rawHigh, 1, false, 120);
    assert.equal(applyGainRate(rawLow, 120), 120_000);
    assert.equal(real.low, 120_000);
    assert.equal(real.high, 144_000);
    const boosted = displayRealXpRange(rawLow, rawHigh, 1, true, 120);
    assert.equal(boosted.low, 170_000);
  });
});

describe('manual respawn', () => {
  it('uses respawnSec directly', () => {
    const hunt: Hunt = { id: 1, title: 'x', monsters: [1], maxLure: 3 };
    const estimated = estimateRespawnInterval(hunt, {
      ...XP_DEFAULTS,
      lure: 3,
      charLevel: 64,
    });
    const manual = estimateRespawnInterval(hunt, {
      ...XP_DEFAULTS,
      lure: 3,
      charLevel: 64,
      respawnSec: 7,
    });
    assert.equal(manual, 7);
    assert.ok(estimated !== 7);
  });
});

describe('computeXPRange', () => {
  it('high >= low for lure with creature interval', () => {
    const range = computeXPRange(orcMonsters, orcFortress, settingsFor(60));
    assert.ok(range.xpPerHourHigh >= range.xpPerHourLow);
    assert.equal(range.xpPerHourMid, (range.xpPerHourLow + range.xpPerHourHigh) / 2);
  });

  it('range mid equals average of low and high creature counts', () => {
    const hunt: Hunt = { id: 1, title: 'x', monsters: [137], maxLure: 1 };
    const range = computeXPRange([orcMonsters[0]], hunt, {
      ...XP_DEFAULTS,
      lure: 1,
      charLevel: 60,
      dps: 100,
    });
    assert.ok(range.xpPerHourLow !== range.xpPerHourHigh);
    assert.equal(range.xpPerHourMid, (range.xpPerHourLow + range.xpPerHourHigh) / 2);
  });
});

describe('xp-calculator hunt duration', () => {
  it('raw xp/h does not change with hunt duration', () => {
    const s1 = { ...settingsFor(60), stamina: 1 };
    const s12 = { ...settingsFor(60), stamina: STAMINA_MAX_HOURS };
    const r1 = computeXP(orcMonsters, orcFortress, s1);
    const r12 = computeXP(orcMonsters, orcFortress, s12);
    assert.equal(r1.totalXpPerHour, r12.totalXpPerHour);
  });
});

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

  it('party size syncs dmg share and affects XP/h', () => {
    const solo = settingsFor(60);
    solo.partySize = 1;
    solo.dmgShare = 100;
    const duo = { ...settingsFor(60), partySize: 2, dmgShare: 50 };
    const rSolo = computeXP(orcMonsters, orcFortress, solo);
    const rDuo = computeXP(orcMonsters, orcFortress, duo);
    assert.ok(rDuo.totalXpPerHour < rSolo.totalXpPerHour);
    assert.equal(patchPartySize(2).dmgShare, 50);
    assert.equal(patchPartySize(4).dmgShare, 25);
  });
});

describe('Stone Golems sanity (lvl 64, respawn 7s, lure 3)', () => {
  it('raw xp/h mid near in-game ~173k; premium 120% ~200–220k/h', () => {
    const raw = readFileSync('public/data/wiki_data.js', 'utf8');
    const wiki = JSON.parse(raw.match(/window\.WIKI_DATA = (\{.*\});/s)![1]);
    const monById = Object.fromEntries(wiki.monsters.map((m: Monster) => [m.id, m]));
    const hunt = wiki.hunts.find((h: Hunt) => h.id === 90);
    const mons = huntMonsters(hunt, monById);
    const itemById = Object.fromEntries(wiki.items.map((i: { id: number }) => [i.id, i]));

    const settings = {
      ...buildCalcSettings(1, 64, 'ALL', hunt),
      dps: 100,
      speed: 240,
      lure: 3,
      stamina: 1,
      respawnSec: 7,
      gainRate: 120,
    };

    const metrics = computeHuntMetrics(hunt, mons, itemById, settings);
    const premiumMid = applyGainRate(metrics.xpPerHour, 120);

    assert.ok(metrics.xpPerHour >= 165_000, `mid raw ${metrics.xpPerHour}`);
    assert.ok(metrics.xpPerHour <= 185_000, `mid raw ${metrics.xpPerHour}`);
    assert.ok(premiumMid >= 200_000 && premiumMid <= 220_000, `mid premium ${premiumMid}`);
  });
});

describe('hunt-metrics loot filter', () => {
  const itemById = {
    999: { id: 999, name: 'Gold Ring', image: 'x', npcSellPrice: 8000 },
  };
  const monWithLoot: Monster[] = [
    { ...orcMonsters[0], loot: [{ itemId: 999, chance: 10, maxCount: 1 }] },
    orcMonsters[1],
    orcMonsters[2],
  ];

  it('excluded loot reduces profitPerHour', () => {
    const s = settingsFor(60);
    const full = computeHuntMetrics(orcFortress, monWithLoot, itemById, s);
    const filtered = computeHuntMetrics(orcFortress, monWithLoot, itemById, s, {
      excludedLootIds: new Set([999]),
    });
    assert.ok(filtered.profitPerHour < full.profitPerHour);
    assert.equal(filtered.profitPerHourBase, full.profitPerHour);
    assert.ok(filtered.profitLootPerHour < full.profitLootPerHour);
  });

  it('excluding one item keeps gold unchanged', () => {
    const s = settingsFor(60);
    const full = computeHuntMetrics(orcFortress, monWithLoot, itemById, s);
    const filtered = computeHuntMetrics(orcFortress, monWithLoot, itemById, s, {
      excludedLootIds: new Set([999]),
    });
    assert.equal(Math.round(full.profitGoldPerHour), Math.round(filtered.profitGoldPerHour));
  });

  it('all loot excluded leaves only gold da kill', () => {
    const s = settingsFor(60);
    const full = computeHuntMetrics(orcFortress, monWithLoot, itemById, s);
    const filtered = computeHuntMetrics(orcFortress, monWithLoot, itemById, s, {
      excludedLootIds: new Set([999]),
    });
    assert.equal(Math.round(filtered.profitLootPerHour), 0);
    assert.ok(filtered.profitGoldPerHour > 0);
    assert.equal(Math.round(filtered.profitPerHour), Math.round(filtered.profitGoldPerHour));
  });

  it('Tarantula wiki gold average is 20 gp/kill', () => {
    const s = settingsFor(60);
    const mon: Monster = {
      id: 1,
      name: 'Tarantula',
      image: 'x',
      hp: 225,
      xp: 120,
      goldCoins: { min: 0, max: 40 },
    };
    const hunt: Hunt = { id: 10, title: 'Tarantula', monsters: [1] };
    const m = computeHuntMetrics(hunt, [mon], {}, s);
    assert.equal(m.goldGpPerKillWiki, 20);
  });
});
