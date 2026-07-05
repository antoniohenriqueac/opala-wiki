import { SpriteIcon } from '../SpriteIcon';
import {
  fmt,
  MISSION_TYPE_LABEL,
  MISSION_TYPE_COLOR,
  itemCategory,
  getQuestIconItemId,
} from '../../lib/format';
import type { Quest, QuestMission, QuestReward, WikiData } from '../../lib/types';
import type { WikiIndexes } from '../../lib/indexes';
import type { DetailTarget } from '../../context/DetailContext';

interface Props {
  q: Quest;
  data: WikiData;
  indexes: WikiIndexes;
  openDetail: (t: DetailTarget) => void;
}

function RewardPill({
  r,
  data,
  indexes,
  openDetail,
}: {
  r: QuestReward;
  data: WikiData;
  indexes: WikiIndexes;
  openDetail: (t: DetailTarget) => void;
}) {
  if (r.type === 'item' && r.itemId) {
    const it = indexes.itemById[r.itemId];
    return (
      <div
        class="reward-pill"
        onClick={() => it && openDetail({ type: 'item', data: it })}
      >
        {it && <SpriteIcon kind="item" imageName={it.image} size={24} assets={data.invAssets} />}
        <span>
          {it?.name || `Item #${r.itemId}`}
          {r.amount && r.amount > 1 ? ` ×${r.amount}` : ''}
        </span>
      </div>
    );
  }
  if (r.type === 'gold') {
    return (
      <div class="reward-pill">
        <span style={{ color: 'var(--gold)' }}>◆</span>{' '}
        {Number(r.amount || 0).toLocaleString('pt-BR')} gold
      </div>
    );
  }
  if (r.type === 'unlock_hunt' && r.huntId) {
    const h = indexes.huntById[r.huntId];
    return (
      <div
        class="reward-pill link-row"
        onClick={() => h && openDetail({ type: 'hunt', data: h })}
      >
        ☰ unlock hunt: {h?.title || `#${r.huntId}`}
      </div>
    );
  }
  return <div class="reward-pill mute">{JSON.stringify(r)}</div>;
}

