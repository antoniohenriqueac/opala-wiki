import { InfoHoverTip } from './InfoHoverTip';

interface RespawnTagProps {
  compact?: boolean;
  respawnInterval?: number;
  class?: string;
  stopClick?: boolean;
}

export function RespawnTag({
  compact,
  respawnInterval,
  class: className,
  stopClick,
}: RespawnTagProps) {
  return (
    <InfoHoverTip
      class={`respawn-tag-wrap${className ? ` ${className}` : ''}`}
      variant="respawn"
      stopClick={stopClick}
      content={{
        title: 'Limitado por respawn',
        paragraphs: [
          'O ciclo de cada kill é max(tempo de matar, respawn). Você já mata rápido — subir DPS aumenta pouco o raw xp/h e gp/h.',
          'Para ganhar mais: SPEED no equipamento (20 SPEED = −1s no respawn), lure maior ou hunts onde ainda não está overlevel.',
        ],
        foot:
          respawnInterval != null
            ? `Intervalo estimado: ~${respawnInterval.toFixed(1)}s`
            : undefined,
      }}
    >
      <span class="tag respawn-cap" aria-label="Limitado por respawn">
        {compact ? 'R' : 'respawn'}
      </span>
    </InfoHoverTip>
  );
}
