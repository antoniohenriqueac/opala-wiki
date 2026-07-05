import { SpriteIcon } from '../SpriteIcon';
import type { SpriteAsset } from '../../lib/types';

interface GameListRowProps {
  name: string;
  sub: string;
  imageName: string;
  kind: 'item' | 'monster';
  assets: Record<string, SpriteAsset>;
  onClick?: () => void;
}

export function GameListRow({ name, sub, imageName, kind, assets, onClick }: GameListRowProps) {
  return (
    <button type="button" class="game-list-row" onClick={onClick}>
      <div class="game-list-icon">
        <SpriteIcon kind={kind} imageName={imageName} assets={assets} size={32} />
      </div>
      <div class="game-list-text">
        <div class="game-list-name">{name}</div>
        <div class="game-list-sub">{sub}</div>
      </div>
    </button>
  );
}
