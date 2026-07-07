import type { Item } from './types';

export type HandFilter = '1H' | '2H';

export interface ItemFilterOptions {
  query?: string;
  slot?: string | null;
  weaponType?: string | null;
  rarity?: number | null;
  vocation?: string | null;
  levelMin?: number | null;
  levelMax?: number | null;
  hands?: HandFilter | null;
}

export function isHandWeapon(item: Item): boolean {
  return item.slot === 'HAND' && !!item.weaponType;
}

export function isTwoHanded(item: Item): boolean {
  return item.doubleHand === true;
}

export function isOneHanded(item: Item): boolean {
  return isHandWeapon(item) && !isTwoHanded(item);
}

export function handLabel(item: Item): HandFilter | null {
  if (!isHandWeapon(item)) return null;
  return isTwoHanded(item) ? '2H' : '1H';
}

export function handLabelLong(item: Item): string | null {
  const label = handLabel(item);
  if (label === '2H') return 'Duas mãos';
  if (label === '1H') return 'Uma mão';
  return null;
}

export function matchesHands(item: Item, hands?: HandFilter | null): boolean {
  if (!hands) return true;
  const label = handLabel(item);
  return label === hands;
}

export function matchesLevelRange(item: Item, min?: number | null, max?: number | null): boolean {
  const hasMin = min != null && min > 0;
  const hasMax = max != null && max > 0;
  if (!hasMin && !hasMax) return true;

  const req = item.levelMin;
  // Sem level no item = usable por qualquer um — não some do filtro
  if (req == null || req <= 0) return true;

  if (hasMin && req < min!) return false;
  if (hasMax && req > max!) return false;
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
    if (!matchesHands(i, opts.hands)) return false;
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

const SLOT_LABELS: Record<string, string> = {
  HAND: 'Mão',
  HEAD: 'Cabeça',
  CHEST: 'Corpo',
  LEGS: 'Pernas',
  FOOT: 'Pés',
  NECK: 'Colar',
  RING: 'Anel',
  SHIELD: 'Escudo',
  BACK: 'Mochila',
};

export function slotLabel(slot: string): string {
  return SLOT_LABELS[slot] ?? slot;
}

export function weaponTypeLabel(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

const ITEMS_FILTER_KEY = 'items-filters';

export interface SavedItemFilters {
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
