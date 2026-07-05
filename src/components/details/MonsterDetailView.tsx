import { SpriteIcon } from '../SpriteIcon';
import { ItemHoverTip } from '../ItemHoverTip';
import { ResBars } from '../ResBars';
import {
  fmt,
  fmtChance,
  chanceClass,
  RARITY_BANDS,
  rarityOf,
  lootRarityClass,
  renderStars,
  getQuestIconItemId,
} from '../../lib/format';
import type { Monster, WikiData } from '../../lib/types';
import type { WikiIndexes } from '../../lib/indexes';
import type { DetailTarget } from '../../context/DetailContext';

interface Props {
  m: Monster;
  data: WikiData;
  indexes: WikiIndexes;
  openDetail: (t: DetailTarget) => void;
}

export function MonsterDetailView({ m, data, indexes, openDetail }: Props) {
  const { itemById, questById, huntById } = indexes;
  const loot = (m.loot || []).slice().sort((a, b) => (b.chance || 0) - (a.chance || 0));
  const groups: Record<string, typeof loot> = {};
  for (const b of RARITY_BANDS) groups[b.key] = [];
  for (const d of loot) groups[rarityOf(d.chance || 0).key].push(d);

  const melee = m.meleeAtk as { minDamage?: number; maxDamage?: number } | undefined;
  const corpseSize = m.corpseSize as { width?: number; height?: number } | undefined;
  const skills = (m.skills || []) as {
    damageType?: string;
    minDamage?: number;
    maxDamage?: number;
    effectArea?: string;
    chance?: number;
    interval?: number;
    condition?: { dotType?: string; type?: string };
  }[];
  const defenses = (m.defenses || []) as {
    damageType?: string;
    name?: string;
    minHeal?: number;
    maxHeal?: number;
    speedChange?: number;
    chance?: number;
    duration?: number;
  }[];
  const summon = m.summon as {
    maxSummons?: number;
    summons?: { monsterId: number; chance: number }[];
  } | undefined;

  const questIds = indexes.questsByMonster[m.id] || [];
  const huntIds = indexes.huntsByMonster[m.id] || [];

  return (
    <>
      <div class="detail-header">
        <SpriteIcon kind="monster" imageName={m.image} animated assets={data.monAssets} />
        <div>
          <h1>{m.name}</h1>
          <div class="sub">
            #{m.id} · {m.bestiaryRace && m.bestiaryRace !== 'NONE' ? m.bestiaryRace : 'sem raça'}
          </div>
          <div class={`diff-${m.bestiaryDifficulty || 0}`}>
            {renderStars(m.bestiaryDifficulty || 0)}
          </div>
        </div>
      </div>

      <div class="stat-grid wide">
        <div class="best-stat">
          <div class="lbl">HP</div>
          <div class="val">{fmt(m.hp)}</div>
        </div>
        <div class="best-stat">
          <div class="lbl">XP</div>
          <div class="val">{fmt(m.xp)}</div>
        </div>
        <div class="best-stat">
          <div class="lbl">gold</div>
          <div class="val">
            {m.goldCoins ? `${fmt(m.goldCoins.min)}–${fmt(m.goldCoins.max)} gp` : '—'}
          </div>
        </div>
        <div class="best-stat">
          <div class="lbl">Armor</div>
          <div class="val">{m.arm ?? '—'}</div>
        </div>
        <div class="best-stat">
          <div class="lbl">Melee</div>
          <div class="val">
            {melee ? `${melee.minDamage}–${melee.maxDamage}` : '—'}
          </div>
        </div>
        <div class="best-stat">
          <div class="lbl">Mitigação</div>
          <div class="val">{m.mitigation ?? '—'}</div>
        </div>
        <div class="best-stat">
          <div class="lbl">Corpo</div>
          <div class="val">
            {corpseSize ? `${corpseSize.width}×${corpseSize.height}` : '—'}
          </div>
        </div>
        <div class="best-stat">
          <div class="lbl">Skills</div>
          <div class="val">{skills.length}</div>
        </div>
      </div>

      {m.elementalResistances && Object.keys(m.elementalResistances).length > 0 && (
        <ResBars res={m.elementalResistances} />
      )}

      <div class="section-title">
        <span>Loots possíveis</span>
        <span class="line" />
        <span>{loot.length} itens</span>
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
              <div class="slots">
                {rows.map((d) => {
                  const it = itemById[d.itemId];
                  if (!it) return null;
                  return (
                    <ItemHoverTip
                      class={`slot ${lootRarityClass(d.chance || 0)}`}
                      key={d.itemId}
                      item={it}
                      chance={d.chance}
                      invAssets={data.invAssets}
                      rarityClass={lootRarityClass(d.chance || 0)}
                      onClick={() => openDetail({ type: 'item', data: it })}
                    >
                      <SpriteIcon kind="item" imageName={it.image} assets={data.invAssets} />
                      <div class={`schance ${chanceClass(d.chance || 0)}`}>
                        {fmtChance(d.chance || 0)}
                      </div>
                      <div class="sname">{it.name}</div>
                    </ItemHoverTip>
                  );
                })}
              </div>
            </div>
          );
        })}
        {loot.length === 0 && (
          <div class="empty-state" style={{ padding: '1rem' }}>
            Este monstro não dropa nada registrado.
          </div>
        )}
      </div>

      {m.voices && m.voices.length > 0 && (
        <>
          <div class="section-title">
            <span>Vozes</span>
            <span class="line" />
          </div>
          <div class="voice-list">
            {m.voices.map((v) => (
              <div class="desc" key={v}>
                {v}
              </div>
            ))}
          </div>
        </>
      )}

      {skills.length > 0 && (
        <>
          <div class="section-title">
            <span>Habilidades ofensivas</span>
            <span class="line" />
          </div>
          <div class="skills-list">
            {skills.map((s, i) => (
              <div class="skill-row" key={i}>
                <span class="dt">{s.damageType || '?'}</span>
                dano {s.minDamage ?? 0}–{s.maxDamage ?? 0}
                {s.effectArea ? ` · área ${s.effectArea}` : ''}
                {s.chance ? ` · chance ${s.chance}%` : ''}
                {s.interval ? ` · int ${s.interval}ms` : ''}
                {s.condition
                  ? ` · efeito ${s.condition.dotType || s.condition.type}`
                  : ''}
              </div>
            ))}
          </div>
        </>
      )}

      {defenses.length > 0 && (
        <>
          <div class="section-title">
            <span>Defesas</span>
            <span class="line" />
          </div>
          <div class="skills-list">
            {defenses.map((s, i) => (
              <div class="skill-row" key={i}>
                <span class="dt">{(s.damageType || s.name || '').toUpperCase()}</span>
                {s.minHeal != null ? ` heal ${s.minHeal}–${s.maxHeal}` : ''}
                {s.speedChange ? ` spd +${s.speedChange}` : ''}
                {s.chance ? ` · chance ${s.chance}%` : ''}
                {s.duration ? ` · duração ${s.duration}ms` : ''}
              </div>
            ))}
          </div>
        </>
      )}

      {summon?.summons?.length ? (
        <>
          <div class="section-title">
            <span>Invocação</span>
            <span class="line" />
          </div>
          <div class="skills-list">
            {summon.summons.map((s) => {
              const t = indexes.monById[s.monsterId];
              return (
                <div
                  class="skill-row link-row"
                  key={s.monsterId}
                  onClick={() => t && openDetail({ type: 'monster', data: t })}
                >
                  invoca <b>{t?.name || `#${s.monsterId}`}</b> · chance {s.chance}% · máx{' '}
                  {summon.maxSummons}
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {huntIds.length > 0 && (
        <>
          <div class="section-title">
            <span>Aparece em hunts ({huntIds.length})</span>
            <span class="line" />
          </div>
          {huntIds.map((hid) => {
            const h = huntById[hid];
            if (!h) return null;
            return (
              <div class="drop-row" key={hid} onClick={() => openDetail({ type: 'hunt', data: h })}>
                <div class="dinfo">
                  <div class="dname">{h.title}</div>
                  <div class="dsub">
                    rec {h.recommendedLevel ?? '?'} · {(h.monsters || []).length} criaturas
                  </div>
                </div>
                <span class="tag">hunt</span>
              </div>
            );
          })}
        </>
      )}

      {questIds.length > 0 && (
        <>
          <div class="section-title">
            <span>Aparece em missões ({questIds.length})</span>
            <span class="line" />
          </div>
          {questIds.map((qid) => {
            const q = questById[qid];
            if (!q) return null;
            const iconId = getQuestIconItemId(q);
            const hi = iconId ? itemById[iconId] : null;
            return (
              <div class="drop-row" key={qid} onClick={() => openDetail({ type: 'quest', data: q })}>
                {hi ? (
                  <SpriteIcon kind="item" imageName={hi.image} assets={data.invAssets} />
                ) : (
                  <span style={{ fontSize: '1.5rem' }}>📜</span>
                )}
                <div class="dinfo">
                  <div class="dname">{q.title}</div>
                  <div class="dsub">
                    lvl {q.levelMin ?? '?'}+ · {(q.missions || []).length} missões ·{' '}
                    {q.premium ? 'premium' : 'free'}
                  </div>
                </div>
                <span class="tag">quest</span>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
