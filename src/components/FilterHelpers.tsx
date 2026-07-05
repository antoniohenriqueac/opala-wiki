interface StatsBarProps {
  count: number;
  total: number;
  label: string;
  capped?: number;
}

export function StatsBar({ count, total, label, capped }: StatsBarProps) {
  return (
    <div class="stats-bar">
      <span>
        <strong>{count.toLocaleString('pt-BR')}</strong> resultados
      </span>
      <span>
        de <strong>{total.toLocaleString('pt-BR')}</strong> {label}
        {capped != null && count > capped ? ` · mostrando ${capped}` : ''}
      </span>
    </div>
  );
}

interface ClearFiltersProps {
  onClear: () => void;
}

export function ClearFiltersButton({ onClear }: ClearFiltersProps) {
  return (
    <button type="button" class="chip clear-filters" onClick={onClear}>
      Limpar filtros
    </button>
  );
}
