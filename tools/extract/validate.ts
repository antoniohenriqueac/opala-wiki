import type { WikiData } from '../../src/lib/types';

const MIN_ITEMS = 1400;
const MIN_MONSTERS = 350;

export function validateWikiData(data: WikiData): void {
  const errors: string[] = [];

  if (data.items.length < MIN_ITEMS) {
    errors.push(`items: expected >= ${MIN_ITEMS}, got ${data.items.length}`);
  }
  if (data.monsters.length < MIN_MONSTERS) {
    errors.push(`monsters: expected >= ${MIN_MONSTERS}, got ${data.monsters.length}`);
  }

  const itemIds = new Set(data.items.map((i) => i.id));
  for (const mn of data.monsters) {
    for (const d of mn.loot || []) {
      if (d.itemId && !itemIds.has(d.itemId)) {
        errors.push(`monster ${mn.id} loot itemId ${d.itemId} missing from items`);
      }
    }
    if (mn.image && !data.monAssets[mn.image]) {
      errors.push(`monster ${mn.id} image ${mn.image} missing from monAssets`);
    }
  }

  for (const it of data.items) {
    if (it.image && !data.invAssets[it.image]) {
      errors.push(`item ${it.id} image ${it.image} missing from invAssets`);
    }
  }

  if (errors.length) {
    throw new Error(`Validation failed:\n${errors.slice(0, 20).join('\n')}${errors.length > 20 ? `\n... +${errors.length - 20} more` : ''}`);
  }
}
