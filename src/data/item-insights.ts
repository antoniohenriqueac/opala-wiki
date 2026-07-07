import type { ItemInsight } from '../lib/item-insight-types';

function imb(
  imbuementType: NonNullable<ItemInsight['imbuementType']>,
  label: string,
  summary: string,
  detail?: string,
): ItemInsight {
  const typeLabel =
    imbuementType === 'life_leech'
      ? 'Life Leech (Roubo de Vida)'
      : imbuementType === 'mana_leech'
        ? 'Mana Leech (Roubo de Mana)'
        : imbuementType === 'critical'
          ? 'Critical Hit'
          : imbuementType === 'skill'
            ? 'Skillboost'
            : imbuementType === 'elemental_damage'
              ? 'dano elemental'
              : 'proteção elemental';

  return {
    category: 'imbuement',
    imbuementType,
    label,
    summary,
    detail:
      detail ??
      `Material usado em imbuement de ${typeLabel}. O preço de venda ao NPC é baixo e não reflete o valor que jogadores dão a esse recurso.`,
    superficialPrice: true,
  };
}

/** Curated item utility map — itemId → insight */
export const ITEM_INSIGHTS_DATA: Record<string, ItemInsight> = {
  // ── Life Leech ──
  '13': imb('life_leech', 'Life Leech', 'Material de imbuement (Roubo de Vida).'),
  '63': imb('life_leech', 'Life Leech', 'Material de imbuement (Roubo de Vida).'),
  '685': imb('life_leech', 'Life Leech', 'Material de imbuement (Roubo de Vida).'),
  '724': imb('life_leech', 'Life Leech', 'Material de imbuement (Roubo de Vida).'),

  // ── Mana Leech ──
  '395': imb('mana_leech', 'Mana Leech', 'Material de imbuement (Roubo de Mana).'),
  '777': imb('mana_leech', 'Mana Leech', 'Material de imbuement (Roubo de Mana).'),
  '870': imb('mana_leech', 'Mana Leech', 'Material de imbuement (Roubo de Mana).'),

  // ── Critical Hit ──
  '258': imb('critical', 'Critical Hit', 'Material de imbuement (Critical Hit).'),
  '306': imb('critical', 'Critical Hit', 'Material de imbuement (Critical Hit).'),
  '899': imb('critical', 'Critical Hit', 'Material de imbuement (Critical Hit).'),

  // ── Skillboost ──
  '879': imb('skill', 'Skillboost', 'Material de imbuement (Skillboost).'),
  '881': imb('skill', 'Skillboost', 'Material de imbuement (Skillboost).'),
  '1120': imb('skill', 'Skillboost', 'Material de imbuement (Skillboost).'),
  '1124': imb('skill', 'Skillboost', 'Material de imbuement (Skillboost).'),
  '1020': imb('skill', 'Skillboost', 'Material de imbuement (Skillboost).'),
  '270': imb('skill', 'Skillboost', 'Material de imbuement (Skillboost).'),

  // ── Elemental damage ──
  '74': imb('elemental_damage', 'Dano santo', 'Material de imbuement de dano Holy.'),
  '115': imb('elemental_damage', 'Dano fogo', 'Material de imbuement de dano Fire.'),
  '141': imb('elemental_damage', 'Dano fogo', 'Material de imbuement de dano Fire.'),
  '200': imb('elemental_damage', 'Dano santo', 'Material de imbuement de dano Holy.'),
  '221': imb('elemental_damage', 'Dano death', 'Material de imbuement de dano Death.'),
  '354': imb('elemental_damage', 'Dano terra', 'Material de imbuement de dano Earth.'),
  '675': imb('elemental_damage', 'Dano energia', 'Material de imbuement de dano Energy.'),
  '769': imb('elemental_damage', 'Dano death', 'Material de imbuement de dano Death.'),
  '877': imb('elemental_damage', 'Dano energia', 'Material de imbuement de dano Energy.'),
  '893': imb('elemental_damage', 'Dano terra', 'Material de imbuement de dano Earth.'),
  '1180': imb('elemental_damage', 'Dano distância', 'Material usado em imbuement de Skill Distance e receitas avançadas.'),
  '1346': imb('elemental_damage', 'Dano gelo', 'Material de imbuement de dano Ice.'),
  '1424': imb('elemental_damage', 'Dano distância', 'Material de imbuement de Skill Distance.'),
  '1425': imb('elemental_damage', 'Dano gelo', 'Material de imbuement de dano Ice.'),

  // ── Elemental protection ──
  '116': imb('elemental_protection', 'Prot. fogo', 'Material de imbuement de proteção Fire.'),
  '147': imb('elemental_protection', 'Prot. fogo', 'Material de imbuement de proteção Fire.'),
  '173': imb('elemental_protection', 'Prot. death', 'Material de imbuement de proteção Death.'),
  '174': imb('elemental_protection', 'Prot. death', 'Material de imbuement de proteção Death.'),
  '234': imb('elemental_protection', 'Prot. terra', 'Material de imbuement de proteção Earth.'),
  '713': imb('elemental_protection', 'Prot. gelo', 'Material de imbuement de proteção Ice.'),
  '883': imb('elemental_protection', 'Prot. terra', 'Material de imbuement de proteção Earth.'),
  '890': imb('elemental_protection', 'Prot. energia', 'Material de imbuement de proteção Energy.'),
  '1038': imb('elemental_protection', 'Prot. terra', 'Material de imbuement de proteção Earth.'),
  '1242': imb('elemental_protection', 'Prot. física', 'Material de imbuement de proteção Physical.'),
  '1243': imb('elemental_protection', 'Prot. energia', 'Material de imbuement de proteção Energy.'),
  '1266': imb('elemental_protection', 'Prot. gelo', 'Material de imbuement de proteção Ice.'),
  '1429': imb('elemental_protection', 'Prot. energia', 'Material de imbuement de proteção Energy.'),

  // ── Misc imbuement / forge materials ──
  '192': imb('elemental_protection', 'Prot. energia', 'Material de imbuement e receitas de proteção.'),
  '364': imb('elemental_damage', 'Dano death', 'Material de imbuement de dano Death.'),
  '876': imb('skill', 'Skillboost', 'Material de imbuement (Skillboost).'),
  '914': imb('elemental_protection', 'Prot. fogo', 'Material de imbuement de proteção Fire.'),
  '1015': imb('elemental_protection', 'Prot. física', 'Material de forge/imbuement de alto tier — valor de uso supera o NPC.'),
  '1016': imb('elemental_protection', 'Prot. death', 'Material de forge/imbuement — preço NPC não reflete demanda.'),
  '1017': imb('elemental_protection', 'Prot. energia', 'Material de forge/imbuement — preço NPC não reflete demanda.'),
  '1135': imb('skill', 'Skillboost', 'Material de imbuement (Skillboost).'),
  '124': imb('skill', 'Skillboost', 'Material de imbuement (Skill Distance / Skillboost).'),

  // ── Quest ──
  '100': {
    category: 'quest',
    label: 'Missão',
    summary: 'Material de missão — usado em várias quests.',
    detail:
      'Couro de minotauro é exigido em missões clássicas. Mesmo com preço NPC modesto, vale guardar para entregas de quest.',
    superficialPrice: true,
  },
  '645': {
    category: 'quest',
    label: 'Missão',
    summary: 'Item de missão — necessário para quest específica.',
    detail: 'Item de quest com utilidade fixa. O preço NPC não representa o valor para quem está fazendo a missão.',
    superficialPrice: true,
  },

  // ── Craft / forge ──
  '299': {
    category: 'craft',
    label: 'Forge',
    summary: 'Token de forja — usado em upgrades de equipamento.',
    detail:
      'Crystalline tokens são consumidos na forja/classificação de itens. Jogadores acumulam e negociam por eles no market.',
    superficialPrice: false,
  },

  // ── Outfit / addon ──
  '400': {
    category: 'outfit',
    label: 'Outfit',
    summary: 'Item relacionado a outfit ou addon.',
    detail: 'Usado em conteúdo de outfit/addon. O valor prático vem da progressão de coleção, não da venda ao NPC.',
    superficialPrice: true,
  },
  '150003': {
    category: 'outfit',
    label: 'Addon',
    summary: 'Pacote de addon — abre opções de visual.',
    detail: 'Item de addon/outfit. Não se vende ao NPC pelo valor real que representa para quem completa looks.',
    superficialPrice: false,
  },
};
