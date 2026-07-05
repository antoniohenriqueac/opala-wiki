import type { Item } from './types';

export const SPEED_SLOTS = ['FOOT', 'LEGS', 'BODY', 'HEAD', 'NECK', 'RING'] as const;
export type SpeedSlot = (typeof SPEED_SLOTS)[number];

export type SpeedLoadout = Partial<Record<SpeedSlot, number>>;

/** Wiki uses CHEST for armors; game speed slot is body/chest. */
export function normalizeSpeedSlot(slot?: string): SpeedSlot | null {
  if (!slot) return null;
  if (slot === 'CHEST') return 'BODY';
  if (SPEED_SLOTS.includes(slot as SpeedSlot)) return slot as SpeedSlot;
  return null;
}

export function itemSpeedValue(item: Item): number {
  const s = item.speed;
  return typeof s === 'number' && s > 0 ? s : 0;
}

export function allSpeedItems(items: Item[]): Item[] {
  return items
    .filter((i) => itemSpeedValue(i) > 0)
    .sort(
      (a, b) =>
        (a.levelMin ?? 0) - (b.levelMin ?? 0) ||
        itemSpeedValue(b) - itemSpeedValue(a) ||
        a.name.localeCompare(b.name, 'pt-BR'),
    );
}

export function sumEquippedSpeed(loadout: SpeedLoadout, itemById: Record<number, Item>): number {
  let total = 0;
  for (const slot of SPEED_SLOTS) {
    const id = loadout[slot];
    if (!id) continue;
    const it = itemById[id];
    if (it) total += itemSpeedValue(it);
  }
  return total;
}

export function speedItemsBySlot(items: Item[]): Record<SpeedSlot, Item[]> {
  const out = {} as Record<SpeedSlot, Item[]>;
  for (const slot of SPEED_SLOTS) out[slot] = [];
  for (const it of allSpeedItems(items)) {
    const slot = normalizeSpeedSlot(it.slot);
    if (!slot) continue;
    out[slot].push(it);
  }
  return out;
}

const LOADOUT_KEY = 'speed-loadout';

export function loadSpeedLoadout(): SpeedLoadout {
  try {
    const raw = localStorage.getItem(LOADOUT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

export function saveSpeedLoadout(loadout: SpeedLoadout): void {
  try {
    localStorage.setItem(LOADOUT_KEY, JSON.stringify(loadout));
  } catch {
    /* ignore */
  }
}

export const BOH_ITEM_ID = 155;
export const GRASSHOPPER_LEGS_ID = 1244;

export const SPEED_PRESETS: { label: string; loadout: SpeedLoadout }[] = [
  { label: 'Sem speed', loadout: {} },
  { label: 'BOH (+20)', loadout: { FOOT: BOH_ITEM_ID } },
  {
    label: 'BOH + Grasshopper (+30)',
    loadout: { FOOT: BOH_ITEM_ID, LEGS: GRASSHOPPER_LEGS_ID },
  },
];

export const SPEED_SLOT_LABELS: Record<SpeedSlot, string> = {
  FOOT: 'Botas',
  LEGS: 'Pernas',
  BODY: 'Armadura',
  HEAD: 'Capacete',
  NECK: 'Colar',
  RING: 'Anel',
};
