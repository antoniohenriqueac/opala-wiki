import { useMemo, useState, useEffect } from 'preact/hooks';
import { useWiki } from '../../context/WikiContext';
import { useDetail } from '../../context/DetailContext';
import { PageHeader } from '../../components/PageHeader';
import { SpriteIcon } from '../../components/SpriteIcon';
import { ItemHoverTip } from '../../components/ItemHoverTip';
import { StatsBar } from '../../components/FilterHelpers';
import {
  FilterBlock,
  FilterChipRow,
  FilterFooter,
  WikiFilterPanel,
} from '../../components/WikiFilterLayout';
import { itemCategory, matchQuery } from '../../lib/format';
import {
  filterItems,
  handLabel,
  loadItemFilters,
  saveItemFilters,
  slotLabel,
  sortItemsByLevel,
  type HandFilter,
  vocationLabel,
  weaponTypeLabel,
} from '../../lib/item-filters';

const CAP = 400;
const LEVEL_PRESETS = [
  { label: '1–20', min: 1, max: 20 },
  { label: '20–50', min: 20, max: 50 },
  { label: '50–80', min: 50, max: 80 },
  { label: '80+', min: 80, max: null as number | null },
];

export function ItemsPage(_props: { path?: string }) {
  const { data, indexes } = useWiki();
  const { openDetail } = useDetail();
  const saved = loadItemFilters();
  const [query, setQuery] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [weaponType, setWeaponType] = useState<string | null>(null);
  const [hands, setHands] = useState<HandFilter | null>(null);
  const [rarity, setRarity] = useState<number | null>(null);
  const [vocation, setVocation] = useState<string | null>(saved.vocation ?? null);
  const [levelMin, setLevelMin] = useState<number | null>(null);
  const [levelMax, setLevelMax] = useState<number | null>(null);

  useEffect(() => {
    saveItemFilters({ vocation });
  }, [vocation]);

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

  const showHandsFilter = slot === 'HAND' || !!weaponType || !!hands;

  useEffect(() => {
    if (!showHandsFilter && hands) setHands(null);
  }, [showHandsFilter, hands]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = filterItems(data.items, {
      slot,
      weaponType,
      hands,
      rarity,
      vocation: q === 'kina' ? 'KNIGHT' : vocation,
      levelMin,
      levelMax,
    }).filter((i) => {
      if (!q || q === 'kina') return true;
      return matchQuery(i.name, q) || matchQuery(String(i.id), q);
    });
    return sortItemsByLevel(filtered);
  }, [data.items, query, slot, weaponType, hands, rarity, vocation, levelMin, levelMax]);

  const clear = () => {
    setQuery('');
    setSlot(null);
    setWeaponType(null);
    setHands(null);
    setRarity(null);
    setVocation(null);
    setLevelMin(null);
    setLevelMax(null);
  };

  const levelLabel =
    (levelMin != null && levelMin > 0) || (levelMax != null && levelMax > 0)
      ? `lvl ${levelMin && levelMin > 0 ? levelMin : '…'}–${levelMax && levelMax > 0 ? levelMax : '…'}`
      : null;

  const handsLabel = hands === '1H' ? '1 mão' : hands === '2H' ? '2 mãos' : null;

  const activeFilters =
    (slot ? 1 : 0) +
    (weaponType ? 1 : 0) +
    (hands ? 1 : 0) +
    (rarity != null ? 1 : 0) +
    (vocation ? 1 : 0) +
    ((levelMin != null && levelMin > 0) || (levelMax != null && levelMax > 0) ? 1 : 0);

  return (
    <>
      <PageHeader
        title="Itens"
        description={`${data.items.length} itens — armas, armaduras, consumíveis. Veja stats, proteções e quem dropa cada item.`}
        searchValue={query}
        onSearch={setQuery}
        searchInputId="items-search"
        searchPlaceholder="Nome do item… (kina = Knight)"
      />
      <WikiFilterPanel>
        <div class="wiki-filters-row items-filters-top">
          <FilterBlock label="Level req.">
            <div class="items-level-row">
              <div class="items-level-inputs">
                <input
                  type="number"
                  min={0}
                  placeholder="Mín"
                  aria-label="Level mínimo"
                  value={levelMin ?? ''}
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    setLevelMin(v === '' ? null : +v);
                  }}
                />
                <span class="items-level-sep">até</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Máx"
                  aria-label="Level máximo"
                  value={levelMax ?? ''}
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    setLevelMax(v === '' ? null : +v);
                  }}
                />
              </div>
              <FilterChipRow>
                <button
                  type="button"
                  class={`chip chip-sm${!levelMin && !levelMax ? ' active' : ''}`}
                  onClick={() => {
                    setLevelMin(null);
                    setLevelMax(null);
                  }}
                >
                  Todos
                </button>
                {LEVEL_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p.label}
                    class={`chip chip-sm${levelMin === p.min && levelMax === p.max ? ' active' : ''}`}
                    onClick={() => {
                      setLevelMin(p.min);
                      setLevelMax(p.max);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </FilterChipRow>
            </div>
          </FilterBlock>

          {vocations.length > 0 && (
            <FilterBlock label="Vocação">
              <FilterChipRow>
                <button
                  type="button"
                  class={`chip chip-sm${!vocation ? ' active' : ''}`}
                  onClick={() => setVocation(null)}
                >
                  Todas
                </button>
                {vocations.map((v) => (
                  <button
                    key={v}
                    type="button"
                    class={`chip chip-sm${vocation === v ? ' active' : ''}`}
                    onClick={() => setVocation(vocation === v ? null : v)}
                  >
                    {vocationLabel(v)}
                  </button>
                ))}
              </FilterChipRow>
            </FilterBlock>
          )}
        </div>

        <FilterBlock label="Equipamento · slot">
          <FilterChipRow>
            <button type="button" class={`chip chip-sm${!slot ? ' active' : ''}`} onClick={() => setSlot(null)}>
              Todos
            </button>
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                class={`chip chip-sm${slot === s ? ' active' : ''}`}
                onClick={() => setSlot(slot === s ? null : s)}
              >
                {slotLabel(s)}
              </button>
            ))}
          </FilterChipRow>
        </FilterBlock>

        <div class="wiki-filters-split">
          <FilterBlock label="Tipo de arma">
            <FilterChipRow>
              <button
                type="button"
                class={`chip chip-sm${!weaponType ? ' active' : ''}`}
                onClick={() => setWeaponType(null)}
              >
                Todas
              </button>
              {wtypes.map((w) => (
                <button
                  key={w}
                  type="button"
                  class={`chip chip-sm${weaponType === w ? ' active' : ''}`}
                  onClick={() => setWeaponType(weaponType === w ? null : w)}
                >
                  {weaponTypeLabel(w)}
                </button>
              ))}
            </FilterChipRow>
          </FilterBlock>

          {showHandsFilter && (
            <FilterBlock label="Empunhadura" compact>
              <FilterChipRow>
                <button
                  type="button"
                  class={`chip chip-sm${!hands ? ' active' : ''}`}
                  onClick={() => setHands(null)}
                >
                  Todas
                </button>
                <button
                  type="button"
                  class={`chip chip-sm hand-chip-1h${hands === '1H' ? ' active' : ''}`}
                  onClick={() => setHands(hands === '1H' ? null : '1H')}
                >
                  1 mão
                </button>
                <button
                  type="button"
                  class={`chip chip-sm hand-chip-2h${hands === '2H' ? ' active' : ''}`}
                  onClick={() => setHands(hands === '2H' ? null : '2H')}
                >
                  2 mãos
                </button>
              </FilterChipRow>
            </FilterBlock>
          )}

          <FilterBlock label="Raridade" compact>
            <FilterChipRow>
              <button
                type="button"
                class={`chip chip-sm${rarity == null ? ' active' : ''}`}
                onClick={() => setRarity(null)}
              >
                Todas
              </button>
              {rarities.map((r) => (
                <button
                  key={r}
                  type="button"
                  class={`chip chip-sm rare-${r}${rarity === r ? ' active' : ''}`}
                  onClick={() => setRarity(rarity === r ? null : r)}
                >
                  T{r}
                </button>
              ))}
            </FilterChipRow>
          </FilterBlock>
        </div>

        <FilterFooter activeCount={activeFilters} onClear={clear} />
      </WikiFilterPanel>
      <StatsBar
        count={list.length}
        total={data.items.length}
        label={`itens · ordem level${vocation ? ` · ${vocationLabel(vocation)}` : ''}${handsLabel ? ` · ${handsLabel}` : ''}${levelLabel ? ` · ${levelLabel}` : ''}`}
        capped={CAP}
      />
      {list.length === 0 ? (
        <div class="empty-state">Nenhum item encontrado.</div>
      ) : (
        <div class="grid">
          {list.slice(0, CAP).map((it) => {
            const cat = itemCategory(it);
            const dropCount = (indexes.dropsByItem[it.id] || []).length;
            const handsTag = handLabel(it);
            const meta = [
              it.atk != null ? `atk ${it.atk}` : null,
              it.arm != null ? `arm ${it.arm}` : null,
              it.def != null && it.atk == null ? `def ${it.def}` : null,
            ]
              .filter(Boolean)
              .join(' · ') || cat;
            return (
              <ItemHoverTip
                key={it.id}
                item={it}
                class="card"
                invAssets={data.invAssets}
                onClick={() => openDetail({ type: 'item', data: it })}
              >
                <div class="card-name">{it.name}</div>
                <div class="card-icon">
                  <SpriteIcon kind="item" imageName={it.image} assets={data.invAssets} />
                </div>
                <div class="card-tags">
                  {it.rarityBorderTier && (
                    <span class={`tag rare-${it.rarityBorderTier}`}>T{it.rarityBorderTier}</span>
                  )}
                  {it.levelMin != null && (
                    <span class="tag level-tag">lvl {it.levelMin}+</span>
                  )}
                  {it.slot && <span class="tag">{slotLabel(it.slot)}</span>}
                  {it.weaponType && <span class="tag">{weaponTypeLabel(it.weaponType)}</span>}
                  {handsTag && <span class={`tag hand-tag hand-tag-${handsTag.toLowerCase()}`}>{handsTag}</span>}
                  {dropCount > 0 && <span class="tag">{dropCount} drops</span>}
                </div>
                <div class="card-sub">{meta}</div>
              </ItemHoverTip>
            );
          })}
        </div>
      )}
    </>
  );
}
