import type { Hunt, Monster, XPCalcSettings } from '../lib/types';
import { computeXP, XP_PRESETS, patchPartySize } from '../lib/xp-calculator';
import { fmt } from '../lib/format';

interface XPCalculatorProps {
  hunt: Hunt;
  monsters: Monster[];
  settings: XPCalcSettings;
  onSettingsChange: (patch: Partial<XPCalcSettings>) => void;
  /** Hide inline total — shown in HuntMetricsSticky instead */
  compactHead?: boolean;
}

export function XPCalculator({
  hunt,
  monsters,
  settings,
  onSettingsChange,
  compactHead,
}: XPCalculatorProps) {
  if (!monsters.length) return null;

  const result = computeXP(monsters, hunt, settings);

  const applyPreset = (name: string) => {
    const preset = XP_PRESETS[name];
    if (preset) onSettingsChange(preset);
  };

  return (
    <div class="xp-calc">
      <div class={`xp-calc-head${compactHead ? ' compact' : ''}`}>
        <div class="title">
          Calculadora XP/hora
          <span class="beta-tag">BETA</span>
          {result.respawnLimited && <span class="tag respawn-cap">respawn cap</span>}
        </div>
        {!compactHead && (
          <div class="total">
            <span class="lbl">TOTAL</span>
            {Math.round(result.totalXpPerHour).toLocaleString('pt-BR')} xp/h
          </div>
        )}
      </div>
      <div class="xp-warn">
        Modelo híbrido: max(kill time, respawn). Informe o respawn do client para precisão.
        Mesmo ciclo vale para XP/h e gp/h.
      </div>
      <div class="xp-inputs">
        <div class="xp-input">
          <label>Preset</label>
          <select onChange={(e) => applyPreset((e.target as HTMLSelectElement).value)}>
            {Object.keys(XP_PRESETS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div class="xp-input">
          <label>Level</label>
          <input
            type="number"
            min={1}
            value={settings.charLevel ?? 50}
            onInput={(e) => onSettingsChange({ charLevel: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>DPS</label>
          <input
            type="number"
            min={1}
            value={settings.dps}
            onInput={(e) => onSettingsChange({ dps: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>Lure (max {hunt.maxLure || 1})</label>
          <input
            type="number"
            min={1}
            max={hunt.maxLure || 1}
            value={settings.lure ?? hunt.maxLure ?? 1}
            onInput={(e) => onSettingsChange({ lure: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>Party size</label>
          <input
            type="number"
            min={1}
            max={8}
            value={settings.partySize}
            onInput={(e) =>
              onSettingsChange(patchPartySize(+(e.target as HTMLInputElement).value))
            }
          />
        </div>
        <div class="xp-input">
          <label>Seu dano %</label>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.dmgShare}
            onInput={(e) => onSettingsChange({ dmgShare: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>Stamina</label>
          <input
            type="number"
            min={0.1}
            max={2}
            step={0.1}
            value={settings.stamina}
            onInput={(e) => onSettingsChange({ stamina: +(e.target as HTMLInputElement).value })}
          />
        </div>
      </div>
      <div class="respawn-info muted">
        Respawn ~{result.respawnInterval.toFixed(1)}s · Party DPS {Math.round(result.totalPartyDps)}
      </div>
      <table class="xp-table">
        <thead>
          <tr>
            <th>Criatura</th>
            <th>XP/h</th>
            <th>Ciclo</th>
            <th>Peso</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((r) => (
            <tr key={r.id}>
              <td>
                {r.name}
                {r.respawnLimited && <span class="tag respawn-cap">R</span>}
              </td>
              <td>{fmt(Math.round(r.xph_hunt))}</td>
              <td>{r.cycleTime.toFixed(2)}s</td>
              <td>{r.weight.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
