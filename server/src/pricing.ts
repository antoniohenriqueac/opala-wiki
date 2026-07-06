import { getDb } from './db.js';
import { validatePackagePricing } from './seed.js';
import type { OrderType, PackagePublic, PackageRow } from './types.js';
import { getStockInfo, packageCanBuy } from './stock.js';

export function savingsPct(official: number, sell: number): number {
  return Math.round(((official - sell) / official) * 1000) / 10;
}

export function toPackagePublic(row: PackageRow, available?: number): PackagePublic {
  const avail = available ?? getStockInfo().available;
  return {
    id: row.id,
    coinAmount: row.coin_amount,
    officialPriceBrl: row.official_price_brl,
    sellPriceBrl: row.sell_price_brl,
    buyPriceBrl: row.buy_price_brl,
    savingsPct: savingsPct(row.official_price_brl, row.sell_price_brl),
    marginBrl: Math.round((row.sell_price_brl - row.buy_price_brl) * 100) / 100,
    inStock: packageCanBuy(row.coin_amount, avail),
  };
}

export function getPackagesWithStock(): { packages: PackagePublic[]; stock: ReturnType<typeof getStockInfo> } {
  const stock = getStockInfo();
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM packages WHERE active = 1 ORDER BY sort_order ASC')
    .all() as PackageRow[];
  return {
    stock,
    packages: rows.map((r) => toPackagePublic(r, stock.available)),
  };
}

export function getActivePackages(): PackagePublic[] {
  return getPackagesWithStock().packages;
}

export function getPackageById(id: number): PackageRow | undefined {
  return getDb().prepare('SELECT * FROM packages WHERE id = ? AND active = 1').get(id) as
    | PackageRow
    | undefined;
}

export function calcOrderAmount(type: OrderType, pkg: PackageRow): number {
  return type === 'buy' ? pkg.sell_price_brl : pkg.buy_price_brl;
}

export function updatePackage(
  id: number,
  data: Partial<Pick<PackageRow, 'official_price_brl' | 'sell_price_brl' | 'buy_price_brl' | 'active'>>,
): PackageRow | undefined {
  const existing = getDb().prepare('SELECT * FROM packages WHERE id = ?').get(id) as PackageRow | undefined;
  if (!existing) return undefined;

  const official = data.official_price_brl ?? existing.official_price_brl;
  const sell = data.sell_price_brl ?? existing.sell_price_brl;
  const buy = data.buy_price_brl ?? existing.buy_price_brl;
  validatePackagePricing(official, sell, buy);

  getDb()
    .prepare(
      `UPDATE packages SET
        official_price_brl = @official_price_brl,
        sell_price_brl = @sell_price_brl,
        buy_price_brl = @buy_price_brl,
        active = @active
      WHERE id = @id`,
    )
    .run({
      id,
      official_price_brl: official,
      sell_price_brl: sell,
      buy_price_brl: buy,
      active: data.active ?? existing.active,
    });

  return getDb().prepare('SELECT * FROM packages WHERE id = ?').get(id) as PackageRow;
}

export function getAllPackagesAdmin(): PackagePublic[] {
  const stock = getStockInfo();
  const rows = getDb()
    .prepare('SELECT * FROM packages ORDER BY sort_order ASC')
    .all() as PackageRow[];
  return rows.map((r) => toPackagePublic(r, stock.available));
}
