import { SpriteIcon } from '../SpriteIcon';
import { XPCalculator } from '../XPCalculator';
import {
  fmt,
  fmtChance,
  chanceClass,
  RARITY_BANDS,
  rarityOf,
} from '../../lib/format';
import { huntMonsters } from '../../lib/hunt-metrics';
import type { Hunt, LootEntry, WikiData } from '../../lib/types';
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
  const lootMap: Record<number, LootEntry & { from: string }> = {};

  for (const mn of mons) {
    for (const d of mn.loot || []) {
      if (!d.itemId) continue;
      const cur = lootMap[d.itemId];
      const chance = d.chance || 0;
      if (!cur || chance > cur.chance) {
        lootMap[d.itemId] = { ...d, from: mn.name };
      }
    }
  }

  const allLoot = Object.values(lootMap).sort((a, b) => b.chance - a.chance);
  const groups: Record<string, typeof allLoot> = {};
  for (const b of RARITY_BANDS) groups[b.key] = [];
  for (const d of allLoot) groups[rarityOf(d.chance).key].push(d);

  const renderSlot = (d: LootEntry, bandKey: string) => {
    const it = itemById[d.itemId];
    if (!it) return null;
    return (
      <div class="slot" key={`${d.itemId}-${bandKey}`} onClick={() => openDetail({ type: 'item', data: it })}>
        <SpriteIcon kind="item" imageName={it.image} assets={data.invAssets} />
        {d.maxCount && d.maxCount > 1 ? <div class="count-badge">×{d.maxCount}</div> : null}
        <div class={`schance ${chanceClass(d.chance || 0)}`}>{fmtChance(d.chance || 0)}</div>
        <div class="sname">{it.name}</div>
      </div>
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
      <XPCalculator hunt={h} monsters={mons} />
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
              <div class="loot-group-head">
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
