import type { Item } from './types';

export const SPEED_SLOTS = ['FOOT', 'LEGS', 'BODY', 'HEAD', 'NECK'] as const;
export type SpeedSlot = (typeof SPEED_SLOTS)[number];

export type SpeedLoadout = Partial<Record<SpeedSlot, number>>;

export function itemSpeedValue(item: Item): number {
  const s = item.speed;
  return typeof s === 'number' && s > 0 ? s : 0;
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
  for (const it of items) {
    if (!itemSpeedValue(it) || !it.slot) continue;
    const slot = it.slot as SpeedSlot;
    if (SPEED_SLOTS.includes(slot)) out[slot].push(it);
  }
  for (const slot of SPEED_SLOTS) {
    out[slot].sort((a, b) => (a.levelMin ?? 0) - (b.levelMin ?? 0) || a.name.localeCompare(b.name));
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

export const SPEED_PRESETS: { label: string; loadout: SpeedLoadout }[] = [
  { label: 'Sem speed', loadout: {} },
  { label: 'BOH', loadout: { FOOT: BOH_ITEM_ID } },
];
