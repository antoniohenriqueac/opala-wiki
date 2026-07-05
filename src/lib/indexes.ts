import type { DropSource, Hunt, Item, Monster, Quest, WikiData } from './types';

export interface WikiIndexes {
  itemById: Record<number, Item>;
  monById: Record<number, Monster>;
  questById: Record<number, Quest>;
  huntById: Record<number, Hunt>;
  dropsByItem: Record<number, DropSource[]>;
  questsByMonster: Record<number, number[]>;
  huntsByMonster: Record<number, number[]>;
}

export function buildIndexes(data: WikiData): WikiIndexes {
  const itemById: Record<number, Item> = {};
  for (const it of data.items) itemById[it.id] = it;

  const monById: Record<number, Monster> = {};
  for (const mn of data.monsters) monById[mn.id] = mn;

  const questById: Record<number, Quest> = {};
  for (const q of data.quests || []) questById[q.id] = q;

  const huntById: Record<number, Hunt> = {};
  for (const h of data.hunts || []) huntById[h.id] = h;

  const dropsByItem: Record<number, DropSource[]> = {};
  for (const mn of data.monsters) {
    if (!mn.loot) continue;
    for (const d of mn.loot) {
      if (!d.itemId) continue;
      (dropsByItem[d.itemId] ??= []).push({
        monsterId: mn.id,
        chance: d.chance || 0,
        maxCount: d.maxCount || 1,
      });
    }
  }
  for (const id in dropsByItem) {
    dropsByItem[+id].sort((a, b) => {
      const ag = a.chance >= 100;
      const bg = b.chance >= 100;
      if (ag !== bg) return ag ? -1 : 1;
      return b.chance - a.chance;
    });
  }

  const questsByMonster: Record<number, number[]> = {};
  for (const q of data.quests || []) {
    const monset = new Set<number>();
    for (const m of q.missions || []) {
      for (const t of m.monsterTasks || []) monset.add(t.monsterId);
      for (const r of m.rooms || [])
        for (const w of r.waves || [])
          for (const mid of w.monsterIds || []) monset.add(mid);
    }
    for (const id of monset) {
      (questsByMonster[id] ??= []).push(q.id);
    }
  }

  const huntsByMonster: Record<number, number[]> = {};
  for (const h of data.hunts || []) {
    for (const mid of h.monsters || []) {
      (huntsByMonster[mid] ??= []).push(h.id);
    }
  }

  return { itemById, monById, questById, huntById, dropsByItem, questsByMonster, huntsByMonster };
}
