import { InfoHoverTip } from './InfoHoverTip';
import { fmtRespawnRange, fmtRespawnSec } from '../lib/format';

interface RespawnTagProps {
  compact?: boolean;
  /** Show min–max range; false = single value (Hunt Finder cards). */
  showRange?: boolean;
  respawnInterval?: number;
  respawnIntervalMin?: number;
  respawnIntervalMax?: number;
  class?: string;
  stopClick?: boolean;
}

export function RespawnTag({
  compact,
  showRange = true,
  respawnInterval,
  respawnIntervalMin,
  respawnIntervalMax,
  class: className,
  stopClick,
}: RespawnTagProps) {
  const min = respawnIntervalMin ?? respawnInterval;
  const max = respawnIntervalMax ?? respawnInterval;
  const rangeLabel =
    min != null && max != null ? fmtRespawnRange(min, max) : undefined;
  const singleLabel =
    respawnInterval != null ? `${respawnInterval.toFixed(1).replace('.', ',')}s` : undefined;
  const displayLabel = showRange ? rangeLabel : singleLabel ?? rangeLabel;

  return (
    <InfoHoverTip
      class={`respawn-tag-wrap${className ? ` ${className}` : ''}`}
      variant="respawn"
      stopClick={stopClick}
      content={{
        title: 'Respawn da hunt',
        paragraphs: [
          'O ciclo de cada kill é max(tempo de matar, respawn). Quando respawn limita, subir DPS aumenta pouco xp/h e gp/h.',
          showRange && rangeLabel
            ? `Intervalo estimado: ${rangeLabel}.`
            : singleLabel
              ? `Respawn do client: ${singleLabel}.`
              : 'Informe o Tempo de respawn do tooltip no client Stonegy.',
          showRange
            ? 'Cards usam média da faixa; na calculadora use o valor exato do jogo.'
            : 'Topo central da tela → passe o mouse no ícone → copie Tempo de respawn.',
        ],
        foot:
          respawnInterval != null
            ? `Respawn: ${singleLabel ?? fmtRespawnSec(respawnInterval)}s`
            : undefined,
      }}
    >
      <span class="tag respawn-cap" aria-label="Respawn da hunt">
        {compact ? displayLabel ?? 'R' : displayLabel ?? 'respawn'}
      </span>
    </InfoHoverTip>
  );
}
