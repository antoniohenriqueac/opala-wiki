import { RES_COLORS, RES_LABEL, RES_ORDER } from '../lib/format';

export function ResBars({ res }: { res: Record<string, number> }) {
  return (
    <div class="res-bars">
      {RES_ORDER.map((k) => {
        const v = res[k];
        if (v == null) {
          return (
            <div class="res-bar neutral" key={k}>
              <div class="rname">
                <span class="rdot" style={{ background: RES_COLORS[k] }} />
                {RES_LABEL[k]}
              </div>
              <div class="rbar">
                <div class="rfill" style={{ width: '100%', '--rc': RES_COLORS[k] } as Record<string, string>} />
              </div>
              <div class="rval">100%</div>
            </div>
          );
        }
        const cls = v === 0 ? 'immune' : v < 1 ? 'strong' : v > 1 ? 'weak' : 'neutral';
        const pct = Math.round(v * 100);
        const disp = v === 0 ? 'IMUNE' : `${pct}%`;
        return (
          <div class={`res-bar ${cls}`} key={k}>
            <div class="rname">
              <span class="rdot" style={{ background: RES_COLORS[k] }} />
              {RES_LABEL[k]}
            </div>
            <div class="rbar">
              <div
                class="rfill"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  '--rc': RES_COLORS[k],
                } as Record<string, string>}
              />
            </div>
            <div class="rval">{disp}</div>
          </div>
        );
      })}
    </div>
  );
}

export function StatRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div class="stat-row">
      <span class="k">{label}</span>
      <span class="v">{value}</span>
    </div>
  );
}
