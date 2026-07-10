import type { Hunt, Monster } from './types';
import { RES_COLORS, RES_LABEL } from './format';

/** Elements players typically pick for damage (excludes physical / life drain). */
export const HUNT_DAMAGE_ELEMENTS = [
  'FIRE',
  'ICE',
  'ENERGY',
  'EARTH',
  'HOLY',
  'DEATH',
] as const;

export type HuntDamageElement = (typeof HUNT_DAMAGE_ELEMENTS)[number];

export interface HuntElementRating {
  key: HuntDamageElement;
  label: string;
  color: string;
  /** Weighted avg resistance — higher = monster takes more damage. */
  score: number;
}

function getMonsterWeight(hunt: Hunt, monsterId: number): number {
  const w = hunt.monsterWeights;
  if (!w) return 10;
  return w[String(monsterId)] ?? 10;
}

function resistanceValue(m: Monster, element: HuntDamageElement): number | null {
  const v = m.elementalResistances?.[element];
  return v == null ? null : v;
}

/** Best damage elements for a hunt (weighted by spawn share). Excludes immunities. */
export function getHuntBestElements(
  hunt: Hunt,
  monsters: Monster[],
  limit = 2,
): HuntElementRating[] {
  if (!monsters.length) return [];

  const weights = monsters.map((m) => getMonsterWeight(hunt, m.id));

  const rated: HuntElementRating[] = [];

  for (const key of HUNT_DAMAGE_ELEMENTS) {
    let hasImmune = false;
    let weighted = 0;
    let known = 0;

    for (let i = 0; i < monsters.length; i++) {
      const v = resistanceValue(monsters[i], key);
      if (v == null) continue;
      if (v === 0) {
        hasImmune = true;
        break;
      }
      weighted += weights[i] * v;
      known += weights[i];
    }

    if (hasImmune || known <= 0) continue;

    rated.push({
      key,
      label: RES_LABEL[key] ?? key,
      color: RES_COLORS[key] ?? '#888',
      score: weighted / known,
    });
  }

  rated.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'pt-BR'));
  return rated.slice(0, limit);
}
