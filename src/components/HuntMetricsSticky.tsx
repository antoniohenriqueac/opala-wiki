import {
  fmtCompact,
  fmtGpPerHour,
  fmtGpPerHourRange,
  fmtGpPerKill,
  fmtGpTotalRange,
  fmtMid,
  fmtRespawnSec,
  fmtXpPerHourFromRaw,
  fmtXpTotalRange,
  xpMetricLabel,
  PREMIUM_XP_HINT,
} from '../lib/format';
import type { HuntMetrics } from '../lib/hunt-metrics';
import { formatStaminaTime, valueForHuntDuration } from '../lib/stamina-model';
import { isXpBoostActive } from '../lib/xp-boost';
import { InfoHoverTip, type InfoHoverContent } from './InfoHoverTip';
import { RespawnTag } from './RespawnTag';

interface HuntMetricsStickyProps {
  xpValueLow: number;
  xpValueHigh: number;
  baseXpPerHourLow: number;
  baseXpPerHourHigh: number;
  gainRate: number;
  xpBoost: boolean;
  metrics: HuntMetrics;
  staminaHours: number;
  filteredCount: number;
  totalLootCount: number;
  showProfit: boolean;
  respawnManual?: boolean;
}

function gpFilteredHint(
  metrics: HuntMetrics,
  filteredLow: number,
  filteredHigh: number,
  goldLow: number,
  goldHigh: number,
  lootLow: number,
  lootHigh: number,
  active: number,
  totalLootCount: number,
  respawnManual: boolean,
): InfoHoverContent {
  const kills = Math.round(metrics.killsPerHour);
  const paragraphs = [
    `${fmtGpPerHourRange(filteredLow, filteredHigh)} total = gold + loot itens (com filtro).`,
    `Gold da kill: ${fmtGpPerKill(metrics.goldGpPerKillWiki)} (média wiki (min–max)/2) → ${fmtGpPerHourRange(goldLow, goldHigh)}. Vai direto pra BP; não entra no filtro.`,
    active > 0
      ? `Loot itens: ${fmtGpPerKill(metrics.lootGpPerKill)} → ${fmtGpPerHourRange(lootLow, lootHigh)} (${active}/${totalLootCount} ativos).`
      : `Loot itens: 0 gp/h — todos os ${totalLootCount} itens filtrados. GP = só gold da kill.`,
    `~${kills.toLocaleString('pt-BR')} kills/h · criaturas ${metrics.creatureMin}–${metrics.creatureMax} · respawn ${fmtRespawnSec(metrics.respawnInterval)}s${respawnManual ? '' : ' (est.)'}.`,
  ];
  return {
    title: 'GP bruto NPC (filtro)',
    paragraphs,
    foot: 'Sem supplies. Compare com Loot total do Analyzer, não Balance.',
  };
}

function gpDropsHint(
  metrics: HuntMetrics,
  baseLow: number,
  baseHigh: number,
  goldLow: number,
  goldHigh: number,
): InfoHoverContent {
  const kills = Math.round(metrics.killsPerHour);
  return {
    title: 'GP bruto NPC (drops)',
    paragraphs: [
      `${fmtGpPerHourRange(baseLow, baseHigh)} com todos os drops da wiki (sem filtro).`,
      `Gold da kill: ${fmtGpPerKill(metrics.goldGpPerKillWiki)} → ${fmtGpPerHourRange(goldLow, goldHigh)}.`,
      `Loot itens: ${fmtGpPerKill(metrics.lootGpPerKillBase)} → ${fmtGpPerHour(Math.round(metrics.profitLootPerHour))}.`,
      `~${kills.toLocaleString('pt-BR')} kills/h · EV = chance wiki × preço NPC.`,
    ],
    foot: 'Sem supplies. Compare com Loot total do Analyzer, não Balance.',
  };
}

function xpHint(
  baseXpPerHourLow: number,
  baseXpPerHourHigh: number,
  gainRate: number,
  boostOn: boolean,
  boostGain: number,
): InfoHoverContent {
  const paragraphs = [PREMIUM_XP_HINT];
  paragraphs.push(
    `${fmtXpPerHourFromRaw(baseXpPerHourLow, baseXpPerHourHigh, gainRate)} · raw ${fmtCompact(Math.round(fmtMid(baseXpPerHourLow, baseXpPerHourHigh)))} xp/h.`,
  );
  if (boostOn) {
    paragraphs.push(`XP Boost: ${boostGain}% na 1ª hora (${gainRate}% + 50).`);
  }
  return { title: 'XP total', paragraphs };
}

