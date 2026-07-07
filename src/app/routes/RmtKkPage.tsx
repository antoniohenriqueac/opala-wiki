import { useMemo, useState } from 'preact/hooks';
import { fmtBrl } from '../../lib/coins-api';
import {
  bonusVsBase,
  calcAllTiers,
  calcIdealBuyPerKk,
  calcTierResult,
  compareRmtQuote,
  DEFAULT_GOLD_PER_COIN,
  DONATE_TIERS,
  fmtBrlRate,
  fmtGoldKk,
  RMT_IDEAL_ADVANTAGE_PCT,
  type DonateTier,
} from '../../lib/rmt-kk-calculator';

/** Shortcuts — valores típicos do Coin Market (coluna esquerda). */
const GOLD_QUICK: Array<{ value: number; label: string }> = [
  { value: 6_000, label: '6.000' },
  { value: 6_200, label: '6.200' },
  { value: 6_500, label: '6.500' },
  { value: 7_000, label: '7.000' },
];

function bonusLabel(pct: number): string | null {
  if (pct <= 0) return null;
  return `+${pct % 1 === 0 ? pct : pct.toFixed(1).replace('.', ',')}% coins`;
}

function verdictLabel(verdict: 'cheap' | 'fair' | 'expensive'): string {
  if (verdict === 'cheap') return 'Barato';
  if (verdict === 'expensive') return 'Caro';
  return 'Justo';
}

function verdictHint(verdict: 'cheap' | 'fair' | 'expensive', pctDiff: number): string {
  if (verdict === 'cheap') {
    return `Até ${RMT_IDEAL_ADVANTAGE_PCT}% abaixo do equilíbrio — boa compra no RMT.`;
  }
  if (verdict === 'fair') {
    return 'Entre a compra ideal e o equilíbrio — aceitável, mas dá para negociar.';
  }
  const abs = Math.abs(pctDiff);
  return `${abs % 1 === 0 ? abs : abs.toFixed(1).replace('.', ',')}% acima do equilíbrio — melhor donate + vender coins.`;
}

