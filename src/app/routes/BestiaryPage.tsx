import { useMemo, useState } from 'preact/hooks';
import { useWiki } from '../../context/WikiContext';
import { useDetail } from '../../context/DetailContext';
import { SearchBar } from '../../components/SearchBar';
import { SpriteIcon } from '../../components/SpriteIcon';
import { ClearFiltersButton, StatsBar } from '../../components/FilterHelpers';
import { fmt, matchQuery, renderStars } from '../../lib/format';
import type { Monster } from '../../lib/types';

const CAP = 400;

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

  return (
    <>
      <header class="page-header">
        <h1>Bestiário</h1>
        <p>
          {data.monsters.length} criaturas — HP, XP, resistências, loot com % de chance, vozes e
          habilidades.
        </p>
      </header>
      <div class="filter-panel panel">
        <SearchBar value={query} onInput={setQuery} placeholder="Buscar monstro… (/)"/>
        <div class="field">
          <label>Raça</label>
          <div class="chip-group">
            <button type="button" class={`chip${!race ? ' active' : ''}`} onClick={() => setRace(null)}>
              Todas
            </button>
            {races.map((r) => (
              <button
                key={r}
                type="button"
                class={`chip${race === r ? ' active' : ''}`}
                onClick={() => setRace(race === r ? null : r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div class="field">
          <label>Dificuldade</label>
          <div class="chip-group">
            <button
              type="button"
              class={`chip${difficulty == null ? ' active' : ''}`}
              onClick={() => setDifficulty(null)}
            >
              Todas
            </button>
            {diffs.map((d) => (
              <button
                key={d}
                type="button"
                class={`chip diff-${d}${difficulty === d ? ' active' : ''}`}
                onClick={() => setDifficulty(difficulty === d ? null : d)}
              >
                {renderStars(d)}
              </button>
            ))}
          </div>
        </div>
        <ClearFiltersButton onClear={clear} />
      </div>
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
                  <span class="tag">{m.bestiaryRace}</span>
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
