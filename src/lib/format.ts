export function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString('pt-BR');
}

export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return fmt(Math.round(n));
}

export function escapeHTML(s: string): string {
  return String(s).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
  );
}

export function matchQuery(text: string | number, q: string): boolean {
  return String(text).toLowerCase().includes(q);
}

export const RARITY_BANDS = [
  { key: 'guaranteed', label: 'Garantido', min: 100, max: Infinity },
  { key: 'common', label: 'Common', min: 20, max: 100 },
  { key: 'uncommon', label: 'Uncommon', min: 5, max: 20 },
  { key: 'semirare', label: 'Semi-Rare', min: 1, max: 5 },
  { key: 'rare', label: 'Rare', min: 0.1, max: 1 },
  { key: 'veryrare', label: 'Very Rare', min: 0, max: 0.1 },
] as const;

export function rarityOf(chance: number) {
  for (const b of RARITY_BANDS) if (chance >= b.min && chance < b.max) return b;
  return RARITY_BANDS[RARITY_BANDS.length - 1];
}

export function fmtChance(c: number): string {
  if (c >= 100) return 'GARANTIDO';
  if (c >= 1) return `${c.toFixed(2)}%`;
  if (c >= 0.01) return `${c.toFixed(2)}%`;
  return `${c.toFixed(3)}%`;
}

export function chanceClass(c: number): string {
  if (c >= 100) return 'c-5';
  if (c >= 20) return 'c-5';
  if (c >= 10) return 'c-4';
  if (c >= 5) return 'c-3';
  if (c >= 1) return 'c-2';
  if (c >= 0.1) return 'c-1';
  return 'c-0';
}

export function itemCategory(it: {
  weaponType?: string;
  slot?: string;
  stackable?: boolean;
}): string {
  if (it.weaponType) return 'arma';
  if (it.slot === 'SHIELD') return 'escudo';
  if (it.slot === 'CHEST') return 'armadura';
  if (it.slot === 'HEAD') return 'elmo';
  if (it.slot === 'LEGS') return 'grevas';
  if (it.slot === 'FOOT') return 'botas';
  if (it.slot === 'NECK') return 'amuleto';
  if (it.slot === 'RING') return 'anel';
  if (it.slot === 'BACK') return 'mochila';
  if (it.stackable) return 'consumível';
  return 'outro';
}

export const RES_LABEL: Record<string, string> = {
  PHYSICAL: 'Físico',
  FIRE: 'Fogo',
  EARTH: 'Terra',
  ENERGY: 'Energia',
  ICE: 'Gelo',
  HOLY: 'Sagrado',
  DEATH: 'Morte',
  LIFEDRAIN: 'Life Drain',
};

export const RES_COLORS: Record<string, string> = {
  PHYSICAL: '#c8bda2',
  FIRE: '#e07840',
  ICE: '#7fbee8',
  EARTH: '#7dbb6e',
  ENERGY: '#e0c85e',
  HOLY: '#f4d488',
  DEATH: '#a879c8',
  LIFEDRAIN: '#c14a3c',
};

export const RES_ORDER = [
  'PHYSICAL',
  'FIRE',
  'EARTH',
  'ENERGY',
  'ICE',
  'HOLY',
  'DEATH',
  'LIFEDRAIN',
] as const;

export const MISSION_TYPE_LABEL: Record<string, string> = {
  monster_task: 'Caça',
  current_hunt: 'Hunt',
  deliver_items: 'Entrega',
  npc_dialog: 'Diálogo',
};

export const MISSION_TYPE_COLOR: Record<string, string> = {
  monster_task: 'var(--accent)',
  current_hunt: '#9333ea',
  deliver_items: '#2563eb',
};

export function questTypeSummary(missions: { type: string }[]): string {
  const types = [...new Set(missions.map((m) => m.type))];
  return types.map((t) => MISSION_TYPE_LABEL[t] || t).join(' · ') || '—';
}

/** Item id for quest card/detail icon — rewardHighlight or first item reward. */
export function getQuestIconItemId(quest: {
  rewardHighlight?: { itemId: number };
  missions?: {
    rewards?: { type: string; itemId?: number }[];
    rewardChoices?: { rewards?: { type: string; itemId?: number }[] }[];
  }[];
}): number | null {
  if (quest.rewardHighlight?.itemId) return quest.rewardHighlight.itemId;
  for (const mission of quest.missions || []) {
    for (const r of mission.rewards || []) {
      if (r.type === 'item' && r.itemId) return r.itemId;
    }
    for (const choice of mission.rewardChoices || []) {
      for (const r of choice.rewards || []) {
        if (r.type === 'item' && r.itemId) return r.itemId;
      }
    }
  }
  return null;
}

export function renderStars(n: number, max = 5): string {
  const count = Math.min(max, Math.max(0, Math.round(n)));
  return '★'.repeat(count);
}
