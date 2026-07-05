import { useMemo, useState, useEffect, useCallback } from 'preact/hooks';
import { SpriteIcon } from '../SpriteIcon';
import { XPCalculator } from '../XPCalculator';
import { LootFilter } from '../LootFilter';
import { HuntMetricsSticky } from '../HuntMetricsSticky';
import { ItemHoverTip } from '../ItemHoverTip';
import {
  fmt,
  fmtChance,
  chanceClass,
  RARITY_BANDS,
  rarityOf,
  lootRarityClass,
} from '../../lib/format';
import {
  huntMonsters,
  collectHuntLoot,
  computeHuntMetrics,
} from '../../lib/hunt-metrics';
import {
  loadExcludedLootIds,
  saveExcludedLootIds,
  junkItemIds,
} from '../../lib/loot-filter';
import { computeXP, loadXPSettings, saveXPSettings } from '../../lib/xp-calculator';
import type { Hunt, LootEntry, WikiData, XPCalcSettings } from '../../lib/types';
import type { WikiIndexes } from '../../lib/indexes';
import type { DetailTarget } from '../../context/DetailContext';

interface Props {
  h: Hunt;
  data: WikiData;
  indexes: WikiIndexes;
  openDetail: (t: DetailTarget) => void;
}

export function HuntDetailView({ h, data, indexes, openDetail }: Props) {
  const { monById, itemById } = indexes;
  const mons = huntMonsters(h, monById);
  const lootEntries = useMemo(() => collectHuntLoot(h, monById), [h, monById]);

  const [excludedIds, setExcludedIds] = useState<Set<number>>(() => loadExcludedLootIds(h.id));

  const [xpSettings, setXpSettings] = useState<XPCalcSettings>(() => {
    const saved = loadXPSettings(h.id);
    return {
      ...saved,
      charLevel: saved.charLevel ?? h.recommendedLevel ?? 50,
      lure: saved.lure ?? h.maxLure ?? 1,
    };
  });

  const updateSettings = useCallback(
    (patch: Partial<XPCalcSettings>) => setXpSettings((s) => ({ ...s, ...patch })),
    [],
  );

  useEffect(() => {
    saveExcludedLootIds(h.id, excludedIds);
  }, [h.id, excludedIds]);

  useEffect(() => {
    saveXPSettings(h.id, xpSettings);
  }, [h.id, xpSettings]);

  const metrics = useMemo(
    () => computeHuntMetrics(h, mons, itemById, xpSettings, { excludedLootIds: excludedIds }),
    [h, mons, itemById, xpSettings, excludedIds],
  );

  const xpPerHour = useMemo(
    () => Math.round(computeXP(mons, h, xpSettings).totalXpPerHour),
    [mons, h, xpSettings],
  );

  const toggleLoot = (itemId: number) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const clearFilter = () => setExcludedIds(new Set());

  const filterJunk = () => {
    const ids = junkItemIds(
      data.items,
      lootEntries.map((e) => e.itemId),
    );
    setExcludedIds(new Set(ids));
  };

  const allLoot = lootEntries;
  const groups: Record<string, typeof allLoot> = {};
  for (const b of RARITY_BANDS) groups[b.key] = [];
  for (const d of allLoot) groups[rarityOf(d.chance).key].push(d);

  const renderSlot = (d: LootEntry, bandKey: string) => {
    const it = itemById[d.itemId];
    if (!it) return null;
    const rClass = lootRarityClass(d.chance || 0);
    return (
      <ItemHoverTip
        class={`slot ${rClass}`}
        key={`${d.itemId}-${bandKey}`}
        item={it}
        chance={d.chance}
        invAssets={data.invAssets}
        rarityClass={rClass}
        onClick={() => openDetail({ type: 'item', data: it })}
      >
        <SpriteIcon kind="item" imageName={it.image} assets={data.invAssets} />
        {d.maxCount && d.maxCount > 1 ? <div class="count-badge">×{d.maxCount}</div> : null}
        <div class={`schance ${chanceClass(d.chance || 0)}`}>{fmtChance(d.chance || 0)}</div>
        <div class="sname">{it.name}</div>
      </ItemHoverTip>
    );
  };

  return (
    <>
      <h1>{h.title}</h1>
      <div class="sub">
        Hunt #{h.id}
        {h.mapId ? ` · map #${h.mapId}` : ''}
      </div>
      <div class="lvl-pills">
        {h.recommendedLevel != null && (
          <div class="lvl-pill">
            Level recomendado<b>{h.recommendedLevel}</b>
          </div>
        )}
        {h.levelMin != null && (
          <div class="lvl-pill">
            Level mínimo<b>{h.levelMin}</b>
          </div>
        )}
        {h.maxLure != null && (
          <div class="lvl-pill">
            Max lure<b>{h.maxLure}</b>
          </div>
        )}
      </div>

      <HuntMetricsSticky
        xpPerHour={xpPerHour}
        metrics={metrics}
        filteredCount={excludedIds.size}
        totalLootCount={lootEntries.length}
        showProfit={lootEntries.length > 0}
      />

      <div class="section-title">
        <span>Criaturas ({mons.length})</span>
        <span class="line" />
      </div>
      <div class="creature-grid">
        {mons.map((mn) => (
          <div class="creature-card" key={mn.id} onClick={() => openDetail({ type: 'monster', data: mn })}>
            <div class="cname">{mn.name}</div>
            <SpriteIcon kind="monster" imageName={mn.image} animated assets={data.monAssets} />
            <div class="csub">
              HP {fmt(mn.hp)} · XP {fmt(mn.xp)}
            </div>
          </div>
        ))}
      </div>

      <XPCalculator
        hunt={h}
        monsters={mons}
        items={data.items}
        itemById={itemById}
        settings={xpSettings}
        onSettingsChange={updateSettings}
        compactHead
      />

      {lootEntries.length > 0 && (
        <LootFilter
          huntId={h.id}
          entries={lootEntries}
          excludedIds={excludedIds}
          onToggle={toggleLoot}
          onClear={clearFilter}
          onFilterJunk={filterJunk}
          itemById={itemById}
          invAssets={data.invAssets}
        />
      )}

      <div class="section-title">
        <span>Loots possíveis</span>
        <span class="line" />
        <span>{allLoot.length} itens</span>
      </div>
      <div class="loot-groups">
        {RARITY_BANDS.map((band) => {
          const rows = groups[band.key];
          if (!rows.length) return null;
          return (
            <div key={band.key}>
              <div class={`loot-group-head loot-${band.key}`}>
                <span>{band.label}</span>
                <span>({rows.length})</span>
                <span class="lgline" />
              </div>
              <div class="slots">{rows.map((d) => renderSlot(d, band.key))}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
