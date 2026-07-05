import { SpriteIcon } from './SpriteIcon';
import { ItemHoverTip } from './ItemHoverTip';
import { lootRarityClass } from '../lib/format';
import type { Item, SpriteAsset } from '../lib/types';

export interface LootFilterEntry {
  itemId: number;
  chance: number;
  maxCount?: number;
}

interface LootFilterProps {
  huntId: number;
  entries: LootFilterEntry[];
  excludedIds: Set<number>;
  onToggle: (itemId: number) => void;
  onClear: () => void;
  onFilterJunk: () => void;
  itemById: Record<number, Item>;
  invAssets: Record<string, SpriteAsset>;
  lootGpPerHour?: Record<number, number>;
}

export function LootFilter({
  entries,
  excludedIds,
  onToggle,
  onClear,
  onFilterJunk,
  itemById,
  invAssets,
  lootGpPerHour,
}: LootFilterProps) {
  const active = entries.length - excludedIds.size;

  return (
    <div class="loot-filter panel">
      <div class="loot-filter-head">
        <div>
          <div class="loot-filter-title">LOOT FILTER</div>
          <div class="loot-filter-sub">Loot dessa hunt</div>
        </div>
        <span class="loot-filter-count">
          {active}/{entries.length}
        </span>
      </div>
      <div class="loot-filter-actions">
        <button type="button" class="chip" onClick={onClear}>
          Limpar filtro
        </button>
        <button type="button" class="chip" onClick={onFilterJunk}>
          Filtrar junk
        </button>
      </div>
      <div class="loot-filter-grid">
        {entries.map((d) => {
          const it = itemById[d.itemId];
          if (!it) return null;
          const excluded = excludedIds.has(d.itemId);
          const rClass = lootRarityClass(d.chance || 0);
          return (
            <ItemHoverTip
              key={d.itemId}
              item={it}
              class={`loot-filter-slot ${rClass}${excluded ? ' excluded' : ''}`}
              chance={d.chance}
              gpPerHour={lootGpPerHour?.[d.itemId]}
              invAssets={invAssets}
              rarityClass={rClass}
              onClick={() => onToggle(d.itemId)}
            >
              <SpriteIcon kind="item" imageName={it.image} assets={invAssets} />
              {excluded && <span class="loot-filter-x">✕</span>}
            </ItemHoverTip>
          );
        })}
      </div>
    </div>
  );
}
