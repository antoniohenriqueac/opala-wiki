import type { Item } from './types';

const STORAGE_KEY = 'lootfilter:';

export function loadExcludedLootIds(huntId: number): Set<number> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}${huntId}`);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

export function saveExcludedLootIds(huntId: number, ids: Set<number>): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}${huntId}`, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

const JUNK_NAMES = /rope|banana|orange|melon|cheese|meat|fish|mushroom|cherry|grape|cookie|bread/i;
const JUNK_MAX_NPC = 50;

export function isJunkItem(item: Item): boolean {
  const price = item.npcSellPrice ?? 0;
  if (price > 0 && price <= JUNK_MAX_NPC) return true;
  return JUNK_NAMES.test(item.name);
}

export function junkItemIds(items: Item[], itemIds: number[]): number[] {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  return itemIds.filter((id) => {
    const it = byId[id];
    return it && isJunkItem(it);
  });
}
