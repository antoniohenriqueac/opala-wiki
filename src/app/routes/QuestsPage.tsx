import { useMemo, useState } from 'preact/hooks';
import { useWiki } from '../../context/WikiContext';
import { useDetail } from '../../context/DetailContext';
import { PageHeader } from '../../components/PageHeader';
import { SpriteIcon } from '../../components/SpriteIcon';
import { StatsBar } from '../../components/FilterHelpers';
import {
  FilterBlock,
  FilterChipRow,
  FilterFooter,
  WikiFilterPanel,
} from '../../components/WikiFilterLayout';
import { matchQuery, questTypeSummary, MISSION_TYPE_LABEL, getQuestIconItemId } from '../../lib/format';
import type { Quest } from '../../lib/types';

export function QuestsPage(_props: { path?: string }) {
  const { data, indexes } = useWiki();
  const { openDetail } = useDetail();
  const [query, setQuery] = useState('');
  const [premium, setPremium] = useState<'all' | 'free' | 'premium'>('all');
  const [questType, setQuestType] = useState<string | null>(null);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const q of data.quests || [])
      for (const m of q.missions || []) set.add(m.type);
    return [...set].sort();
  }, [data.quests]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data.quests || [])
      .filter((qq: Quest) => {
        if (premium === 'free' && qq.premium) return false;
        if (premium === 'premium' && !qq.premium) return false;
        if (questType) {
          const has = (qq.missions || []).some((m) => m.type === questType);
          if (!has) return false;
        }
        if (q) {
          if (
            !matchQuery(qq.title, q) &&
            !matchQuery(qq.id, q) &&
            !matchQuery(qq.description || '', q)
          )
            return false;
        }
        return true;
      })
      .sort(
        (a, b) => (a.levelMin || 0) - (b.levelMin || 0) || a.title.localeCompare(b.title),
      );
  }, [data.quests, query, premium, questType]);

  const clear = () => {
    setQuery('');
    setPremium('all');
    setQuestType(null);
  };

  const activeFilters =
    (premium !== 'all' ? 1 : 0) + (questType ? 1 : 0);

  return (
    <>
      <PageHeader
        title="Missões"
        description={`${(data.quests || []).length} missões — objetivos, salas, waves, recompensas e monstros envolvidos.`}
        searchValue={query}
        onSearch={setQuery}
        searchInputId="quests-search"
        searchPlaceholder="Nome da missão…"
      />
      <WikiFilterPanel>
        <div class="wiki-filters-row">
          <FilterBlock label="Acesso">
            <FilterChipRow>
              {(['all', 'free', 'premium'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  class={`chip chip-sm${premium === p ? ' active' : ''}${p === 'premium' ? ' quest-chip-premium' : ''}`}
                  onClick={() => setPremium(p)}
                >
                  {p === 'all' ? 'Todas' : p === 'free' ? 'Grátis' : 'Premium'}
                </button>
              ))}
            </FilterChipRow>
          </FilterBlock>
        </div>

        <FilterBlock label="Tipo de missão">
          <FilterChipRow>
            <button
              type="button"
              class={`chip chip-sm${!questType ? ' active' : ''}`}
              onClick={() => setQuestType(null)}
            >
              Todos
            </button>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                class={`chip chip-sm${questType === t ? ' active' : ''}`}
                onClick={() => setQuestType(questType === t ? null : t)}
              >
                {MISSION_TYPE_LABEL[t] || t}
              </button>
            ))}
          </FilterChipRow>
        </FilterBlock>

        <FilterFooter activeCount={activeFilters} onClear={clear} />
      </WikiFilterPanel>
      <StatsBar
        count={list.length}
        total={(data.quests || []).length}
        label="missões"
      />
      {list.length === 0 ? (
        <div class="empty-state">Nenhuma missão encontrada.</div>
      ) : (
        <div class="grid">
          {list.map((q) => {
            const iconItemId = getQuestIconItemId(q);
            const rewardItem = iconItemId ? indexes.itemById[iconItemId] : null;
            const typeLabel = questTypeSummary(q.missions || []);
            return (
              <div class="card" key={q.id} onClick={() => openDetail({ type: 'quest', data: q })}>
                <div class="card-name">{q.title}</div>
                <div class="card-icon">
                  {rewardItem ? (
                    <SpriteIcon kind="item" imageName={rewardItem.image} assets={data.invAssets} />
                  ) : (
                    <span style={{ fontSize: '2.5rem', color: 'var(--gold)' }}>📜</span>
                  )}
                </div>
                <div class="card-tags">
                  {q.levelMin != null && <span class="tag">lvl {q.levelMin}+</span>}
                  {q.premium ? (
                    <span class="tag premium">PREMIUM</span>
                  ) : (
                    <span class="tag">FREE</span>
                  )}
                  {q.requiredQuestIds && q.requiredQuestIds.length > 0 && (
                    <span class="tag">req #{q.requiredQuestIds.join(',')}</span>
                  )}
                </div>
                <div class="card-sub">
                  {(q.missions || []).length} missões · {typeLabel}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
