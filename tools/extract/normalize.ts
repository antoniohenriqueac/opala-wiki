import type { Hunt, Item, Monster, Quest, WikiData } from '../../src/lib/types';
import type { SpriteAsset } from '../../src/lib/types';

export function normalizeWikiData(input: {
  items: unknown[];
  monsters: unknown[];
  hunts: unknown[];
  quests: unknown[];
  mapItems?: unknown[];
  invAssets: Record<string, SpriteAsset>;
  monAssets: Record<string, SpriteAsset>;
}): WikiData {
  return {
    items: input.items as Item[],
    monsters: input.monsters as Monster[],
    hunts: input.hunts as Hunt[],
    quests: input.quests as Quest[],
    mapItems: input.mapItems,
    invAssets: input.invAssets,
    monAssets: input.monAssets,
  };
}
