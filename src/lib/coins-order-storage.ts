import type { CoinOrder } from './types';

const STORAGE_KEY = 'opala-coins-orders';
const MAX_SAVED = 10;

export interface SavedCoinOrder {
  accessToken: string;
  type: CoinOrder['type'];
  characterName: string;
  coinAmount: number;
  brlAmount: number;
  createdAt: string;
}

function readAll(): SavedCoinOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCoinOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(orders: SavedCoinOrder[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, MAX_SAVED)));
}

export function rememberOrder(order: CoinOrder): void {
  const entry: SavedCoinOrder = {
    accessToken: order.accessToken,
    type: order.type,
    characterName: order.characterName,
    coinAmount: order.coinAmount,
    brlAmount: order.brlAmount,
    createdAt: order.createdAt,
  };
  const rest = readAll().filter((o) => o.accessToken !== entry.accessToken);
  writeAll([entry, ...rest]);
}

export function getSavedOrders(): SavedCoinOrder[] {
  return readAll();
}

export function getLastOrderToken(): string | null {
  return readAll()[0]?.accessToken ?? null;
}
