export type ItemUtilityCategory = 'imbuement' | 'quest' | 'craft' | 'outfit' | 'mount' | 'other';

export type ImbuementSubtype =
  | 'life_leech'
  | 'mana_leech'
  | 'critical'
  | 'skill'
  | 'elemental_damage'
  | 'elemental_protection';

/** `any` = qualquer item com insight cadastrado */
export type UtilityFilter = ItemUtilityCategory | 'any';

export interface ItemInsight {
  category: ItemUtilityCategory;
  imbuementType?: ImbuementSubtype;
  label: string;
  summary: string;
  detail: string;
  superficialPrice?: boolean;
}

export const UTILITY_CATEGORY_LABELS: Record<ItemUtilityCategory, string> = {
  imbuement: 'Imbuement',
  quest: 'Missão',
  craft: 'Craft',
  outfit: 'Outfit',
  mount: 'Montaria',
  other: 'Outros',
};

export const UTILITY_FILTER_OPTIONS: Array<{ id: UtilityFilter; label: string }> = [
  { id: 'any', label: 'Com utilidade' },
  { id: 'imbuement', label: 'Imbuement' },
  { id: 'quest', label: 'Missão' },
  { id: 'craft', label: 'Craft' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'mount', label: 'Montaria' },
  { id: 'other', label: 'Outros' },
];

export const IMBUEMENT_TYPE_LABELS: Record<ImbuementSubtype, string> = {
  life_leech: 'Life Leech',
  mana_leech: 'Mana Leech',
  critical: 'Critical Hit',
  skill: 'Skillboost',
  elemental_damage: 'Dano elemental',
  elemental_protection: 'Proteção elemental',
};

/** Labels curtos para badges nos cards */
export const IMBUEMENT_TYPE_LABELS_SHORT: Record<ImbuementSubtype, string> = {
  life_leech: 'Roubo de vida',
  mana_leech: 'Roubo de mana',
  critical: 'Critical Hit',
  skill: 'Skillboost',
  elemental_damage: 'Dano elemental',
  elemental_protection: 'Proteção elem.',
};
