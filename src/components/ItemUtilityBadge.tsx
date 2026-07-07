import type { ItemInsight } from '../lib/item-insight-types';
import {
  insightCardLabel,
  UTILITY_CATEGORY_LABELS,
  utilityBadgeClasses,
} from '../lib/item-insights';

interface ItemUtilityBadgeProps {
  insight: ItemInsight;
  /** Inline com outras tags (detalhe) vs. banner no card */
  inline?: boolean;
}

export function ItemUtilityBadge({ insight, inline = false }: ItemUtilityBadgeProps) {
  const categoryLabel = UTILITY_CATEGORY_LABELS[insight.category];
  const mainLabel = insightCardLabel(insight);
  const showKicker = insight.category === 'imbuement' && mainLabel !== categoryLabel;

  return (
    <span
      class={`${utilityBadgeClasses(insight)}${inline ? ' utility-badge-inline' : ''}`}
      title={insight.summary}
    >
      {showKicker && <span class="utility-badge-kicker">{categoryLabel}</span>}
      <span class="utility-badge-label">{mainLabel}</span>
      {!inline && insight.superficialPrice && (
        <span class="utility-badge-hint">NPC ↯</span>
      )}
    </span>
  );
}
