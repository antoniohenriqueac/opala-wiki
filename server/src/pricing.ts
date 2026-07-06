import { query, queryOne } from './db.js';
import { mapPackage } from './row-map.js';
import { validatePackagePricing } from './seed.js';
import type { OrderType, PackagePublic, PackageRow } from './types.js';
import { getStockInfo, packageCanBuy } from './stock.js';
import type { PgPackage } from './row-map.js';

export function savingsPct(official: number, sell: number): number {
  return Math.round(((official - sell) / official) * 1000) / 10;
}

export function toPackagePublic(row: PackageRow, available: number): PackagePublic {
  return {
    id: row.id,
    coinAmount: row.coin_amount,
    officialPriceBrl: row.official_price_brl,
    sellPriceBrl: row.sell_price_brl,
    buyPriceBrl: row.buy_price_brl,
    savingsPct: savingsPct(row.official_price_brl, row.sell_price_brl),
    marginBrl: Math.round((row.sell_price_brl - row.buy_price_brl) * 100) / 100,
    inStock: packageCanBuy(row.coin_amount, available),
  };
}

export async function getPackagesWithStock(): Promise<{
  packages: PackagePublic[];
  stock: Awaited<ReturnType<typeof getStockInfo>>;
}> {
  const stock = await getStockInfo();
  const rows = await query<PgPackage>(
    'SELECT * FROM packages WHERE active = TRUE ORDER BY sort_order ASC',
  );
  return {
    stock,
    packages: rows.map((r) => toPackagePublic(mapPackage(r), stock.available)),
  };
}

export async function getActivePackages(): Promise<PackagePublic[]> {
  const { packages } = await getPackagesWithStock();
  return packages;
}

export async function getPackageById(id: number): Promise<PackageRow | undefined> {
  const row = await queryOne<PgPackage>(
    'SELECT * FROM packages WHERE id = $1 AND active = TRUE',
    [id],
  );
  return row ? mapPackage(row) : undefined;
}

export function calcOrderAmount(type: OrderType, pkg: PackageRow): number {
  return type === 'buy' ? pkg.sell_price_brl : pkg.buy_price_brl;
}

export async function updatePackage(
  id: number,
  data: Partial<Pick<PackageRow, 'official_price_brl' | 'sell_price_brl' | 'buy_price_brl' | 'active'>>,
): Promise<PackageRow | undefined> {
  const existing = await queryOne<PgPackage>('SELECT * FROM packages WHERE id = $1', [id]);
  if (!existing) return undefined;

  const mapped = mapPackage(existing);
  const official = data.official_price_brl ?? mapped.official_price_brl;
  const sell = data.sell_price_brl ?? mapped.sell_price_brl;
  const buy = data.buy_price_brl ?? mapped.buy_price_brl;
  validatePackagePricing(official, sell, buy);

  const active = data.active ?? mapped.active;

  await query(
    `UPDATE packages SET
      official_price_brl = $1,
      sell_price_brl = $2,
      buy_price_brl = $3,
      active = $4
    WHERE id = $5`,
    [official, sell, buy, active === 1, id],
  );

  const updated = await queryOne<PgPackage>('SELECT * FROM packages WHERE id = $1', [id]);
  return updated ? mapPackage(updated) : undefined;
}

export async function getAllPackagesAdmin(): Promise<PackagePublic[]> {
  const stock = await getStockInfo();
  const rows = await query<PgPackage>('SELECT * FROM packages ORDER BY sort_order ASC');
  return rows.map((r) => toPackagePublic(mapPackage(r), stock.available));
}
