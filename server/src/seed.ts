import { getDb } from './db.js';
import type { PackageRow } from './types.js';

/** Official Stonegy shop packages with suggested arbitrage prices. */
export const DEFAULT_PACKAGES: Omit<PackageRow, 'id' | 'active'>[] = [
  { coin_amount: 100, official_price_brl: 10, sell_price_brl: 9, buy_price_brl: 7.2, sort_order: 1 },
  { coin_amount: 300, official_price_brl: 30, sell_price_brl: 27, buy_price_brl: 21.6, sort_order: 2 },
  { coin_amount: 500, official_price_brl: 50, sell_price_brl: 45, buy_price_brl: 36, sort_order: 3 },
  { coin_amount: 1100, official_price_brl: 100, sell_price_brl: 90, buy_price_brl: 72, sort_order: 4 },
  { coin_amount: 2800, official_price_brl: 250, sell_price_brl: 225, buy_price_brl: 180, sort_order: 5 },
  { coin_amount: 5700, official_price_brl: 500, sell_price_brl: 450, buy_price_brl: 360, sort_order: 6 },
  { coin_amount: 9200, official_price_brl: 800, sell_price_brl: 720, buy_price_brl: 576, sort_order: 7 },
  { coin_amount: 11600, official_price_brl: 1000, sell_price_brl: 900, buy_price_brl: 720, sort_order: 8 },
];

export function validatePackagePricing(
  official: number,
  sell: number,
  buy: number,
): void {
  if (!(buy < sell && sell < official)) {
    throw new Error('Invalid pricing: require buy_price < sell_price < official_price');
  }
}

export function seedPackages(force = false): number {
  const db = getDb();
  const count = (db.prepare('SELECT COUNT(*) AS c FROM packages').get() as { c: number }).c;
  if (count > 0 && !force) return count;

  if (force) db.exec('DELETE FROM packages');

  const insert = db.prepare(`
    INSERT INTO packages (coin_amount, official_price_brl, sell_price_brl, buy_price_brl, sort_order, active)
    VALUES (@coin_amount, @official_price_brl, @sell_price_brl, @buy_price_brl, @sort_order, 1)
  `);

  const tx = db.transaction(() => {
    for (const pkg of DEFAULT_PACKAGES) {
      validatePackagePricing(pkg.official_price_brl, pkg.sell_price_brl, pkg.buy_price_brl);
      insert.run(pkg);
    }
  });
  tx();
  return DEFAULT_PACKAGES.length;
}
