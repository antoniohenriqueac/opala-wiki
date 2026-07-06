import type { CoinOrder, CoinPackage, CoinStock } from './types';

/** Env at build time, or Render sibling API (e.g. opala-wiki-1 → opala-wiki). */
function resolveCoinsApiBase(): string {
  const fromEnv = (import.meta.env.VITE_COINS_API_URL as string | undefined)?.replace(/\/$/, '');

  if (fromEnv && typeof window !== 'undefined') {
    try {
      // Build env apontando pro static site (sem API) — ignora e usa fallback
      if (new URL(fromEnv).hostname !== window.location.hostname) return fromEnv;
    } catch {
      return fromEnv;
    }
  } else if (fromEnv) {
    return fromEnv;
  }

  if (typeof window === 'undefined') return '';

  const { hostname, protocol } = window.location;
  const renderSibling = hostname.match(/^(.+)-\d+\.onrender\.com$/);
  if (renderSibling) {
    return `${protocol}//${renderSibling[1]}.onrender.com`;
  }

  return '';
}

const API_BASE = resolveCoinsApiBase();

function url(path: string): string {
  if (!API_BASE) throw new Error('VITE_COINS_API_URL não configurada');
  return `${API_BASE}${path}`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
  return data as T;
}

export function coinsApiConfigured(): boolean {
  return Boolean(API_BASE);
}

export function fetchShop(): Promise<{ packages: CoinPackage[]; stock: CoinStock }> {
  return api<{ packages: CoinPackage[]; stock: CoinStock }>('/api/packages');
}

export function fetchPackages(): Promise<CoinPackage[]> {
  return fetchShop().then((d) => d.packages);
}

export function createBuyOrder(body: {
  packageId: number;
  characterName: string;
  world?: string;
  contact: string;
}): Promise<CoinOrder> {
  return api<{ order: CoinOrder }>('/api/orders/buy', {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((d) => d.order);
}

export function createSellOrder(body: {
  packageId: number;
  characterName: string;
  world?: string;
  contact: string;
  pixKey: string;
}): Promise<CoinOrder> {
  return api<{ order: CoinOrder }>('/api/orders/sell', {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((d) => d.order);
}

export function fetchOrder(token: string): Promise<CoinOrder> {
  return api<{ order: CoinOrder }>(`/api/orders/${token}`).then((d) => d.order);
}

export function mockPayOrder(orderId: string): Promise<CoinOrder> {
  return api<{ order: CoinOrder }>(`/api/orders/${orderId}/mock-pay`, { method: 'POST' }).then(
    (d) => d.order,
  );
}

export function orderTrackUrl(token: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/coins?pedido=${token}`;
}

export function fmtBrl(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
