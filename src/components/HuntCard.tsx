import type { HuntMetrics } from '../lib/hunt-metrics';
import { fmtCompact, fmtGpPerHour } from '../lib/format';
import { SpriteIcon } from './SpriteIcon';
import { useWiki } from '../context/WikiContext';

interface HuntCardProps {
  metrics: HuntMetrics;
  onClick: () => void;
}

export function HuntCard({ metrics, onClick }: HuntCardProps) {
  const { data } = useWiki();
  const { hunt, monsters, xpPerHour, profitPerHour } = metrics;
  const firstMon = monsters[0];

  return (
    <div class="card" onClick={onClick}>
      <div class="card-name">{hunt.title}</div>
      <div class="card-icon hunt-card-icon">
        {firstMon && (
          <SpriteIcon
            kind="monster"
            imageName={firstMon.image}
            animated
            size={64}
            assets={data.monAssets}
          />
        )}
      </div>
      <div class="hunt-metrics">
        <span class="tag xp">{fmtCompact(xpPerHour)} xp/h</span>
        <span class="tag profit">{fmtGpPerHour(profitPerHour)}</span>
      </div>
      <div class="card-tags">
        {hunt.recommendedLevel != null && (
          <span class="tag">rec {hunt.recommendedLevel}</span>
        )}
        {hunt.levelMin != null && <span class="tag">min {hunt.levelMin}</span>}
        {hunt.isPremmium && <span class="tag premium">Premium</span>}
        {hunt.maxLure != null && <span class="tag">lure {hunt.maxLure}</span>}
        {metrics.respawnLimited && <span class="tag respawn-cap">respawn</span>}
      </div>
      <div class="monster-row">
        {monsters.slice(0, 4).map((m) => (
          <span class="monster-chip" key={m.id}>
            <SpriteIcon kind="monster" imageName={m.image} size={28} assets={data.monAssets} />
            {m.name}
          </span>
        ))}
        {monsters.length > 4 && (
          <span class="monster-chip">+{monsters.length - 4}</span>
        )}
      </div>
    </div>
  );
}
