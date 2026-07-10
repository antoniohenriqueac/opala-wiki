import type { HuntMetrics } from '../lib/hunt-metrics';
import { fmtGpPerHourRange, fmtXpPerHourFromRaw } from '../lib/format';
import { XP_DEFAULTS } from '../lib/xp-calculator';
import { SpriteIcon, monsterHasWalkAnimation } from './SpriteIcon';
import { useWiki } from '../context/WikiContext';
import { getHuntBestElements } from '../lib/hunt-elements';

interface HuntCardProps {
  metrics: HuntMetrics;
  onClick: () => void;
}

function lureLabel(hunt: HuntMetrics['hunt']): string | null {
  const min = hunt.minLure;
  const max = hunt.maxLure;
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `LURE ${min}–${max}`;
  if (max != null) return `LURE ?–${max}`;
  if (min != null) return `LURE ${min}+`;
  return null;
}

export function HuntCard({ metrics, onClick }: HuntCardProps) {
  const { data } = useWiki();
  const { hunt, monsters, xpPerHourLow, xpPerHourHigh, profitPerHourLow, profitPerHourHigh } =
    metrics;
  const bestElements = getHuntBestElements(hunt, monsters, 2);
  const previewMonsters = monsters.slice(0, 4);
  const xpLabel = fmtXpPerHourFromRaw(xpPerHourLow, xpPerHourHigh, XP_DEFAULTS.gainRate ?? 120);
  const lure = lureLabel(hunt);

  return (
    <div class="card hunt-card-v2" onClick={onClick}>
      <div class="hunt-card-preview">
        {previewMonsters.map((m) => (
          <SpriteIcon
            key={m.id}
            kind="monster"
            imageName={m.image}
            animated={monsterHasWalkAnimation(data.monAssets, m.image)}
            size={previewMonsters.length > 2 ? 40 : 48}
            assets={data.monAssets}
          />
        ))}
      </div>

      <div class="card-name">{hunt.title}</div>

      <div class="hunt-card-stats">
        <div class="hunt-card-stat">
          <span class="hunt-card-stat-label">Recomendado</span>
          <span class="hunt-card-stat-value">{hunt.recommendedLevel ?? '—'}</span>
        </div>
        <div class="hunt-card-stat">
          <span class="hunt-card-stat-label">Mínimo</span>
          <span class="hunt-card-stat-value">{hunt.levelMin ?? '—'}</span>
        </div>
        <div class="hunt-card-stat hunt-card-stat-xp">
          <span class="hunt-card-stat-label">XP</span>
          <span class="hunt-card-stat-value">{xpLabel.replace(' xp/h', '')}</span>
        </div>
      </div>

      <div class="hunt-card-meta">
        <span class="hunt-meta-badge">
          {monsters.length} {monsters.length === 1 ? 'criatura' : 'criaturas'}
        </span>
        {lure && <span class="hunt-meta-badge hunt-meta-lure">{lure}</span>}
        {hunt.isPremmium && <span class="hunt-meta-badge hunt-meta-premium">Premium</span>}
        <span class="hunt-meta-badge hunt-meta-gp" title="GP/h estimado">
          {fmtGpPerHourRange(profitPerHourLow, profitPerHourHigh)}
        </span>
      </div>

      {bestElements.length > 0 && (
        <div class="hunt-element-row">
          {bestElements.map((el) => (
            <span
              class="hunt-element-chip"
              key={el.key}
              title={`Fraco a ${el.label} (média ponderada ${Math.round(el.score * 100)}%)`}
            >
              <span class="hunt-element-dot" style={{ background: el.color }} />
              {el.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
