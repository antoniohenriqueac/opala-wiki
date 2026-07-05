interface GameSidebarProps {
  categories: { id: string; label: string }[];
  activeCategory: string | null;
  onCategory: (id: string | null) => void;
  filters?: preact.ComponentChildren;
  count: number;
  countLabel: string;
}

export function GameSidebar({
  categories,
  activeCategory,
  onCategory,
  filters,
  count,
  countLabel,
}: GameSidebarProps) {
  return (
    <aside class="game-sidebar">
      <div class="game-sidebar-section">
        <div class="game-sidebar-label">Categories:</div>
        <div class="game-sidebar-cats">
          <button
            type="button"
            class={`game-cat-btn${activeCategory === null ? ' active' : ''}`}
            onClick={() => onCategory(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              class={`game-cat-btn${activeCategory === c.id ? ' active' : ''}`}
              onClick={() => onCategory(activeCategory === c.id ? null : c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {filters && (
        <div class="game-sidebar-section">
          <div class="game-sidebar-label">Filters:</div>
          {filters}
        </div>
      )}
      <div class="game-sidebar-count">
        <div class="game-count-num">{count.toLocaleString('pt-BR')}</div>
        <div class="game-count-label">{countLabel}</div>
      </div>
    </aside>
  );
}
