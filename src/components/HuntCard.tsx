import type { HuntMetrics } from '../lib/hunt-metrics';
import { fmtGpPerHourRange, fmtXpPerHourFromRaw } from '../lib/format';
import { XP_DEFAULTS } from '../lib/xp-calculator';
import { SpriteIcon, monsterHasWalkAnimation } from './SpriteIcon';
import { RespawnTag } from './RespawnTag';
import { useWiki } from '../context/WikiContext';
import { getHuntBestElements } from '../lib/hunt-elements';

interface HuntCardProps {
  metrics: HuntMetrics;
  onClick: () => void;
}

export function HuntCard({ metrics, onClick }: HuntCardProps) {
  const { data } = useWiki();
  const { hunt, monsters, xpPerHourLow, xpPerHourHigh, profitPerHourLow, profitPerHourHigh } =
    metrics;
  const firstMon = monsters[0];
  const bestElements = getHuntBestElements(hunt, monsters, 2);

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
        <span class="tag xp">
          {fmtXpPerHourFromRaw(xpPerHourLow, xpPerHourHigh, XP_DEFAULTS.gainRate ?? 120)}
        </span>
        <span class="tag profit">{fmtGpPerHourRange(profitPerHourLow, profitPerHourHigh)}</span>
      </div>
      <div class="card-tags">
        {hunt.recommendedLevel != null && (
          <span class="tag">rec {hunt.recommendedLevel}</span>
        )}
        {hunt.levelMin != null && <span class="tag">min {hunt.levelMin}</span>}
        {hunt.isPremmium && <span class="tag premium">Premium</span>}
        {hunt.maxLure != null && <span class="tag">lure {hunt.maxLure}</span>}
        <RespawnTag
          showRange={false}
          respawnInterval={metrics.respawnInterval}
          respawnIntervalMin={metrics.respawnIntervalMin}
          respawnIntervalMax={metrics.respawnIntervalMax}
          stopClick
        />
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
      <div class="monster-row">
        {monsters.slice(0, 4).map((m) => (
          <span class="monster-chip" key={m.id}>
            <SpriteIcon
              kind="monster"
              imageName={m.image}
              animated={monsterHasWalkAnimation(data.monAssets, m.image)}
              size={28}
              assets={data.monAssets}
            />
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