export function HuntMetricsSticky({
  xpValueLow,
  xpValueHigh,
  baseXpPerHourLow,
  baseXpPerHourHigh,
  gainRate,
  xpBoost,
  metrics,
  staminaHours,
  filteredCount,
  totalLootCount,
  showProfit,
  respawnManual = false,
}: HuntMetricsStickyProps) {
  const baseLow = Math.round(metrics.profitPerHourBaseLow);
  const baseHigh = Math.round(metrics.profitPerHourBaseHigh);
  const filteredLow = Math.round(metrics.profitPerHourLow);
  const filteredHigh = Math.round(metrics.profitPerHourHigh);
  const goldLow = Math.round(metrics.profitGoldPerHourLow);
  const goldHigh = Math.round(metrics.profitGoldPerHourHigh);
  const lootFilteredLow = Math.round(metrics.profitLootPerHourLow);
  const lootFilteredHigh = Math.round(metrics.profitLootPerHourHigh);
  const active = totalLootCount - filteredCount;
  const boostOn = isXpBoostActive(xpBoost);
  const huntTime = formatStaminaTime(staminaHours);
  const gpFilteredLow = valueForHuntDuration(filteredLow, staminaHours);
  const gpFilteredHigh = valueForHuntDuration(filteredHigh, staminaHours);
  const gpBaseLow = valueForHuntDuration(baseLow, staminaHours);
  const gpBaseHigh = valueForHuntDuration(baseHigh, staminaHours);
  const premiumTag = gainRate === 120 ? '120% premium' : `${gainRate}% gain`;

  return (
    <div class="hunt-sticky-metrics hunt-metrics-footer" role="status" aria-live="polite">
      <div class={`hunt-sticky-row${showProfit ? '' : ' hunt-sticky-row-xp-only'}`}>
        <div class="hunt-sticky-stat hunt-sticky-stat-xp">
          <InfoHoverTip
            content={xpHint(baseXpPerHourLow, baseXpPerHourHigh, gainRate, boostOn, gainRate + 50)}
          >
            <span class="hunt-sticky-lbl hunt-sticky-lbl-tip">
              {xpMetricLabel(huntTime)}
              <span class="calc-hint-trigger" aria-hidden="true">
                i
              </span>
            </span>
          </InfoHoverTip>
          <span class="hunt-sticky-val xp">{fmtXpTotalRange(xpValueLow, xpValueHigh)}</span>
          <div class="hunt-sticky-tags">
            <span class="tag raw-xp-tag">{premiumTag}</span>
            {boostOn && <span class="tag xp-boost-tag">xp boost</span>}
            {metrics.respawnLimited && (
              <RespawnTag showRange={false} respawnInterval={metrics.respawnInterval} />
            )}
          </div>
        </div>

        {showProfit && (
          <>
            <div class="hunt-sticky-stat hunt-sticky-stat-gp">
              <InfoHoverTip
                content={gpFilteredHint(
                  metrics,
                  filteredLow,
                  filteredHigh,
                  goldLow,
                  goldHigh,
                  lootFilteredLow,
                  lootFilteredHigh,
                  active,
                  totalLootCount,
                  respawnManual,
                )}
              >
                <span class="hunt-sticky-lbl hunt-sticky-lbl-tip">
                  GP filtro
                  <span class="calc-hint-trigger" aria-hidden="true">
                    i
                  </span>
                </span>
              </InfoHoverTip>
              <span class="hunt-sticky-val profit">{fmtGpTotalRange(gpFilteredLow, gpFilteredHigh)}</span>
            </div>
            <div class="hunt-sticky-stat hunt-sticky-stat-gp">
              <InfoHoverTip content={gpDropsHint(metrics, baseLow, baseHigh, goldLow, goldHigh)}>
                <span class="hunt-sticky-lbl hunt-sticky-lbl-tip">
                  GP drops
                  <span class="calc-hint-trigger" aria-hidden="true">
                    i
                  </span>
                </span>
              </InfoHoverTip>
              <span class="hunt-sticky-val">{fmtGpTotalRange(gpBaseLow, gpBaseHigh)}</span>
            </div>
          </>
        )}
      </div>

      <div class="hunt-sticky-meta">
        {fmtXpPerHourFromRaw(baseXpPerHourLow, baseXpPerHourHigh, gainRate)}
        {' · '}
        raw {fmtCompact(Math.round(fmtMid(baseXpPerHourLow, baseXpPerHourHigh)))} xp/h
        {' · '}
        {metrics.creatureMin}–{metrics.creatureMax} cri
        {' · '}
        respawn {fmtRespawnSec(metrics.respawnInterval)}s
        {respawnManual ? ' (client)' : ' (est.)'}
        {showProfit && (
          <>
            {' · '}
            {active}/{totalLootCount} loot
          </>
        )}
      </div>
    </div>
  );
}
