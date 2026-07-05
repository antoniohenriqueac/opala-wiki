interface GameFooterProps {
  count?: number;
  countLabel?: string;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  query: string;
  onQuery: (q: string) => void;
  placeholder?: string;
  extra?: preact.ComponentChildren;
}

export function GameFooter({
  count,
  countLabel,
  page,
  totalPages,
  onPage,
  query,
  onQuery,
  placeholder = 'TYPE TO SEARCH',
  extra,
}: GameFooterProps) {
  return (
    <footer class="game-footer">
      <div class="game-footer-left">
        {count != null && countLabel && (
          <span class="game-footer-count">
            {count.toLocaleString('pt-BR')} {countLabel}
          </span>
        )}
        {extra}
      </div>
      <div class="game-footer-pagination">
        <button
          type="button"
          class="game-page-btn"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Página anterior"
        >
          ‹
        </button>
        <span class="game-page-info">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          class="game-page-btn"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>
      <div class="game-footer-search">
        <span class="game-search-icon">⌕</span>
        <input
          type="search"
          class="game-search-input"
          value={query}
          placeholder={placeholder}
          onInput={(e) => onQuery((e.target as HTMLInputElement).value)}
        />
      </div>
    </footer>
  );
}
