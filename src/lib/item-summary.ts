import type { Item } from './types';
import { handLabelLong, vocationLabel } from './item-filters';
import { fmtGp } from './format';
import { getItemInsight } from './item-insights';

export interface ItemHoverInfo {
  level?: number;
  vocations?: string;
  stats?: string;
  slot?: string;
  weaponType?: string;
  hands?: string;
  npcPrice?: number;
  utilitySummary?: string;
}

export function itemHoverInfo(it: Item): ItemHoverInfo {
  const stats = [
    it.atk != null ? `Atk ${it.atk}` : null,
    it.arm != null ? `Arm ${it.arm}` : null,
    it.def != null ? `Def ${it.def}` : null,
    it.magicLevel != null ? `ML +${it.magicLevel}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const insight = getItemInsight(it.id);

  return {
    level: it.levelMin,
    vocations: it.vocation?.length ? it.vocation.map(vocationLabel).join(' · ') : undefined,
    stats: stats || undefined,
    slot: it.slot,
    weaponType: it.weaponType,
    hands: handLabelLong(it) ?? undefined,
    npcPrice: it.npcSellPrice,
    utilitySummary: insight?.summary,
  };
}

/** @deprecated use itemHoverInfo */
export function itemHoverLines(it: Item): string[] {
  const info = itemHoverInfo(it);
  const lines: string[] = [];
  if (info.level != null) lines.push(`Level ${info.level}+`);
  if (info.vocations) lines.push(info.vocations);
  if (info.stats) lines.push(info.stats);
  if (info.slot) lines.push(info.slot);
  if (info.hands) lines.push(info.hands);
  if (info.weaponType) lines.push(info.weaponType);
  if (info.npcPrice != null) lines.push(`NPC ${fmtGp(info.npcPrice)}`);
  return lines;
}

/** Sort equipables by required level, then name. Items without level go last. */
export function sortItemsByLevel(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const la = a.levelMin ?? 99999;
    const lb = b.levelMin ?? 99999;
    if (la !== lb) return la - lb;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}
