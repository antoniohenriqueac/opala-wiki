import { useState, useEffect } from 'preact/hooks';
import type { Hunt, Monster, XPCalcSettings } from '../lib/types';
import {
  computeXP,
  loadXPSettings,
  saveXPSettings,
  XP_PRESETS,
} from '../lib/xp-calculator';
import { fmt } from '../lib/format';

interface XPCalculatorProps {
  hunt: Hunt;
  monsters: Monster[];
}

export function XPCalculator({ hunt, monsters }: XPCalculatorProps) {
  const [settings, setSettings] = useState<XPCalcSettings>(() => loadXPSettings(hunt.id));

  useEffect(() => {
    saveXPSettings(hunt.id, settings);
  }, [hunt.id, settings]);

  if (!monsters.length) return null;

  const result = computeXP(monsters, hunt, settings);
  const totalRounded = Math.round(result.totalXpPerHour);

  const update = (patch: Partial<XPCalcSettings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const applyPreset = (name: string) => {
    const preset = XP_PRESETS[name];
    if (preset) update(preset);
  };

  return (
    <div class="xp-calc">
      <div class="xp-calc-head">
        <div class="title">
          Calculadora XP/hora
          <span class="beta-tag">BETA</span>
        </div>
        <div class="total">
          <span class="lbl">TOTAL</span>
          {totalRounded.toLocaleString('pt-BR')} xp/h
        </div>
      </div>
      <div class="xp-warn">
        Modelo experimental baseado em DPS, HP e lure. Ajuste os valores para calibrar com sua
        experiência in-game.
      </div>
      <div class="xp-inputs">
        <div class="xp-input">
          <label>Preset</label>
          <select
            onChange={(e) => applyPreset((e.target as HTMLSelectElement).value)}
          >
            {Object.keys(XP_PRESETS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div class="xp-input">
          <label>DPS</label>
          <input
            type="number"
            min={1}
            value={settings.dps}
            onInput={(e) => update({ dps: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>Speed</label>
          <input
            type="number"
            min={100}
            value={settings.speed}
            onInput={(e) => update({ speed: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>Lure (max {hunt.maxLure || 1})</label>
          <input
            type="number"
            min={1}
            max={hunt.maxLure || 1}
            value={settings.lure ?? hunt.maxLure ?? 1}
            onInput={(e) => update({ lure: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>Party size</label>
          <input
            type="number"
            min={1}
            max={8}
            value={settings.partySize}
            onInput={(e) => update({ partySize: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>Seu dano %</label>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.dmgShare}
            onInput={(e) => update({ dmgShare: +(e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="xp-input">
          <label>Boost</label>
          <input
            type="number"
            min={0.1}
            max={3}
            step={0.1}
            value={settings.boost}
            onInput={(e) => update({ boost: +(e.target as HTMLInputElement).value })}
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
            onInput={(e) => update({ stamina: +(e.target as HTMLInputElement).value })}
          />
        </div>
      </div>
      <table class="xp-table">
        <thead>
          <tr>
            <th>Criatura</th>
            <th>XP/h</th>
            <th>Peso</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{fmt(Math.round(r.xph_hunt))}</td>
              <td>{r.weight.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
