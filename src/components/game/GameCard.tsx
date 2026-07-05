import { SpriteIcon } from '../SpriteIcon';
import type { SpriteAsset } from '../../lib/types';

interface GameCardProps {
  title: string;
  meta: string;
  imageName?: string;
  kind?: 'item' | 'monster';
  assets?: Record<string, SpriteAsset>;
  badge?: string;
  status?: 'blocked' | 'done' | 'active' | 'neutral';
  statusLabel?: string;
  onClick?: () => void;
}

export function GameCard({
  title,
  meta,
  imageName,
  kind = 'monster',
  assets,
  badge,
  status = 'neutral',
  statusLabel,
  onClick,
}: GameCardProps) {
  return (
    <button type="button" class={`game-card status-${status}`} onClick={onClick}>
      <div class="game-card-title">{title}</div>
      <div class="game-card-sprite">
        {imageName && assets ? (
          <SpriteIcon kind={kind} imageName={imageName} assets={assets} size={48} />
        ) : (
          <div class="game-card-placeholder" />
        )}
      </div>
      <div class="game-card-meta">{meta}</div>
      {badge && <div class="game-card-badge">{badge}</div>}
      {statusLabel && <div class={`game-card-status status-${status}`}>{statusLabel}</div>}
    </button>
  );
}
