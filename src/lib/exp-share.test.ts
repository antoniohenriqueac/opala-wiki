import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeParty, canShareExp, expShareRange } from './exp-share.ts';

describe('expShareRange', () => {
  const cases: Array<[number, number, number]> = [
    [14, 10, 23],
    [15, 10, 23],
    [60, 40, 91],
    [100, 67, 151],
    [200, 134, 301],
  ];

  for (const [level, min, max] of cases) {
    it(`level ${level} → ${min}–${max}`, () => {
      assert.deepEqual(expShareRange(level), { min, max });
    });
  }
});

describe('canShareExp', () => {
  it('accepts members inside range for level 60', () => {
    assert.equal(canShareExp(60, 40), true);
    assert.equal(canShareExp(60, 91), true);
    assert.equal(canShareExp(60, 39), false);
    assert.equal(canShareExp(60, 92), false);
  });

  it('level 14 matches in-game range 10–23', () => {
    assert.deepEqual(expShareRange(14), { min: 10, max: 23 });
    assert.equal(canShareExp(14, 10), true);
    assert.equal(canShareExp(14, 23), true);
    assert.equal(canShareExp(14, 9), false);
  });
});

describe('analyzeParty', () => {
  it('flags out-of-range members', () => {
    const result = analyzeParty([
      { id: '1', name: 'Main', level: 100 },
      { id: '2', name: 'Druid', level: 85 },
      { id: '3', name: 'Low', level: 50 },
    ]);
    assert.ok(result);
    assert.equal(result.highestLevel, 100);
    assert.equal(result.allInRange, false);
    assert.equal(result.members.find((m) => m.name === 'Low')?.inRange, false);
    assert.equal(result.members.find((m) => m.name === 'Druid')?.inRange, true);
  });
});
