import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

const MOBILE_FILTERS_MQ = '(max-width: 768px)';

function isMobileFilters(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_FILTERS_MQ).matches;
}

export function WikiFilterPanel({
  children,
  class: className,
  activeCount = 0,
}: {
  children: ComponentChildren;
  class?: string;
  activeCount?: number;
}) {
  const [open, setOpen] = useState(() => !isMobileFilters());
  const [collapsible, setCollapsible] = useState(isMobileFilters);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_FILTERS_MQ);
    const sync = () => {
      const mobile = mq.matches;
      setCollapsible(mobile);
      if (!mobile) setOpen(true);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const collapsed = collapsible && !open;
  const panelClass = [
    'wiki-filters',
    'panel',
    className,
    collapsed ? 'wiki-filters-collapsed' : 'wiki-filters-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={panelClass}>
      {collapsible && (
        <button
          type="button"
          class="wiki-filters-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span class="wiki-filters-toggle-label">
            Filtros
            {activeCount > 0 && (
              <span class="wiki-filters-toggle-badge">
                {activeCount} ativo{activeCount === 1 ? '' : 's'}
              </span>
            )}
          </span>
          <span class="wiki-filters-toggle-icon" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
        </button>
      )}
      <div class="wiki-filters-body">{children}</div>
    </div>
  );
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
