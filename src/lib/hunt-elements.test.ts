import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getHuntBestElements } from './hunt-elements.ts';
import type { Hunt, Monster } from './types.ts';

const squire: Monster = {
  id: 44,
  name: 'Vicious Squire',
  image: 'x',
  hp: 100,
  xp: 100,
  elementalResistances: {
    FIRE: 0.7,
    ICE: 0.9,
    ENERGY: 0.6,
    EARTH: 0.5,
    HOLY: 0.5,
    DEATH: 1.2,
  },
};

const bonebeast: Monster = {
  id: 49,
  name: 'Bonebeast',
  image: 'x',
  hp: 100,
  xp: 100,
  elementalResistances: {
    FIRE: 1.1,
    ICE: 1,
    ENERGY: 1,
    EARTH: 0,
    HOLY: 1.25,
    DEATH: 0,
  },
};

const heroFortress: Hunt = {
  id: 32,
  title: 'Hero Fortress',
  monsters: [44, 49],
  monsterWeights: { '49': 39.83 },
};

describe('getHuntBestElements', () => {
  it('Hero Fortress → Holy and Fire (no Earth/Death — immune on Bonebeast)', () => {
    const best = getHuntBestElements(heroFortress, [squire, bonebeast], 3);
    const keys = best.map((b) => b.key);
    assert.deepEqual(keys.slice(0, 2), ['HOLY', 'FIRE']);
    assert.ok(!keys.includes('EARTH'));
    assert.ok(!keys.includes('DEATH'));
  });

  it('returns empty when no resistance data', () => {
    const m: Monster = { id: 1, name: 'Slime', image: 'x', hp: 1, xp: 1 };
    assert.deepEqual(getHuntBestElements({ id: 1, title: 'X', monsters: [1] }, [m]), []);
  });
});
