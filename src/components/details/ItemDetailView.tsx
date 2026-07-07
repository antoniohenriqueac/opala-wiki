import { SpriteIcon } from '../SpriteIcon';
import { StatRow } from '../ResBars';
import { fmt, fmtChance, chanceClass, itemCategory } from '../../lib/format';
import { handLabelLong } from '../../lib/item-filters';
import type { Item, WikiData } from '../../lib/types';
import type { WikiIndexes } from '../../lib/indexes';
import type { DetailTarget } from '../../context/DetailContext';

interface Props {
  it: Item;
  data: WikiData;
  indexes: WikiIndexes;
  openDetail: (t: DetailTarget) => void;
}

function numField(obj: Item, key: string): number | undefined {
  const v = obj[key];
  return typeof v === 'number' ? v : undefined;
}

export function ItemDetailView({ it, data, indexes, openDetail }: Props) {
  const drops = indexes.dropsByItem[it.id] || [];
  const cat = itemCategory(it);
  const hands = handLabelLong(it);

  const attrs = [
    { l: 'Ataque', v: it.atk },
    { l: 'Defesa', v: it.def },
    { l: 'Armadura', v: it.arm },
    { l: 'Shielding', v: numField(it, 'shielding') },
    { l: 'Distância', v: numField(it, 'distance') },
    { l: 'Acerto', v: numField(it, 'hitPerCent') != null ? `${numField(it, 'hitPerCent')}%` : undefined },
    { l: 'Magic Lvl', v: it.magicLevel != null ? `+${it.magicLevel}` : undefined },
    { l: 'Mana Custo', v: numField(it, 'mana') },
    { l: 'Cargas', v: numField(it, 'charge') },
    {
      l: 'Duração',
      v: numField(it, 'timmingMinutes') != null ? `${numField(it, 'timmingMinutes')} min` : undefined,
    },
    { l: 'Venda NPC', v: it.npcSellPrice != null ? `${it.npcSellPrice.toLocaleString('pt-BR')} gp` : undefined },
    { l: 'Peso', v: it.weight != null ? `${it.weight}g` : undefined },
    { l: 'Mãos', v: hands ?? undefined },
  ].filter((x) => x.v != null);

  const bonus = [
    { l: 'Velocidade', v: numField(it, 'speed') != null ? `+${numField(it, 'speed')}` : undefined },
    {
      l: 'Capacidade',
      v:
        numField(it, 'increaseCapacityPercent') != null
          ? `+${numField(it, 'increaseCapacityPercent')}%`
          : undefined,
    },
    {
      l: 'Regen HP',
      v:
        numField(it, 'healthRegenGain') != null
          ? `${numField(it, 'healthRegenGain')} / ${numField(it, 'healthRegenIntervalMs')}ms`
          : undefined,
    },
    {
      l: 'Regen Mana',
      v:
        numField(it, 'manaRegenGain') != null
          ? `${numField(it, 'manaRegenGain')} / ${numField(it, 'manaRegenIntervalMs')}ms`
          : undefined,
    },
    { l: 'Prot. Física', v: numField(it, 'protectionPhysical') != null ? `${numField(it, 'protectionPhysical')}%` : undefined },
    { l: 'Prot. Fogo', v: numField(it, 'protectionFire') != null ? `${numField(it, 'protectionFire')}%` : undefined },
    { l: 'Prot. Gelo', v: numField(it, 'protectionIce') != null ? `${numField(it, 'protectionIce')}%` : undefined },
    { l: 'Prot. Terra', v: numField(it, 'protectionEarth') != null ? `${numField(it, 'protectionEarth')}%` : undefined },
    { l: 'Prot. Energia', v: numField(it, 'protectionEnergy') != null ? `${numField(it, 'protectionEnergy')}%` : undefined },
    { l: 'Prot. Morte', v: numField(it, 'protectionDeath') != null ? `${numField(it, 'protectionDeath')}%` : undefined },
    { l: 'Prot. Santo', v: numField(it, 'protectionHoly') != null ? `${numField(it, 'protectionHoly')}%` : undefined },
    {
      l: 'Crítico',
      v:
        numField(it, 'criticalHitChance') != null
          ? `${numField(it, 'criticalHitChance')}% / +${numField(it, 'criticalExtraDamage')}%`
          : undefined,
    },
  ].filter((x) => x.v != null);

  return (
    <>
      <div class="detail-header">
        <SpriteIcon kind="item" imageName={it.image} assets={data.invAssets} />
        <div>
          <h1>{it.name}</h1>
          <div class="sub">
            #{it.id} · {cat}
            {it.weaponType ? ` · ${it.weaponType}` : ''}
            {hands ? ` · ${hands}` : ''}
            {it.slot ? ` · ${it.slot}` : ''}
            {it.weight ? ` · ${it.weight}g` : ''}
          </div>
          <div class="card-tags">
            {it.rarityBorderTier && (
              <span class={`tag rare-${it.rarityBorderTier}`}>T{it.rarityBorderTier}</span>
            )}
            {it.classification && <span class="tag">class {it.classification}</span>}
            {it.vocation?.map((v) => (
              <span class="tag" key={v}>
                {v}
              </span>
            ))}
            {it.levelMin && <span class="tag">lvl {it.levelMin}+</span>}
            {hands && (
              <span class={`tag hand-tag hand-tag-${hands === 'Duas mãos' ? '2h' : '1h'}`}>
                {hands === 'Duas mãos' ? '2H' : '1H'}
              </span>
            )}
            {it.damageType && <span class="tag">{it.damageType}</span>}
          </div>
        </div>
      </div>

      {it.description && <div class="desc">{it.description}</div>}

      {(attrs.length > 0 || bonus.length > 0) && (
        <div class="detail-cols">
          {attrs.length > 0 && (
            <div class="stat-block">
              <h3>Atributos</h3>
              {attrs.map((a) => (
                <StatRow key={a.l} label={a.l} value={a.v} />
              ))}
            </div>
          )}
          {bonus.length > 0 && (
            <div class="stat-block">
              <h3>Bônus & proteções</h3>
              {bonus.map((a) => (
                <StatRow key={a.l} label={a.l} value={a.v} />
              ))}
            </div>
          )}
        </div>
      )}

      <div class="section-title">
        <span>Dropado por ({drops.length})</span>
        <span class="line" />
      </div>
      {drops.length === 0 ? (
        <div class="empty-state" style={{ padding: '1rem' }}>
          Nenhum monstro dropa este item.
        </div>
      ) : (
        drops.map((d) => {
          const mn = indexes.monById[d.monsterId];
          if (!mn) return null;
          return (
            <div
              class="drop-row"
              key={d.monsterId}
              onClick={() => openDetail({ type: 'monster', data: mn })}
            >
              <SpriteIcon kind="monster" imageName={mn.image} assets={data.monAssets} />
              <div class="dinfo">
                <div class="dname">{mn.name}</div>
                <div class="dsub">
                  {mn.bestiaryRace || '—'} · dif {mn.bestiaryDifficulty ?? '?'} · HP {fmt(mn.hp)}
                </div>
              </div>
              <div class={`loot-chance ${chanceClass(d.chance)}`}>
                {fmtChance(d.chance)}
                {d.maxCount > 1 ? ` · ×${d.maxCount}` : ''}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
