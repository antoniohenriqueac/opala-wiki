import type { ItemInsight, ItemUtilityCategory, UtilityFilter } from './item-insight-types';
import {
  IMBUEMENT_TYPE_LABELS,
  IMBUEMENT_TYPE_LABELS_SHORT,
  UTILITY_CATEGORY_LABELS,
} from './item-insight-types';
import { ITEM_INSIGHTS_DATA } from '../data/item-insights';

export type {
  ItemInsight,
  ItemUtilityCategory,
  ImbuementSubtype,
  UtilityFilter,
} from './item-insight-types';

export {
  UTILITY_CATEGORY_LABELS,
  UTILITY_FILTER_OPTIONS,
  IMBUEMENT_TYPE_LABELS,
  IMBUEMENT_TYPE_LABELS_SHORT,
} from './item-insight-types';

const INSIGHTS: ReadonlyMap<number, ItemInsight> = new Map(
  Object.entries(ITEM_INSIGHTS_DATA).map(([id, insight]) => [Number(id), insight]),
);

export function getItemInsight(itemId: number): ItemInsight | undefined {
  return INSIGHTS.get(itemId);
}

export function hasSuperficialPrice(itemId: number): boolean {
  const insight = getItemInsight(itemId);
  return insight?.superficialPrice === true;
}

export function insightBadgeLabel(insight: ItemInsight): string {
  if (insight.category === 'imbuement' && insight.imbuementType) {
    return IMBUEMENT_TYPE_LABELS[insight.imbuementType];
  }
  return insight.label || UTILITY_CATEGORY_LABELS[insight.category];
}

export function insightCardLabel(insight: ItemInsight): string {
  if (insight.category === 'imbuement' && insight.imbuementType) {
    return IMBUEMENT_TYPE_LABELS_SHORT[insight.imbuementType];
  }
  return insight.label || UTILITY_CATEGORY_LABELS[insight.category];
}

export function utilityBadgeClasses(insight: ItemInsight): string {
  const parts = ['utility-badge', `utility-badge-${insight.category}`];
  if (insight.imbuementType) parts.push(`utility-badge-${insight.imbuementType}`);
  return parts.join(' ');
}

/** @deprecated use utilityBadgeClasses */
export function utilityTagClass(category: ItemUtilityCategory): string {
  return `utility-tag utility-tag-${category}`;
}

export function insightCategoryBadgeLabel(insight: ItemInsight): string {
  return UTILITY_CATEGORY_LABELS[insight.category];
}

export function insightDetailHeading(insight: ItemInsight): string {
  if (insight.category === 'imbuement' && insight.imbuementType) {
    return `${UTILITY_CATEGORY_LABELS.imbuement} · ${IMBUEMENT_TYPE_LABELS[insight.imbuementType]}`;
  }
  return UTILITY_CATEGORY_LABELS[insight.category];
}

export function matchesUtilityFilter(itemId: number, filter: UtilityFilter | null): boolean {
  if (!filter) return true;
  const insight = getItemInsight(itemId);
  if (!insight) return false;
  if (filter === 'any') return true;
  return insight.category === filter;
}

export function countInsightsByCategory(): Record<ItemUtilityCategory | 'total', number> {
  const counts: Record<ItemUtilityCategory | 'total', number> = {
    imbuement: 0,
    quest: 0,
    craft: 0,
    outfit: 0,
    mount: 0,
    other: 0,
    total: 0,
  };
  for (const insight of INSIGHTS.values()) {
    counts[insight.category]++;
    counts.total++;
  }
  return counts;
}
