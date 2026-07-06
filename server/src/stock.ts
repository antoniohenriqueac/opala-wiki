import { getDb } from './db.js';

export interface StockInfo {
  total: number;
  reserved: number;
  available: number;
}

const BUY_RESERVE_STATUSES = ['pending_payment', 'paid', 'processing'] as const;

function ensureSettings(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('stock_coins') as
    | { value: string }
    | undefined;
  if (!row) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(
      'stock_coins',
      String(process.env.DEFAULT_STOCK_COINS ?? '0'),
    );
  }
}

export function getStockTotal(): number {
  ensureSettings();
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get('stock_coins') as
    | { value: string }
    | undefined;
  return Number(row?.value ?? 0);
}

export function setStockTotal(total: number): void {
  if (!Number.isFinite(total) || total < 0) {
    throw new Error('Estoque inválido');
  }
  ensureSettings();
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES ('stock_coins', @value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run({ value: String(Math.floor(total)) });
}

export function getReservedCoins(): number {
  const placeholders = BUY_RESERVE_STATUSES.map(() => '?').join(', ');
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(coin_amount), 0) AS s FROM orders
       WHERE type = 'buy' AND status IN (${placeholders})`,
    )
    .get(...BUY_RESERVE_STATUSES) as { s: number };
  return row.s;
}

export function getStockInfo(): StockInfo {
  const total = getStockTotal();
  const reserved = getReservedCoins();
  return {
    total,
    reserved,
    available: Math.max(0, total - reserved),
  };
}

export function assertStockForBuy(amount: number): void {
  const { available } = getStockInfo();
  if (amount > available) {
    throw new Error(
      `Estoque insuficiente. Disponível: ${available.toLocaleString('pt-BR')} coins.`,
    );
  }
}

/** Deduct delivered coins from inventory. Returns warning if stock was lower than order. */
export function onBuyOrderCompleted(coinAmount: number): string | null {
  const total = getStockTotal();
  const next = Math.max(0, total - coinAmount);
  setStockTotal(next);
  if (coinAmount > total) {
    return `Estoque era ${total.toLocaleString('pt-BR')} coins; entregues ${coinAmount.toLocaleString('pt-BR')}. Atualize o estoque na aba Estoque.`;
  }
  return null;
}

export function onSellOrderCompleted(coinAmount: number): void {
  setStockTotal(getStockTotal() + coinAmount);
}

export function packageCanBuy(coinAmount: number, available?: number): boolean {
  const avail = available ?? getStockInfo().available;
  return coinAmount <= avail;
}
