import type { Item } from './types';

export interface ItemFilterOptions {
  query?: string;
  slot?: string | null;
  weaponType?: string | null;
  rarity?: number | null;
  vocation?: string | null;
  levelMin?: number | null;
  levelMax?: number | null;
}

export function matchesLevelRange(item: Item, min?: number | null, max?: number | null): boolean {
  const req = item.levelMin ?? 0;
  if (min != null && min > 0 && req < min) return false;
  if (max != null && max > 0 && req > max) return false;
  return true;
}

export function matchesVocation(item: Item, vocation?: string | null): boolean {
  if (!vocation) return true;
  return (item.vocation || []).includes(vocation);
}

export function filterItems(items: Item[], opts: ItemFilterOptions): Item[] {
  const q = opts.query?.trim().toLowerCase();
  return items.filter((i) => {
    if (opts.slot && i.slot !== opts.slot) return false;
    if (opts.weaponType && i.weaponType !== opts.weaponType) return false;
    if (opts.rarity != null && i.rarityBorderTier !== opts.rarity) return false;
    if (!matchesVocation(i, opts.vocation)) return false;
    if (!matchesLevelRange(i, opts.levelMin, opts.levelMax)) return false;
    if (q && !i.name.toLowerCase().includes(q) && !String(i.id).includes(q)) return false;
    return true;
  });
}

export { sortItemsByLevel } from './item-summary';

const VOCATION_LABELS: Record<string, string> = {
  KNIGHT: 'Knight',
  PALADIN: 'Paladin',
  SORCERER: 'Sorcerer',
  DRUID: 'Druid',
};

export function vocationLabel(v: string): string {
  return VOCATION_LABELS[v] ?? v;
}

const ITEMS_FILTER_KEY = 'items-filters';

export interface SavedItemFilters {
  levelMin?: number | null;
  levelMax?: number | null;
  vocation?: string | null;
}

export function loadItemFilters(): SavedItemFilters {
  try {
    const raw = localStorage.getItem(ITEMS_FILTER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

export function saveItemFilters(f: SavedItemFilters): void {
  try {
    localStorage.setItem(ITEMS_FILTER_KEY, JSON.stringify(f));
  } catch {
    /* ignore */
  }
}
