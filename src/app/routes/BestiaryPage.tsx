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
import { fmt, matchQuery, renderStars } from '../../lib/format';
import type { Monster } from '../../lib/types';

const CAP = 400;

function raceLabel(race: string): string {
  if (race === 'NONE') return 'Nenhuma';
  return race
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function BestiaryPage(_props: { path?: string }) {
  const { data } = useWiki();
  const { openDetail } = useDetail();
  const [query, setQuery] = useState('');
  const [race, setRace] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);

  const races = useMemo(
    () =>
      [...new Set(data.monsters.map((m) => m.bestiaryRace).filter(Boolean))].sort() as string[],
    [data.monsters],
  );
  const diffs = useMemo(
    () =>
      [...new Set(data.monsters.map((m) => m.bestiaryDifficulty).filter((v) => v != null))].sort(
        (a, b) => a! - b!,
      ) as number[],
    [data.monsters],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.monsters
      .filter((m: Monster) => {
        if (race && m.bestiaryRace !== race) return false;
        if (difficulty != null && m.bestiaryDifficulty !== difficulty) return false;
        if (q && !matchQuery(m.name, q) && !matchQuery(m.id, q)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          (a.bestiaryDifficulty || 0) - (b.bestiaryDifficulty || 0) ||
          a.name.localeCompare(b.name),
      );
  }, [data.monsters, query, race, difficulty]);

  const clear = () => {
    setQuery('');
    setRace(null);
    setDifficulty(null);
  };

  const activeFilters = (race ? 1 : 0) + (difficulty != null ? 1 : 0);

  return (
    <>
      <PageHeader
        title="Bestiário"
        description={`${data.monsters.length} criaturas — HP, XP, resistências, loot com % de chance, vozes e habilidades.`}
        searchValue={query}
        onSearch={setQuery}
        searchInputId="bestiary-search"
        searchPlaceholder="Nome do monstro…"
      />
      <WikiFilterPanel activeCount={activeFilters}>
        <FilterBlock label="Raça">
          <FilterChipRow>
            <button type="button" class={`chip chip-sm${!race ? ' active' : ''}`} onClick={() => setRace(null)}>
              Todas
            </button>
            {races.map((r) => (
              <button
                key={r}
                type="button"
                class={`chip chip-sm${race === r ? ' active' : ''}`}
                onClick={() => setRace(race === r ? null : r)}
              >
                {raceLabel(r)}
              </button>
            ))}
          </FilterChipRow>
        </FilterBlock>

        <FilterBlock label="Dificuldade">
          <FilterChipRow>
            <button
              type="button"
              class={`chip chip-sm${difficulty == null ? ' active' : ''}`}
              onClick={() => setDifficulty(null)}
            >
              Todas
            </button>
            {diffs.map((d) => (
              <button
                key={d}
                type="button"
                class={`chip chip-sm diff-${d}${difficulty === d ? ' active' : ''}`}
                onClick={() => setDifficulty(difficulty === d ? null : d)}
                title={`Dificuldade ${d}`}
              >
                {renderStars(d)}
              </button>
            ))}
          </FilterChipRow>
        </FilterBlock>

        <FilterFooter activeCount={activeFilters} onClear={clear} />
      </WikiFilterPanel>
      <StatsBar count={list.length} total={data.monsters.length} label="monstros" capped={CAP} />
      {list.length === 0 ? (
        <div class="empty-state">Nenhum monstro encontrado.</div>
      ) : (
        <div class="grid">
          {list.slice(0, CAP).map((m) => (
            <div class="card" key={m.id} onClick={() => openDetail({ type: 'monster', data: m })}>
              <div class="card-name">{m.name}</div>
              <div class="card-icon">
                <SpriteIcon kind="monster" imageName={m.image} animated assets={data.monAssets} />
              </div>
              <div class="card-tags">
                {m.bestiaryDifficulty ? (
                  <span class={`tag diff-${m.bestiaryDifficulty}`}>
                    {renderStars(m.bestiaryDifficulty)}
                  </span>
                ) : null}
                {m.bestiaryRace && m.bestiaryRace !== 'NONE' && (
                  <span class="tag">{raceLabel(m.bestiaryRace)}</span>
                )}
                {(m.loot || []).length > 0 && (
                  <span class="tag">{m.loot!.length} drops</span>
                )}
              </div>
              <div class="card-sub">
                HP {fmt(m.hp)} · XP {fmt(m.xp)}
                {m.goldCoins ? ` · ${fmt(m.goldCoins.max)} gp` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
