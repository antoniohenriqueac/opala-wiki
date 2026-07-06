import { InfoHoverTip } from './InfoHoverTip';

interface XpBoostToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  gainRate?: number;
}

const hintFor = (gainRate: number) => ({
  title: 'XP Boost',
  paragraphs: [
    `Ativa o boost in-game: +50% gain rate na 1ª hora do tempo de caça (${gainRate}% → ${gainRate + 50}%).`,
    'Ex.: 3h de caça com premium 120% → 1h a 170% + 2h a 120%. Não altera gp/h.',
  ],
});

export function XpBoostToggle({ enabled, onChange, gainRate = 120 }: XpBoostToggleProps) {
  const hint = hintFor(gainRate);
  return (
    <div class="xp-boost-toggle">
      <div class="xp-boost-toggle-main">
        <div class="xp-boost-toggle-copy">
          <span class="xp-boost-icon" aria-hidden="true">
            xp↑
          </span>
          <div class="xp-boost-toggle-text">
            <span class="xp-boost-toggle-title">XP Boost</span>
            <span class="xp-boost-toggle-sub muted">
              +50% gain · 1h a {gainRate + 50}% ({gainRate}+50)
            </span>
          </div>
        </div>

        <label class="xp-boost-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
          />
          <span class="xp-boost-switch-track" aria-hidden="true" />
        </label>
      </div>

      <InfoHoverTip content={hint} variant="default">
        <span class="calc-hint-trigger" aria-label="Ajuda: XP Boost">
          i
        </span>
      </InfoHoverTip>
    </div>
  );
}
