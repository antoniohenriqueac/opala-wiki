import { fmtGpPerHour } from '../lib/format';
import type { HuntMetrics } from '../lib/hunt-metrics';

interface ProfitSummaryProps {
  metrics: HuntMetrics;
  filteredCount: number;
  totalLootCount: number;
}

export function ProfitSummary({ metrics, filteredCount, totalLootCount }: ProfitSummaryProps) {
  const base = Math.round(metrics.profitPerHourBase);
  const filtered = Math.round(metrics.profitPerHour);
  const delta = base - filtered;
  const active = totalLootCount - filteredCount;

  return (
    <div class="profit-summary panel">
      <div class="profit-summary-head">
        <span class="profit-summary-title">Lucro estimado NPC (gp/h)</span>
        {metrics.respawnLimited && <span class="tag respawn-cap">respawn cap</span>}
      </div>
      <div class="profit-summary-grid">
        <div class="profit-stat">
          <span class="profit-lbl">Com filtro</span>
          <span class="profit-val profit">{fmtGpPerHour(filtered)}</span>
        </div>
        <div class="profit-stat">
          <span class="profit-lbl">Total drops</span>
          <span class="profit-val">{fmtGpPerHour(base)}</span>
        </div>
        {delta > 0 && (
          <div class="profit-stat">
            <span class="profit-lbl">Excluído</span>
            <span class="profit-val muted">−{fmtGpPerHour(delta)}</span>
          </div>
        )}
      </div>
      <div class="profit-meta">
        {active} itens ativos · {filteredCount} filtrados
        {metrics.respawnLimited && (
          <span> · respawn ~{metrics.respawnInterval.toFixed(1)}s</span>
        )}
      </div>
    </div>
  );
}
