import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  bonusVsBase,
  calcAllTiers,
  calcBrlPer1kk,
  calcGoldFromDonate,
  calcIdealBuyPerKk,
  calcTierResult,
  compareRmtQuote,
  DONATE_TIERS,
} from './rmt-kk-calculator.ts';

describe('calcGoldFromDonate', () => {
  it('500 coins × 50k gp = 25M gold', () => {
    assert.equal(calcGoldFromDonate(500, 50_000), 25_000_000);
  });

  it('returns 0 for invalid inputs', () => {
    assert.equal(calcGoldFromDonate(0, 50_000), 0);
    assert.equal(calcGoldFromDonate(500, 0), 0);
  });
});

describe('calcBrlPer1kk', () => {
  it('R$50 donate + 50k gp/coin → R$2/kk', () => {
    const gold = calcGoldFromDonate(500, 50_000);
    assert.equal(calcBrlPer1kk(50, gold), 2);
  });

  it('R$50 donate + 5850 gp/coin → ~R$17.09/kk (Coin Market)', () => {
    const gold = calcGoldFromDonate(500, 5_850);
    const perKk = calcBrlPer1kk(50, gold);
    assert.ok(Math.abs(perKk - 17.09) < 0.01);
  });

  it('R$100 donate + 5850 gp/coin → ~R$15.54/kk', () => {
    const gold = calcGoldFromDonate(1100, 5_850);
    const perKk = calcBrlPer1kk(100, gold);
    assert.ok(Math.abs(perKk - 15.54) < 0.01);
  });
});

describe('calcIdealBuyPerKk', () => {
  it('10% below equilibrium', () => {
    assert.equal(calcIdealBuyPerKk(17.09), 15.38);
  });
});

describe('bonusVsBase', () => {
  it('R$50 tier has no bonus (linear)', () => {
    assert.equal(bonusVsBase(500, 50), 0);
  });

  it('R$100 tier has 10% bonus', () => {
    assert.equal(bonusVsBase(1100, 100), 10);
  });

  it('R$1000 tier has 16% bonus', () => {
    assert.equal(bonusVsBase(11600, 1000), 16);
  });
});

describe('calcTierResult', () => {
  it('computes full result for R$50 tier', () => {
    const result = calcTierResult(DONATE_TIERS[2], 50_000);
    assert.equal(result.tier.donateBrl, 50);
    assert.equal(result.goldTotal, 25_000_000);
    assert.equal(result.brlPer1kk, 2);
    assert.equal(result.brlPer100k, 0.2);
    assert.equal(result.bonusPct, 0);
  });
});

describe('calcAllTiers', () => {
  it('R$100+ is cheaper per kk than R$50 at same buy offer', () => {
    const results = calcAllTiers(50_000);
    const r50 = results.find((r) => r.tier.donateBrl === 50)!;
    const r100 = results.find((r) => r.tier.donateBrl === 100)!;
    assert.ok(r100.brlPer1kk < r50.brlPer1kk);
  });
});

describe('compareRmtQuote', () => {
  it('marks at or below ideal as cheap', () => {
    assert.equal(compareRmtQuote(17.09, 15.38).verdict, 'cheap');
    assert.equal(compareRmtQuote(17.09, 14).verdict, 'cheap');
  });

  it('marks above equilibrium +10% as expensive', () => {
    assert.equal(compareRmtQuote(17.09, 19).verdict, 'expensive');
  });

  it('marks between ideal and equilibrium as fair', () => {
    assert.equal(compareRmtQuote(17.09, 16).verdict, 'fair');
    assert.equal(compareRmtQuote(17.09, 15.54).verdict, 'fair');
  });
});
