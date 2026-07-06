import type { CoinOrder, CoinOrderStatus } from './types';

const STORAGE_KEY = 'opala-coins-orders';
const MAX_SAVED = 10;

export interface SavedCoinOrder {
  accessToken: string;
  type: CoinOrder['type'];
  characterName: string;
  coinAmount: number;
  brlAmount: number;
  createdAt: string;
  status: CoinOrderStatus;
}

function readAll(): SavedCoinOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SavedCoinOrder>[];
    return Array.isArray(parsed)
      ? parsed.map((o) => ({
          accessToken: o.accessToken ?? '',
          type: o.type ?? 'buy',
          characterName: o.characterName ?? '',
          coinAmount: o.coinAmount ?? 0,
          brlAmount: o.brlAmount ?? 0,
          createdAt: o.createdAt ?? '',
          status: o.status ?? 'pending_payment',
        }))
      : [];
  } catch {
    return [];
  }
}

function writeAll(orders: SavedCoinOrder[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, MAX_SAVED)));
}

function toSavedEntry(order: CoinOrder): SavedCoinOrder {
  return {
    accessToken: order.accessToken,
    type: order.type,
    characterName: order.characterName,
    coinAmount: order.coinAmount,
    brlAmount: order.brlAmount,
    createdAt: order.createdAt,
    status: order.status,
  };
}

export function rememberOrder(order: CoinOrder): void {
  const entry = toSavedEntry(order);
  const rest = readAll().filter((o) => o.accessToken !== entry.accessToken);
  writeAll([entry, ...rest]);
}

/** Atualiza um pedido salvo sem mudar a ordem da lista. */
export function updateSavedOrder(order: CoinOrder): void {
  const entry = toSavedEntry(order);
  const all = readAll();
  const idx = all.findIndex((o) => o.accessToken === entry.accessToken);
  if (idx === -1) return;
  all[idx] = entry;
  writeAll(all);
}

export function replaceSavedOrders(orders: SavedCoinOrder[]): void {
  writeAll(orders);
}

export function getSavedOrders(): SavedCoinOrder[] {
  return readAll();
}

export function getLastOrderToken(): string | null {
  return readAll()[0]?.accessToken ?? null;
}
