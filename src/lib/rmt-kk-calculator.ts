/** Official Stonegy donate tiers (mirrors server/src/seed.ts DEFAULT_PACKAGES). */
export interface DonateTier {
  donateBrl: number;
  coinAmount: number;
}

export const DONATE_TIERS: DonateTier[] = [
  { donateBrl: 10, coinAmount: 100 },
  { donateBrl: 30, coinAmount: 300 },
  { donateBrl: 50, coinAmount: 500 },
  { donateBrl: 100, coinAmount: 1100 },
  { donateBrl: 250, coinAmount: 2800 },
  { donateBrl: 500, coinAmount: 5700 },
  { donateBrl: 800, coinAmount: 9200 },
  { donateBrl: 1000, coinAmount: 11600 },
];

export const BASE_COINS_PER_BRL = 10;

/** Typical top buy order on Stonegy Coin Market (gp per coin). */
export const DEFAULT_GOLD_PER_COIN = 6_000;

/** Target discount vs equilibrium when buying KK on RMT. */
export const RMT_IDEAL_ADVANTAGE_PCT = 10;

export type RmtVerdict = 'cheap' | 'fair' | 'expensive';

export interface TierResult {
  tier: DonateTier;
  bonusPct: number;
  goldTotal: number;
  brlPer100k: number;
  brlPer1kk: number;
}

export interface RmtComparison {
  verdict: RmtVerdict;
  pctDiff: number;
}

export function calcGoldFromDonate(coins: number, goldPerCoin: number): number {
  if (coins <= 0 || goldPerCoin <= 0) return 0;
  return coins * goldPerCoin;
}

export function calcBrlPer100k(donateBrl: number, goldTotal: number): number {
  if (donateBrl <= 0 || goldTotal <= 0) return 0;
  return donateBrl / (goldTotal / 100_000);
}

export function calcBrlPer1kk(donateBrl: number, goldTotal: number): number {
  if (donateBrl <= 0 || goldTotal <= 0) return 0;
  return donateBrl / (goldTotal / 1_000_000);
}

/** Bonus vs linear 10 coins/R$ (R$10 = 100 coins). */
export function bonusVsBase(coins: number, donateBrl: number): number {
  if (donateBrl <= 0) return 0;
  const linear = donateBrl * BASE_COINS_PER_BRL;
  if (linear <= 0) return 0;
  return Math.round(((coins / linear) - 1) * 1000) / 10;
}

export function calcTierResult(tier: DonateTier, goldPerCoin: number): TierResult {
  const goldTotal = calcGoldFromDonate(tier.coinAmount, goldPerCoin);
  return {
    tier,
    bonusPct: bonusVsBase(tier.coinAmount, tier.donateBrl),
    goldTotal,
    brlPer100k: calcBrlPer100k(tier.donateBrl, goldTotal),
    brlPer1kk: calcBrlPer1kk(tier.donateBrl, goldTotal),
  };
}

export function calcAllTiers(goldPerCoin: number): TierResult[] {
  return DONATE_TIERS.map((tier) => calcTierResult(tier, goldPerCoin));
}

/** Max R$/kk worth paying on RMT (equilibrium minus advantagePct). */
export function calcIdealBuyPerKk(
  equilibriumPerKk: number,
  advantagePct = RMT_IDEAL_ADVANTAGE_PCT,
): number {
  if (equilibriumPerKk <= 0) return 0;
  return Math.round(equilibriumPerKk * (1 - advantagePct / 100) * 100) / 100;
}

export function compareRmtQuote(baselinePerKk: number, quotedPerKk: number): RmtComparison {
  if (baselinePerKk <= 0 || quotedPerKk <= 0) {
    return { verdict: 'fair', pctDiff: 0 };
  }
  const pctDiff = Math.round(((quotedPerKk - baselinePerKk) / baselinePerKk) * 1000) / 10;
  const ideal = calcIdealBuyPerKk(baselinePerKk);
  let verdict: RmtVerdict = 'fair';
  if (quotedPerKk <= ideal) verdict = 'cheap';
  else if (quotedPerKk > baselinePerKk * 1.1) verdict = 'expensive';
  return { verdict, pctDiff };
}

export function fmtGoldKk(gold: number): string {
  if (gold <= 0) return '0 kk';
  const kk = gold / 1_000_000;
  if (kk >= 100) return `${Math.round(kk).toLocaleString('pt-BR')} kk`;
  if (kk >= 10) return `${kk.toFixed(1).replace('.', ',')} kk`;
  return `${kk.toFixed(2).replace('.', ',')} kk`;
}

export function fmtBrlRate(n: number): string {
  if (n <= 0) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
