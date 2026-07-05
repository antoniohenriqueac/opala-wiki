interface GamePanelProps {
  title: string;
  children: preact.ComponentChildren;
  onClose?: () => void;
}

export function GamePanel({ title, children, onClose }: GamePanelProps) {
  return (
    <div class="game-scene">
      <div class="game-panel">
        <header class="game-panel-header">
          <h1 class="game-panel-title">{title}</h1>
          {onClose && (
            <button type="button" class="game-panel-close" onClick={onClose} aria-label="Fechar">
              ×
            </button>
          )}
        </header>
        <div class="game-panel-body">{children}</div>
      </div>
    </div>
  );
}