function MissionBlock({
  m,
  idx,
  data,
  indexes,
  openDetail,
}: {
  m: QuestMission;
  idx: number;
  data: WikiData;
  indexes: WikiIndexes;
  openDetail: (t: DetailTarget) => void;
}) {
  const typeLabel = MISSION_TYPE_LABEL[m.type] || m.type.toUpperCase();
  const typeClr = MISSION_TYPE_COLOR[m.type] || 'var(--text-dim)';

  return (
    <div class="mission-block">
      <div class="mission-head">
        <span class="mission-idx">{idx}</span>
        <div>
          <div class="mission-name">{m.title || `Missão ${idx}`}</div>
          <div class="mission-sub">
            <span class="mission-type" style={{ color: typeClr, borderColor: typeClr }}>
              {typeLabel}
            </span>
            {m.description ? ` · ${m.description}` : ''}
          </div>
        </div>
      </div>

      {m.type === 'monster_task' && m.monsterTasks && (
        <div class="loot-rows">
          {m.monsterTasks.map((t) => {
            const mn = indexes.monById[t.monsterId];
            return (
              <div
                class="drop-row"
                key={t.monsterId}
                onClick={() => mn && openDetail({ type: 'monster', data: mn })}
              >
                {mn && (
                  <SpriteIcon kind="monster" imageName={mn.image} assets={data.monAssets} />
                )}
                <div class="dinfo">
                  <div class="dname">{mn?.name || `#${t.monsterId}`}</div>
                  <div class="dsub">HP {mn ? fmt(mn.hp) : '?'}</div>
                </div>
                <span class="tag" style={{ color: 'var(--accent)' }}>
                  ×{(t.amount || 0).toLocaleString('pt-BR')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {m.type === 'current_hunt' && m.rooms && (
        <div class="rooms">
          {m.rooms.map((r, ri) => (
            <div class="room-block" key={r.id}>
              <div class="room-title">
                Sala {ri + 1} — {r.title || `Mapa ${r.mapId}`}
                {r.mapId ? <span class="dim"> map#{r.mapId}</span> : null}
              </div>
              {(r.waves || []).map((w, wi) => (
                <div class="wave-row" key={wi}>
                  <div class="wave-label">wave {wi + 1}</div>
                  <div class="wave-mons">
                    {(w.monsterIds || []).map((mid) => {
                      const mn = indexes.monById[mid];
                      return (
                        <span
                          class="pill"
                          key={mid}
                          onClick={() => mn && openDetail({ type: 'monster', data: mn })}
                        >
                          {mn && (
                            <SpriteIcon
                              kind="monster"
                              imageName={mn.image}
                              size={20}
                              assets={data.monAssets}
                            />
                          )}
                          {mn?.name || `#${mid}`}
                        </span>
                      );
                    })}
                  </div>
                  <div class="wave-meta">
                    {w.minMonsters ?? '?'}–{w.maxMonsters ?? '?'}
                    {w.waveAmount ? ` · ×${w.waveAmount}` : ''}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {m.type === 'deliver_items' && m.deliveryItems && (
        <div class="loot-rows">
          {m.deliveryItems.map((t) => {
            const it = indexes.itemById[t.itemId];
            return (
              <div
                class="drop-row"
                key={t.itemId}
                onClick={() => it && openDetail({ type: 'item', data: it })}
              >
                {it && <SpriteIcon kind="item" imageName={it.image} assets={data.invAssets} />}
                <div class="dinfo">
                  <div class="dname">{it?.name || `#${t.itemId}`}</div>
                  <div class="dsub">{it ? itemCategory(it) : ''}</div>
                </div>
                <span class="tag">×{(t.amount || 0).toLocaleString('pt-BR')}</span>
              </div>
            );
          })}
        </div>
      )}

      {m.rewards && m.rewards.length > 0 && (
        <div class="rewards">
          <div class="rewards-title">Recompensas</div>
          <div class="rewards-list">
            {m.rewards.map((r, i) => (
              <RewardPill key={i} r={r} data={data} indexes={indexes} openDetail={openDetail} />
            ))}
          </div>
        </div>
      )}

      {m.rewardChoices && m.rewardChoices.length > 0 && (
        <div class="rewards">
          <div class="rewards-title">Escolha uma</div>
          {m.rewardChoices.map((c, i) => (
            <div class="reward-choice" key={i}>
              <div class="reward-choice-label">{c.label || c.id || '?'}</div>
              <div class="rewards-list">
                {(c.rewards || []).map((r, j) => (
                  <RewardPill key={j} r={r} data={data} indexes={indexes} openDetail={openDetail} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestDetailView({ q, data, indexes, openDetail }: Props) {
  const rewardItem = (() => {
    const id = getQuestIconItemId(q);
    return id ? indexes.itemById[id] : null;
  })();
  const requiredQuests = (q.requiredQuestIds || [])
    .map((id) => indexes.questById[id])
    .filter(Boolean);

  const monsterAgg: Record<
    number,
    { count: number; missions: Set<string>; inWaves?: boolean }
  > = {};
  for (const m of q.missions || []) {
    for (const t of m.monsterTasks || []) {
      (monsterAgg[t.monsterId] ??= { count: 0, missions: new Set() });
      monsterAgg[t.monsterId].count += t.amount || 0;
      monsterAgg[t.monsterId].missions.add(m.title);
    }
    for (const r of m.rooms || [])
      for (const w of r.waves || [])
        for (const id of w.monsterIds || []) {
          (monsterAgg[id] ??= { count: 0, missions: new Set(), inWaves: true });
          monsterAgg[id].missions.add(m.title);
          monsterAgg[id].inWaves = true;
        }
  }
  const monsterList = Object.entries(monsterAgg)
    .map(([id, d]) => ({
      id: +id,
      ...d,
      missions: [...d.missions],
    }))
    .sort((a, b) => (b.count || 0) - (a.count || 0));

  return (
    <>
      <div class="detail-header">
        {rewardItem ? (
          <SpriteIcon kind="item" imageName={rewardItem.image} assets={data.invAssets} />
        ) : (
          <span style={{ fontSize: '3rem', color: 'var(--gold)' }}>📜</span>
        )}
        <div>
          <h1>{q.title}</h1>
          <div class="sub">
            #{q.id} · {(q.missions || []).length} missões
          </div>
          <div class="card-tags">
            {q.levelMin && <span class="tag">lvl {q.levelMin}+</span>}
            {q.premium ? (
              <span class="tag premium">PREMIUM</span>
            ) : (
              <span class="tag">FREE</span>
            )}
            {q.unlockedByDefault && <span class="tag">desbloqueada</span>}
            {q.repeatPolicy?.type && (
              <span class="tag">repeat: {q.repeatPolicy.type}</span>
            )}
          </div>
        </div>
      </div>

      {q.description && <div class="desc">{q.description}</div>}

      {requiredQuests.length > 0 && (
        <div class="stat-block">
          <h3>Missões pré-requisito</h3>
          {requiredQuests.map((rq) => {
            const iconId = getQuestIconItemId(rq!);
            const hi = iconId ? indexes.itemById[iconId] : null;
            return (
              <div
                class="drop-row"
                key={rq!.id}
                onClick={() => openDetail({ type: 'quest', data: rq! })}
              >
                {hi ? (
                  <SpriteIcon kind="item" imageName={hi.image} assets={data.invAssets} />
                ) : (
                  <span>📜</span>
                )}
                <div class="dinfo">
                  <div class="dname">{rq!.title}</div>
                  <div class="dsub">
                    lvl {rq!.levelMin ?? '?'}+ · {(rq!.missions || []).length} missões
                  </div>
                </div>
                <span class="tag">req</span>
              </div>
            );
          })}
        </div>
      )}

      <div class="stat-block">
        <h3>Missões ({(q.missions || []).length})</h3>
        {(q.missions || []).map((m, i) => (
          <MissionBlock
            key={m.id}
            m={m}
            idx={i + 1}
            data={data}
            indexes={indexes}
            openDetail={openDetail}
          />
        ))}
      </div>

      {monsterList.length > 0 && (
        <div class="stat-block">
          <h3>Todos os monstros envolvidos ({monsterList.length})</h3>
          {monsterList.map((row) => {
            const mn = indexes.monById[row.id];
            return (
              <div
                class="drop-row"
                key={row.id}
                onClick={() => mn && openDetail({ type: 'monster', data: mn })}
              >
                {mn && (
                  <SpriteIcon kind="monster" imageName={mn.image} assets={data.monAssets} />
                )}
                <div class="dinfo">
                  <div class="dname">{mn?.name || `#${row.id}`}</div>
                  <div class="dsub">
                    {mn
                      ? `${mn.bestiaryRace || '—'} · dif ${mn.bestiaryDifficulty ?? '?'} · HP ${fmt(mn.hp)}`
                      : ''}
                  </div>
                </div>
                <span class="tag">
                  {row.count > 0
                    ? `×${row.count.toLocaleString('pt-BR')}`
                    : row.inWaves
                      ? 'wave'
                      : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
