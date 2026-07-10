import type { HuntSort, PartySize, Vocation } from '../lib/types';
import {
  FilterBlock,
  FilterChipRow,
  FilterFooter,
  WikiFilterPanel,
} from './WikiFilterLayout';

export type PremiumFilter = 'all' | 'free' | 'premium';

export interface HuntFilterState {
  charLevel: number;
  partySize: PartySize;
  vocation: Vocation;
  sort: HuntSort;
  minXpHour: number;
  minProfitHour: number;
  premiumFilter: PremiumFilter;
  query: string;
}

export const DEFAULT_HUNT_FILTERS: HuntFilterState = {
  charLevel: 0,
  partySize: 1,
  vocation: 'ALL',
  sort: 'level',
  minXpHour: 0,
  minProfitHour: 0,
  premiumFilter: 'all',
  query: '',
};

interface HuntFiltersProps {
  state: HuntFilterState;
  onChange: (patch: Partial<HuntFilterState>) => void;
  onClear?: () => void;
}

const SORTS: { id: HuntSort; label: string }[] = [
  { id: 'level', label: 'Por nível' },
  { id: 'name', label: 'Nome A–Z' },
  { id: 'mobs', label: 'Mais criaturas' },
  { id: 'xp', label: 'Melhor raw xp' },
  { id: 'profit', label: 'Melhor gp/h' },
];

const PREMIUM: { id: PremiumFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'free', label: 'Free' },
  { id: 'premium', label: 'Premium' },
];

const VOCATIONS: { id: Vocation; label: string }[] = [
  { id: 'ALL', label: 'Todas' },
  { id: 'SORCERER', label: 'Sorcerer' },
  { id: 'DRUID', label: 'Druid' },
  { id: 'PALADIN', label: 'Paladin' },
  { id: 'KNIGHT', label: 'Knight' },
];

function countActiveFilters(state: HuntFilterState): number {
  let n = 0;
  if (state.charLevel > 0) n++;
  if (state.partySize !== DEFAULT_HUNT_FILTERS.partySize) n++;
  if (state.vocation !== DEFAULT_HUNT_FILTERS.vocation) n++;
  if (state.sort !== DEFAULT_HUNT_FILTERS.sort) n++;
  if (state.minXpHour > 0) n++;
  if (state.minProfitHour > 0) n++;
  if (state.premiumFilter !== DEFAULT_HUNT_FILTERS.premiumFilter) n++;
  return n;
}

export function HuntFilters({ state, onChange, onClear }: HuntFiltersProps) {
  const activeFilters = countActiveFilters(state);

  return (
    <WikiFilterPanel class="wiki-filters-hunts" activeCount={activeFilters}>
      <div class="wiki-filters-row wiki-filters-row-3">
        <FilterBlock label="Seu level">
          <input
            type="number"
            class="wiki-field-input"
            min={0}
            max={999}
            placeholder="0"
            value={state.charLevel || ''}
            onInput={(e) => {
              const raw = (e.target as HTMLInputElement).value;
              onChange({ charLevel: raw === '' ? 0 : +raw || 0 });
            }}
          />
        </FilterBlock>

        <FilterBlock label="Party">
          <FilterChipRow>
            {([1, 2, 4] as PartySize[]).map((n) => (
              <button
                key={n}
                type="button"
                class={`chip chip-sm${state.partySize === n ? ' active' : ''}`}
                onClick={() => onChange({ partySize: n })}
              >
                {n === 1 ? 'Solo' : n === 2 ? 'Duo' : 'Party x4'}
              </button>
            ))}
          </FilterChipRow>
        </FilterBlock>

        <FilterBlock label="Conta">
          <FilterChipRow>
            {PREMIUM.map((p) => (
              <button
                key={p.id}
                type="button"
                class={`chip chip-sm${state.premiumFilter === p.id ? ' active' : ''}`}
                onClick={() => onChange({ premiumFilter: p.id })}
              >
                {p.label}
              </button>
            ))}
          </FilterChipRow>
        </FilterBlock>
      </div>

      <FilterBlock label="Ordenar por">
        <FilterChipRow>
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              class={`chip chip-sm${state.sort === s.id ? ' active' : ''}`}
              onClick={() => onChange({ sort: s.id })}
            >
              {s.label}
            </button>
          ))}
        </FilterChipRow>
      </FilterBlock>

      <FilterBlock label="Vocação">
        <FilterChipRow>
          {VOCATIONS.map((v) => (
            <button
              key={v.id}
              type="button"
              class={`chip chip-sm${state.vocation === v.id ? ' active' : ''}`}
              onClick={() => onChange({ vocation: v.id })}
            >
              {v.label}
            </button>
          ))}
        </FilterChipRow>
      </FilterBlock>

      <div class="wiki-filters-row wiki-filters-row-3">
        <FilterBlock label="raw xp/h mín.">
          <input
            type="number"
            class="wiki-field-input"
            min={0}
            step={1000}
            value={state.minXpHour || ''}
            placeholder="0"
            onInput={(e) =>
              onChange({ minXpHour: +(e.target as HTMLInputElement).value || 0 })
            }
          />
        </FilterBlock>

        <FilterBlock label="gp/h mín.">
          <input
            type="number"
            class="wiki-field-input"
            min={0}
            step={100}
            value={state.minProfitHour || ''}
            placeholder="0"
            onInput={(e) =>
              onChange({
                minProfitHour: +(e.target as HTMLInputElement).value || 0,
              })
            }
          />
        </FilterBlock>
      </div>

      {onClear && <FilterFooter activeCount={activeFilters} onClear={onClear} />}
    </WikiFilterPanel>
  );
}