export function RmtKkPage() {
  const [selectedTier, setSelectedTier] = useState<DonateTier>(DONATE_TIERS[2]);
  const [goldPerCoin, setGoldPerCoin] = useState(DEFAULT_GOLD_PER_COIN);
  const [rmtQuote, setRmtQuote] = useState('');

  const gp = Math.max(0, Math.floor(goldPerCoin) || 0);
  const result = useMemo(() => calcTierResult(selectedTier, gp), [selectedTier, gp]);
  const allTiers = useMemo(() => calcAllTiers(gp), [gp]);
  const idealPerKk = useMemo(() => calcIdealBuyPerKk(result.brlPer1kk), [result.brlPer1kk]);

  const quotedPerKk = parseFloat(rmtQuote.replace(',', '.'));
  const comparison =
    quotedPerKk > 0 && result.brlPer1kk > 0
      ? compareRmtQuote(result.brlPer1kk, quotedPerKk)
      : null;

  return (
    <div class="rmtkk-page">
      <header class="rmtkk-header">
        <div class="rmtkk-header-title-row">
          <h1>Preço KK</h1>
          <span class="rmtkk-header-badge">RMT</span>
        </div>
        <p class="rmtkk-subtitle">
          Calcule quanto você paga por kk via donate → coins → vender no Coin Market, e compare com
          cotações RMT.
        </p>
      </header>

      <div class="rmtkk-shell">
        <section class="rmtkk-panel">
          <h2 class="rmtkk-section-title">1. Pacote de donate</h2>
          <p class="rmtkk-hint">Tiers oficiais Stonegy — acima de R$100 você recebe bônus de coins.</p>
          <div class="rmtkk-tier-grid">
            {DONATE_TIERS.map((tier) => {
              const bonus = bonusLabel(bonusVsBase(tier.coinAmount, tier.donateBrl));
              const selected = selectedTier.donateBrl === tier.donateBrl;
              return (
                <button
                  type="button"
                  key={tier.donateBrl}
                  class={`rmtkk-tier${selected ? ' selected' : ''}`}
                  onClick={() => setSelectedTier(tier)}
                >
                  <div class="rmtkk-tier-brl">{fmtBrl(tier.donateBrl)}</div>
                  <div class="rmtkk-tier-coins">{tier.coinAmount.toLocaleString('pt-BR')} coins</div>
                  {bonus && <div class="rmtkk-tier-badge">{bonus}</div>}
                </button>
              );
            })}
          </div>
        </section>

        <section class="rmtkk-panel">
          <h2 class="rmtkk-section-title">2. Coin Market (ordens de compra)</h2>
          <p class="rmtkk-hint">
            Abra o <strong>Stonegy Coin Market</strong> in-game. Na coluna{' '}
            <strong>Ordens de compra</strong> (esquerda), pegue o <strong>maior preço</strong> em gp
            por coin — é quanto você recebe ao vender suas coins.
          </p>
          <div class="rmtkk-gold-control">
            <label class="rmtkk-label" for="rmtkk-gp">
              Gold por coin (gp) — maior ordem de compra
            </label>
            <input
              id="rmtkk-gp"
              type="number"
              min={1}
              step={1}
              value={gp || ''}
              onInput={(e) => setGoldPerCoin(+(e.target as HTMLInputElement).value || 0)}
            />
          </div>
          <p class="rmtkk-quick-label">Atalhos (valores típicos — digite o valor real do market):</p>
          <div class="rmtkk-quick">
            {GOLD_QUICK.map(({ value, label }) => (
              <button
                type="button"
                key={value}
                class={`rmtkk-quick-btn${gp === value ? ' active' : ''}`}
                onClick={() => setGoldPerCoin(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section class="rmtkk-panel">
          <h2 class="rmtkk-section-title">3. Cotação RMT (opcional)</h2>
          <p class="rmtkk-hint">Quanto te cobraram por 1kk de gold fora do jogo?</p>
          <div class="rmtkk-gold-control">
            <label class="rmtkk-label" for="rmtkk-quote">
              R$ por 1kk
            </label>
            <input
              id="rmtkk-quote"
              type="text"
              inputMode="decimal"
              placeholder="Ex.: 16,00"
              value={rmtQuote}
              onInput={(e) => setRmtQuote((e.target as HTMLInputElement).value)}
            />
          </div>
        </section>

        {gp > 0 ? (
          <>
            <section class="rmtkk-result">
              <p class="rmtkk-result-lead">
                Com {fmtBrl(selectedTier.donateBrl)} de donate ({selectedTier.coinAmount.toLocaleString('pt-BR')}{' '}
                coins) vendendo a {gp.toLocaleString('pt-BR')} gp/coin:
              </p>
              <div class="rmtkk-result-stats">
                <div class="rmtkk-stat">
                  <span class="rmtkk-stat-label">Gold total</span>
                  <span class="rmtkk-stat-value">{fmtGoldKk(result.goldTotal)}</span>
                </div>
                <div class="rmtkk-stat">
                  <span class="rmtkk-stat-label">R$ / 100k</span>
                  <span class="rmtkk-stat-value">{fmtBrlRate(result.brlPer100k)}</span>
                </div>
              </div>

              <div class="rmtkk-price-cards">
                <div class="rmtkk-price-card rmtkk-price-card-equilibrium">
                  <span class="rmtkk-price-card-label">Equilíbrio</span>
                  <span class="rmtkk-price-card-value">{fmtBrlRate(result.brlPer1kk)}/kk</span>
                  <span class="rmtkk-price-card-hint">
                    Custo real via donate + vender coins no market
                  </span>
                </div>
                <div class="rmtkk-price-card rmtkk-price-card-ideal">
                  <span class="rmtkk-price-card-label">
                    Compra ideal ({RMT_IDEAL_ADVANTAGE_PCT}% vantagem)
                  </span>
                  <span class="rmtkk-price-card-value">{fmtBrlRate(idealPerKk)}/kk</span>
                  <span class="rmtkk-price-card-hint">
                    Máximo que vale pagar no RMT — abaixo disso é negócio
                  </span>
                </div>
              </div>

              {result.bonusPct > 0 && (
                <p class="rmtkk-bonus-note">
                  Bônus de {result.bonusPct % 1 === 0 ? result.bonusPct : result.bonusPct.toFixed(1).replace('.', ',')}%
                  de coins neste tier — o kk fica mais barato que pacotes menores.
                </p>
              )}
            </section>

            {comparison && (
              <section class={`rmtkk-verdict rmtkk-verdict-${comparison.verdict}`}>
                <div class="rmtkk-verdict-head">
                  <span class="rmtkk-verdict-icon">
                    {comparison.verdict === 'cheap' ? '✓' : comparison.verdict === 'expensive' ? '✕' : '≈'}
                  </span>
                  <span class="rmtkk-verdict-title">{verdictLabel(comparison.verdict)}</span>
                </div>
                <p class="rmtkk-verdict-detail">
                  Cotação RMT: {fmtBrlRate(quotedPerKk)}/kk · Equilíbrio: {fmtBrlRate(result.brlPer1kk)}
                  /kk · Ideal: {fmtBrlRate(idealPerKk)}/kk
                </p>
                <p class="rmtkk-verdict-hint">{verdictHint(comparison.verdict, comparison.pctDiff)}</p>
              </section>
            )}

            <section class="rmtkk-panel rmtkk-compare">
              <h2 class="rmtkk-section-title">Compare tiers</h2>
              <p class="rmtkk-hint">Mesma ordem de compra — veja como o bônus reduz o preço do kk.</p>
              <div class="rmtkk-table-wrap">
                <table class="rmtkk-table">
                  <thead>
                    <tr>
                      <th>Donate</th>
                      <th>Coins</th>
                      <th>Equilíbrio</th>
                      <th>Ideal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTiers.map((row) => {
                      const selected = row.tier.donateBrl === selectedTier.donateBrl;
                      const ideal = calcIdealBuyPerKk(row.brlPer1kk);
                      return (
                        <tr key={row.tier.donateBrl} class={selected ? 'selected' : ''}>
                          <td>{fmtBrl(row.tier.donateBrl)}</td>
                          <td>
                            {row.tier.coinAmount.toLocaleString('pt-BR')}
                            {row.bonusPct > 0 && (
                              <span class="rmtkk-table-bonus">
                                {' '}
                                +{row.bonusPct % 1 === 0 ? row.bonusPct : row.bonusPct.toFixed(1).replace('.', ',')}%
                              </span>
                            )}
                          </td>
                          <td>{fmtBrlRate(row.brlPer1kk)}</td>
                          <td>{fmtBrlRate(ideal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section class="rmtkk-panel rmtkk-empty">
            <p>Informe o gp por coin (maior ordem de compra no Coin Market) para ver os resultados.</p>
          </section>
        )}

        <section class="rmtkk-formula">
          <h3>Como funciona</h3>
          <ul>
            <li>Doa na loja oficial Stonegy e recebe coins (TC) conforme o pacote.</li>
            <li>
              No <strong>Coin Market</strong>, vende as coins na coluna <strong>Ordens de compra</strong>{' '}
              (botão SELL) — use o maior preço listado.
            </li>
            <li>
              <code>gold total = coins × gp por coin</code> → equilíbrio = R$/kk via esse caminho.
            </li>
            <li>
              Compra ideal = equilíbrio −{RMT_IDEAL_ADVANTAGE_PCT}% — teto para valer a pena no RMT.
            </li>
            <li>Pacotes acima de R$100 dão bônus de coins, deixando o kk ainda mais barato.</li>
          </ul>
          <p class="rmtkk-disclaimer">
            Referência comunitária — preços do Coin Market e RMT mudam. Confira in-game antes de
            fechar negócio.
          </p>
        </section>
      </div>
    </div>
  );
}
