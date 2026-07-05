import { fmtGpPerHour } from '../lib/format';
import type { HuntMetrics } from '../lib/hunt-metrics';

interface HuntMetricsStickyProps {
  xpPerHour: number;
  metrics: HuntMetrics;
  filteredCount: number;
  totalLootCount: number;
  showProfit: boolean;
}

export function HuntMetricsSticky({
  xpPerHour,
  metrics,
  filteredCount,
  totalLootCount,
  showProfit,
}: HuntMetricsStickyProps) {
  const base = Math.round(metrics.profitPerHourBase);
  const filtered = Math.round(metrics.profitPerHour);
  const active = totalLootCount - filteredCount;

  return (
    <div class="hunt-sticky-metrics">
      <div class="hunt-sticky-block hunt-sticky-xp">
        <span class="hunt-sticky-lbl">XP/h</span>
        <span class="hunt-sticky-val xp">{xpPerHour.toLocaleString('pt-BR')}</span>
        {metrics.respawnLimited && <span class="tag respawn-cap">respawn</span>}
      </div>
      {showProfit && (
        <div class="hunt-sticky-block hunt-sticky-profit">
          <div class="hunt-sticky-profit-col">
            <span class="hunt-sticky-lbl">Com filtro</span>
            <span class="hunt-sticky-val profit">{fmtGpPerHour(filtered)}</span>
          </div>
          <div class="hunt-sticky-profit-col">
            <span class="hunt-sticky-lbl">Total drops</span>
            <span class="hunt-sticky-val">{fmtGpPerHour(base)}</span>
          </div>
        </div>
      )}
      {showProfit && (
        <div class="hunt-sticky-meta">
          {active}/{totalLootCount} loot · respawn ~{metrics.respawnInterval.toFixed(1)}s
        </div>
      )}
    </div>
  );
}
