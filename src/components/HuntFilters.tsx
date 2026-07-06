import type { HuntSort, PartySize, Vocation } from '../lib/types';

export interface HuntFilterState {
  charLevel: number;
  partySize: PartySize;
  vocation: Vocation;
  sort: HuntSort;
  minXpHour: number;
  minProfitHour: number;
  hidePremium: boolean;
  query: string;
}

interface HuntFiltersProps {
  state: HuntFilterState;
  onChange: (patch: Partial<HuntFilterState>) => void;
}

const SORTS: { id: HuntSort; label: string }[] = [
  { id: 'xp', label: 'Melhor raw xp' },
  { id: 'profit', label: 'Melhor gp/h' },
  { id: 'level', label: 'Level' },
  { id: 'name', label: 'Nome' },
];

export function HuntFilters({ state, onChange }: HuntFiltersProps) {
  return (
    <div class="panel filter-panel">
      <div class="field">
        <label>Level</label>
        <input
          type="number"
          min={1}
          max={999}
          value={state.charLevel}
          onInput={(e) =>
            onChange({ charLevel: +(e.target as HTMLInputElement).value || 1 })
          }
        />
      </div>
      <div class="field">
        <label>Party</label>
        <div class="chip-group">
          {([1, 2, 4] as PartySize[]).map((n) => (
            <button
              key={n}
              type="button"
              class={`chip${state.partySize === n ? ' active' : ''}`}
              onClick={() => onChange({ partySize: n })}
            >
              {n === 1 ? 'Solo' : n === 2 ? 'Duo' : 'Party x4'}
            </button>
          ))}
        </div>
      </div>
      <div class="field">
        <label>Vocação</label>
        <select
          value={state.vocation}
          onChange={(e) =>
            onChange({ vocation: (e.target as HTMLSelectElement).value as Vocation })
          }
        >
          <option value="ALL">Todas</option>
          <option value="SORCERER">Sorcerer</option>
          <option value="DRUID">Druid</option>
          <option value="PALADIN">Paladin</option>
          <option value="KNIGHT">Knight</option>
        </select>
      </div>
      <div class="field">
        <label>Ordenar</label>
        <div class="chip-group">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              class={`chip${state.sort === s.id ? ' active' : ''}`}
              onClick={() => onChange({ sort: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div class="field">
        <label>raw xp/h mín</label>
        <input
          type="number"
          min={0}
          step={1000}
          value={state.minXpHour || ''}
          placeholder="0"
          onInput={(e) =>
            onChange({ minXpHour: +(e.target as HTMLInputElement).value || 0 })
          }
        />
      </div>
      <div class="field">
        <label>gp/h mín</label>
        <input
          type="number"
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
      </div>
      <div class="field">
        <label>&nbsp;</label>
        <button
          type="button"
          class={`chip${state.hidePremium ? ' active' : ''}`}
          onClick={() => onChange({ hidePremium: !state.hidePremium })}
        >
          Ocultar Premium
        </button>
      </div>
    </div>
  );
}
