import { query, queryOne } from './db.js';

export interface StockInfo {
  total: number;
  reserved: number;
  available: number;
}

const BUY_RESERVE_STATUSES = ['pending_payment', 'paid', 'processing'] as const;

export async function getStockTotal(): Promise<number> {
  const row = await queryOne<{ value: string }>(
    'SELECT value FROM settings WHERE key = $1',
    ['stock_coins'],
  );
  return Number(row?.value ?? 0);
}

export async function setStockTotal(total: number): Promise<void> {
  if (!Number.isFinite(total) || total < 0) {
    throw new Error('Estoque inválido');
  }
  await query(
    `INSERT INTO settings (key, value) VALUES ('stock_coins', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [String(Math.floor(total))],
  );
}

export async function getReservedCoins(): Promise<number> {
  const row = await queryOne<{ s: string }>(
    `SELECT COALESCE(SUM(coin_amount), 0)::text AS s FROM orders
     WHERE type = 'buy' AND status = ANY($1::text[])`,
    [BUY_RESERVE_STATUSES],
  );
  return Number(row?.s ?? 0);
}

export async function getStockInfo(): Promise<StockInfo> {
  const total = await getStockTotal();
  const reserved = await getReservedCoins();
  return {
    total,
    reserved,
    available: Math.max(0, total - reserved),
  };
}

export async function assertStockForBuy(amount: number): Promise<void> {
  const { available } = await getStockInfo();
  if (amount > available) {
    throw new Error(
      `Estoque insuficiente. Disponível: ${available.toLocaleString('pt-BR')} coins.`,
    );
  }
}

/** Deduct delivered coins from inventory. Returns warning if stock was lower than order. */
export async function onBuyOrderCompleted(coinAmount: number): Promise<string | null> {
  const total = await getStockTotal();
  const next = Math.max(0, total - coinAmount);
  await setStockTotal(next);
  if (coinAmount > total) {
    return `Estoque era ${total.toLocaleString('pt-BR')} coins; entregues ${coinAmount.toLocaleString('pt-BR')}. Atualize o estoque na aba Estoque.`;
  }
  return null;
}

export async function onSellOrderCompleted(coinAmount: number): Promise<void> {
  await setStockTotal((await getStockTotal()) + coinAmount);
}

export function packageCanBuy(coinAmount: number, available: number): boolean {
  return coinAmount <= available;
}
