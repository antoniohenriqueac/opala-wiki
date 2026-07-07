import type { ComponentChildren } from 'preact';

export function WikiFilterPanel({
  children,
  class: className,
}: {
  children: ComponentChildren;
  class?: string;
}) {
  return <div class={`wiki-filters panel${className ? ` ${className}` : ''}`}>{children}</div>;
}

export function FilterBlock({
  label,
  children,
  compact,
}: {
  label: string;
  children: ComponentChildren;
  compact?: boolean;
}) {
  return (
    <section class={`wiki-filter-block${compact ? ' wiki-filter-block-compact' : ''}`}>
      <h3 class="wiki-filter-label">{label}</h3>
      {children}
    </section>
  );
}

export function FilterChipRow({ children }: { children: ComponentChildren }) {
  return <div class="wiki-chip-row">{children}</div>;
}

export function FilterFooter({
  activeCount = 0,
  onClear,
  children,
}: {
  activeCount?: number;
  onClear?: () => void;
  children?: ComponentChildren;
}) {
  return (
    <div class="wiki-filters-footer">
      {activeCount > 0 && (
        <span class="wiki-filter-count">
          {activeCount} filtro{activeCount === 1 ? '' : 's'} ativo{activeCount === 1 ? '' : 's'}
        </span>
      )}
      {children}
      {onClear && (
        <button type="button" class="chip chip-sm clear-filters" onClick={onClear}>
          Limpar filtros
        </button>
      )}
    </div>
  );
}

/** @deprecated use FilterChipRow */
export const ChipRow = FilterChipRow;
