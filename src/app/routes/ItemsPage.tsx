import { useMemo, useState } from 'preact/hooks';
import { useWiki } from '../../context/WikiContext';
import { useDetail } from '../../context/DetailContext';
import { SearchBar } from '../../components/SearchBar';
import { SpriteIcon } from '../../components/SpriteIcon';
import { ClearFiltersButton, StatsBar } from '../../components/FilterHelpers';
import { itemCategory, matchQuery } from '../../lib/format';
import type { Item } from '../../lib/types';

const CAP = 400;

export function ItemsPage(_props: { path?: string }) {
  const { data, indexes } = useWiki();
  const { openDetail } = useDetail();
  const [query, setQuery] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [weaponType, setWeaponType] = useState<string | null>(null);
  const [rarity, setRarity] = useState<number | null>(null);
  const [vocation, setVocation] = useState<string | null>(null);

  const slots = useMemo(
    () => [...new Set(data.items.map((i) => i.slot).filter(Boolean))].sort() as string[],
    [data.items],
  );
  const wtypes = useMemo(
    () => [...new Set(data.items.map((i) => i.weaponType).filter(Boolean))].sort() as string[],
    [data.items],
  );
  const rarities = useMemo(
    () =>
      [...new Set(data.items.map((i) => i.rarityBorderTier).filter((v) => v != null))].sort(
        (a, b) => a! - b!,
      ) as number[],
    [data.items],
  );
  const vocations = useMemo(() => {
    const set = new Set<string>();
    for (const i of data.items) for (const v of i.vocation || []) set.add(v);
    return [...set].sort();
  }, [data.items]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.items
      .filter((i: Item) => {
        if (slot && i.slot !== slot) return false;
        if (weaponType && i.weaponType !== weaponType) return false;
        if (rarity != null && i.rarityBorderTier !== rarity) return false;
        if (vocation && !(i.vocation || []).includes(vocation)) return false;
        if (q && !matchQuery(i.name, q) && !matchQuery(i.id, q)) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.items, query, slot, weaponType, rarity, vocation]);

  const clear = () => {
    setQuery('');
    setSlot(null);
    setWeaponType(null);
    setRarity(null);
    setVocation(null);
  };

  return (
    <>
      <header class="page-header">
        <h1>Itens</h1>
        <p>
          {data.items.length} itens — armas, armaduras, consumíveis. Veja stats, proteções e quem
          dropa cada item.
        </p>
      </header>
      <div class="filter-panel panel">
        <SearchBar value={query} onInput={setQuery} placeholder="Buscar item…" />
        <div class="field">
          <label>Slot</label>
          <div class="chip-group">
            <button type="button" class={`chip${!slot ? ' active' : ''}`} onClick={() => setSlot(null)}>
              Todos
            </button>
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                class={`chip${slot === s ? ' active' : ''}`}
                onClick={() => setSlot(slot === s ? null : s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div class="field">
          <label>Arma</label>
          <div class="chip-group">
            <button
              type="button"
              class={`chip${!weaponType ? ' active' : ''}`}
              onClick={() => setWeaponType(null)}
            >
              Todas
            </button>
            {wtypes.map((w) => (
              <button
                key={w}
                type="button"
                class={`chip${weaponType === w ? ' active' : ''}`}
                onClick={() => setWeaponType(weaponType === w ? null : w)}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        <div class="field">
          <label>Raridade</label>
          <div class="chip-group">
            <button
              type="button"
              class={`chip${rarity == null ? ' active' : ''}`}
              onClick={() => setRarity(null)}
            >
              Todas
            </button>
            {rarities.map((r) => (
              <button
                key={r}
                type="button"
                class={`chip rare-${r}${rarity === r ? ' active' : ''}`}
                onClick={() => setRarity(rarity === r ? null : r)}
              >
                T{r}
              </button>
            ))}
          </div>
        </div>
        {vocations.length > 0 && (
          <div class="field">
            <label>Vocação</label>
            <div class="chip-group">
              <button
                type="button"
                class={`chip${!vocation ? ' active' : ''}`}
                onClick={() => setVocation(null)}
              >
                Todas
              </button>
              {vocations.map((v) => (
                <button
                  key={v}
                  type="button"
                  class={`chip${vocation === v ? ' active' : ''}`}
                  onClick={() => setVocation(vocation === v ? null : v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
        <ClearFiltersButton onClear={clear} />
      </div>
      <StatsBar count={list.length} total={data.items.length} label="itens" capped={CAP} />
      {list.length === 0 ? (
        <div class="empty-state">Nenhum item encontrado.</div>
      ) : (
        <div class="grid">
          {list.slice(0, CAP).map((it) => {
            const cat = itemCategory(it);
            const dropCount = (indexes.dropsByItem[it.id] || []).length;
            const meta = [
              it.atk != null ? `atk ${it.atk}` : null,
              it.arm != null ? `arm ${it.arm}` : null,
              it.def != null && it.atk == null ? `def ${it.def}` : null,
            ]
              .filter(Boolean)
              .join(' · ') || cat;
            return (
              <div class="card" key={it.id} onClick={() => openDetail({ type: 'item', data: it })}>
                <div class="card-name">{it.name}</div>
                <div class="card-icon">
                  <SpriteIcon kind="item" imageName={it.image} assets={data.invAssets} />
                </div>
                <div class="card-tags">
                  {it.rarityBorderTier && (
                    <span class={`tag rare-${it.rarityBorderTier}`}>T{it.rarityBorderTier}</span>
                  )}
                  {it.slot && <span class="tag">{it.slot}</span>}
                  {it.weaponType && <span class="tag">{it.weaponType}</span>}
                  {dropCount > 0 && <span class="tag">{dropCount} drops</span>}
                </div>
                <div class="card-sub">{meta}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
