import { useMemo, useState } from 'preact/hooks';
import { useWiki } from '../../context/WikiContext';
import { useDetail } from '../../context/DetailContext';
import { HuntFilters, type HuntFilterState } from '../../components/HuntFilters';
import { HuntCard } from '../../components/HuntCard';
import { SearchBar } from '../../components/SearchBar';
import {
  buildCalcSettings,
  computeHuntMetrics,
  huntMonsters,
  isHuntEligible,
} from '../../lib/hunt-metrics';
import { matchQuery } from '../../lib/format';

export function HuntsPage(_props: { path?: string }) {
  const { data, indexes } = useWiki();
  const { openDetail } = useDetail();
  const [filters, setFilters] = useState<HuntFilterState>({
    charLevel: 50,
    partySize: 1,
    vocation: 'ALL',
    sort: 'xp',
    minXpHour: 0,
    minProfitHour: 0,
    hidePremium: false,
    query: '',
  });

  const patch = (p: Partial<HuntFilterState>) => setFilters((s) => ({ ...s, ...p }));

  const results = useMemo(() => {
    const settings = buildCalcSettings(filters.partySize, filters.charLevel, filters.vocation);
    const q = filters.query.trim().toLowerCase();

    let list = (data.hunts || [])
      .filter((h) => {
        if (filters.hidePremium && h.isPremmium) return false;
        if (!isHuntEligible(h, filters.charLevel)) return false;
        if (q) {
          const matchTitle = matchQuery(h.title, q) || matchQuery(h.id, q);
          const matchMon = (h.monsters || []).some(
            (id) => indexes.monById[id] && matchQuery(indexes.monById[id].name, q),
          );
          if (!matchTitle && !matchMon) return false;
        }
        return true;
      })
      .map((h) => {
        const monsters = huntMonsters(h, indexes.monById);
        return computeHuntMetrics(h, monsters, indexes.itemById, settings);
      })
      .filter(
        (m) =>
          m.xpPerHour >= filters.minXpHour && m.profitPerHour >= filters.minProfitHour,
      );

    const cmp = {
      xp: (a: typeof list[0], b: typeof list[0]) => b.xpPerHour - a.xpPerHour,
      profit: (a: typeof list[0], b: typeof list[0]) => b.profitPerHour - a.profitPerHour,
      level: (a: typeof list[0], b: typeof list[0]) =>
        (a.hunt.recommendedLevel || 0) - (b.hunt.recommendedLevel || 0),
      name: (a: typeof list[0], b: typeof list[0]) =>
        a.hunt.title.localeCompare(b.hunt.title),
    }[filters.sort];

    list.sort(cmp);
    return list;
  }, [data.hunts, filters, indexes]);

  return (
    <>
      <header class="page-header">
        <h1>Hunt Finder</h1>
        <p>Encontre as melhores hunts para o seu personagem — XP/h e lucro estimado.</p>
      </header>
      <SearchBar value={filters.query} onInput={(q) => patch({ query: q })} placeholder="Buscar hunt ou criatura…" />
      <HuntFilters state={filters} onChange={patch} />
      <div class="stats-bar">
        <span>
          <strong>{results.length}</strong> hunts elegíveis
        </span>
        <span>
          Level <strong class="stat-gold">{filters.charLevel}</strong> ·{' '}
          {filters.partySize === 1 ? 'Solo' : filters.partySize === 2 ? 'Duo' : 'Party x4'}
        </span>
      </div>
      {results.length === 0 ? (
        <div class="empty-state">Nenhuma hunt encontrada com esses filtros.</div>
      ) : (
        <div class="grid">
          {results.map((m) => (
            <HuntCard
              key={m.hunt.id}
              metrics={m}
              onClick={() => openDetail({ type: 'hunt', data: m.hunt })}
            />
          ))}
        </div>
      )}
    </>
  );
}
