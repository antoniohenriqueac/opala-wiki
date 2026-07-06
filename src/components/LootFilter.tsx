import { SpriteIcon } from './SpriteIcon';
import { ItemHoverTip } from './ItemHoverTip';
import { InfoHoverTip } from './InfoHoverTip';
import { fmtGpPerHour, fmtGpPerKill, lootRarityClass } from '../lib/format';
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
  goldGpPerHour?: number;
  goldGpPerKill?: number;
  embedded?: boolean;
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
  goldGpPerHour,
  goldGpPerKill,
  embedded,
}: LootFilterProps) {
  const active = entries.length - excludedIds.size;

  return (
    <div class={`loot-filter${embedded ? '' : ' panel'}`}>
      {!embedded && (
        <div class="loot-filter-head">
          <div>
            <div class="loot-filter-title">LOOT FILTER</div>
            <div class="loot-filter-sub">Loot dessa hunt</div>
          </div>
          <span class="loot-filter-count">
            {active}/{entries.length}
          </span>
        </div>
      )}
      {embedded && (
        <div class="loot-filter-head embedded">
          <span class="loot-filter-count">
            {active}/{entries.length} ativos
          </span>
          {goldGpPerHour != null && goldGpPerHour > 0 && (
            <InfoHoverTip
              content={{
                title: 'Gold da kill',
                paragraphs: [
                  `${fmtGpPerKill(goldGpPerKill ?? 0)} por kill — média (min–max)/2 do bestiário.`,
                  `${fmtGpPerHour(Math.round(goldGpPerHour))} sempre incluído no GP, mesmo com todos os itens filtrados.`,
                  'Esse gold vai direto pra BP (como no Hunt Analyzer). Não aparece na grade de loot abaixo.',
                ],
                foot: 'Ex.: Tarantula 0–40 gp → média 20 gp/kill ≈ gold na BP ÷ kills.',
              }}
            >
              <span class="loot-filter-gold-chip">
                Gold {fmtGpPerKill(goldGpPerKill ?? 0)}
                <span class="calc-hint-trigger" aria-hidden="true">
                  i
                </span>
              </span>
            </InfoHoverTip>
          )}
        </div>
      )}
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
