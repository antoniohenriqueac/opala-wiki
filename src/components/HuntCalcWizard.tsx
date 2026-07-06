import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Hunt, Monster, XPCalcSettings, Item, SpriteAsset } from '../lib/types';
import { computeXP, computeXPRange, XP_PRESETS, partyDmgShare, patchPartySize } from '../lib/xp-calculator';
import {
  estimateRespawnInterval,
  lureCreatureInterval,
  lureSelectOptions,
  maxCreaturesForHunt,
  clampLureTier,
} from '../lib/respawn-model';
import { fmt } from '../lib/format';
import { LootFilter, type LootFilterEntry } from './LootFilter';
import { HuntCalcStepper } from './HuntCalcStepper';
import { RespawnTag } from './RespawnTag';
import { CalcFieldLabel } from './CalcFieldLabel';
import { StaminaInput } from './StaminaInput';
import { XpBoostToggle } from './XpBoostToggle';

const STEP_KEY = (huntId: number) => `hunt-calc-step:${huntId}`;

interface HuntCalcWizardProps {
  hunt: Hunt;
  monsters: Monster[];
  itemById: Record<number, Item>;
  settings: XPCalcSettings;
  onSettingsChange: (patch: Partial<XPCalcSettings>) => void;
  lootEntries: LootFilterEntry[];
  excludedIds: Set<number>;
  onToggleLoot: (itemId: number) => void;
  onClearLoot: () => void;
  onFilterJunk: () => void;
  lootGpPerHour: Record<number, number>;
  goldGpPerHour?: number;
  goldGpPerKill?: number;
  invAssets: Record<string, SpriteAsset>;
}

export function HuntCalcWizard({
  hunt,
  monsters,
  itemById,
  settings,
  onSettingsChange,
  lootEntries,
  excludedIds,
  onToggleLoot,
  onClearLoot,
  onFilterJunk,
  lootGpPerHour,
  goldGpPerHour,
  goldGpPerKill,
  invAssets,
}: HuntCalcWizardProps) {
  const steps = useMemo(() => {
    const s = [{ id: 'char', label: 'Personagem' }];
    if (lootEntries.length > 0) s.push({ id: 'loot', label: 'Loot filter' });
    s.push({ id: 'results', label: 'Detalhes' });
    return s;
  }, [lootEntries.length]);

  const [activeStep, setActiveStep] = useState(() => {
    try {
      const saved = localStorage.getItem(STEP_KEY(hunt.id));
      if (saved && steps.some((s) => s.id === saved)) return saved;
    } catch {
      /* ignore */
    }
    return 'char';
  });

  useEffect(() => {
    if (!steps.some((s) => s.id === activeStep)) setActiveStep('char');
  }, [steps, activeStep]);

  useEffect(() => {
    try {
      localStorage.setItem(STEP_KEY(hunt.id), activeStep);
    } catch {
      /* ignore */
    }
  }, [hunt.id, activeStep]);

  if (!monsters.length) return null;

  const result = computeXP(monsters, hunt, settings);
  const xpRange = computeXPRange(monsters, hunt, settings);
  const lureVal = clampLureTier(hunt, settings.lure ?? hunt.maxLure ?? 1);
  const lureOptions = lureSelectOptions(hunt);
  const maxCreatures = maxCreaturesForHunt(hunt);
  const creatureInterval = lureCreatureInterval(hunt, lureVal);
  const estimatedRespawn = estimateRespawnInterval(hunt, {
    ...settings,
    lure: lureVal,
    respawnSec: undefined,
  });
  const stepIdx = steps.findIndex((s) => s.id === activeStep);
  const canPrev = stepIdx > 0;
  const canNext = stepIdx < steps.length - 1;

  const applyPreset = (name: string) => {
    const preset = XP_PRESETS[name];
    if (preset) onSettingsChange(preset);
  };

  return (
    <div class="hunt-calc-wizard">
      <div class="hunt-calc-wizard-head">
        <div class="hunt-calc-wizard-title">
          Calculadora de hunt
          <span class="beta-tag">BETA</span>
          {result.respawnLimited && (
            <RespawnTag respawnInterval={result.respawnInterval} />
          )}
        </div>
        <p class="hunt-calc-wizard-sub muted">
          Ajuste personagem, respawn e loot — raw xp/h e gp/h atualizam no rodapé.
        </p>
      </div>

      <HuntCalcStepper steps={steps} active={activeStep} onSelect={setActiveStep} />

      <div class="hunt-calc-step-panel">
        {activeStep === 'char' && (
          <div class="hunt-calc-step-content">
            <div class="step-intro">
              <h3>Seu personagem</h3>
              <p class="muted">Level, DPS, party, lure e respawn desta hunt.</p>
            </div>
            <div class="xp-inputs">
              <div class="xp-input">
                <CalcFieldLabel label="Preset" hintKey="preset" />
                <select onChange={(e) => applyPreset((e.target as HTMLSelectElement).value)}>
                  {Object.keys(XP_PRESETS).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div class="xp-input">
                <CalcFieldLabel label="Level" hintKey="level" />
                <input
                  type="number"
                  min={1}
                  value={settings.charLevel ?? 50}
                  onInput={(e) =>
                    onSettingsChange({ charLevel: +(e.target as HTMLInputElement).value })
                  }
                />
              </div>
              <div class="xp-input">
                <CalcFieldLabel label="DPS" hintKey="dps" />
                <input
                  type="number"
                  min={1}
                  value={settings.dps}
                  onInput={(e) => onSettingsChange({ dps: +(e.target as HTMLInputElement).value })}
                />
              </div>
              <div class="xp-input">
                <CalcFieldLabel label="Lure (pack)" hintKey="lure" />
                <select
                  value={lureVal}
                  onChange={(e) =>
                    onSettingsChange({ lure: +(e.target as HTMLSelectElement).value })
                  }
                >
                  {lureOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span class="field-sync-note muted">
                  Intervalo: {creatureInterval.min} a {creatureInterval.max} criaturas · MAX{' '}
                  {maxCreatures}
                </span>
              </div>
              <div class="xp-input">
                <CalcFieldLabel label="Respawn (s)" hintKey="respawn" />
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder={`est. ${estimatedRespawn.toFixed(1)}`}
                  value={settings.respawnSec ?? ''}
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    onSettingsChange({ respawnSec: v === '' ? undefined : +v });
                  }}
                />
              </div>
              <div class="xp-input">
                <CalcFieldLabel label="XP gain rate %" hintKey="gainRate" />
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={settings.gainRate ?? 120}
                  onInput={(e) =>
                    onSettingsChange({ gainRate: +(e.target as HTMLInputElement).value })
                  }
                />
                <span class="field-sync-note muted">
                  Premium/loyalty — afeta XP/h e total exibidos (padrão 120%)
                </span>
              </div>
              <div class="xp-input">
                <CalcFieldLabel label="Party size" hintKey="partySize" />
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
                <CalcFieldLabel label="Seu dano %" hintKey="dmgShare" />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.dmgShare}
                  onInput={(e) =>
                    onSettingsChange({ dmgShare: +(e.target as HTMLInputElement).value })
                  }
                />
                {settings.dmgShare === partyDmgShare(settings.partySize) ? (
                  <span class="field-sync-note muted">Padrão da PT</span>
                ) : (
                  <span class="field-sync-note muted">Custom — party size não altera isso</span>
                )}
              </div>
              <div class="xp-input xp-input-stamina">
                <CalcFieldLabel label="Tempo de caça" hintKey="stamina" />
                <StaminaInput
                  hours={settings.stamina}
                  rawXpPerHour={Math.round(xpRange.xpPerHourMid)}
                  gainRate={settings.gainRate ?? 120}
                  xpBoost={settings.xpBoost ?? false}
                  onChange={(stamina) => onSettingsChange({ stamina })}
                />
              </div>
              <div class="xp-boost-toggle-wrap">
                <XpBoostToggle
                  enabled={settings.xpBoost ?? false}
                  gainRate={settings.gainRate ?? 120}
                  onChange={(xpBoost) => onSettingsChange({ xpBoost })}
                />
              </div>
            </div>
          </div>
        )}

        {activeStep === 'loot' && lootEntries.length > 0 && (
          <div class="hunt-calc-step-content">
            <div class="step-intro">
              <h3>Loot filter</h3>
              <p class="muted">Clique para excluir junk do cálculo de gp/h. Gold da kill não entra aqui.</p>
            </div>
            <LootFilter
              huntId={hunt.id}
              entries={lootEntries}
              excludedIds={excludedIds}
              onToggle={onToggleLoot}
              onClear={onClearLoot}
              onFilterJunk={onFilterJunk}
              itemById={itemById}
              invAssets={invAssets}
              lootGpPerHour={lootGpPerHour}
              goldGpPerHour={goldGpPerHour}
              goldGpPerKill={goldGpPerKill}
              embedded
            />
          </div>
        )}

        {activeStep === 'results' && (
          <div class="hunt-calc-step-content">
            <div class="step-intro">
              <h3>Breakdown</h3>
              <p class="muted">
                Respawn ~{result.respawnInterval.toFixed(1)}s · {result.creatureMin}–
                {result.creatureMax} criaturas/tick · Party DPS {Math.round(result.totalPartyDps)}
              </p>
              <p class="muted step-note">
                Tabela usa cenário otimista ({result.creatureMax} criaturas). Rodapé usa média entre{' '}
                {result.creatureMin} e {result.creatureMax}.
              </p>
            </div>
            <table class="xp-table">
              <thead>
                <tr>
                  <th>Criatura</th>
                  <th>Raw XP/h</th>
                  <th>Ciclo</th>
                  <th>Peso</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.name}
                      {r.respawnLimited && (
                        <RespawnTag compact respawnInterval={result.respawnInterval} />
                      )}
                    </td>
                    <td>{fmt(Math.round(r.xph_hunt))}</td>
                    <td>{r.cycleTime.toFixed(2)}s</td>
                    <td>{r.weight.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div class="hunt-calc-step-footer">
        <button
          type="button"
          class="chip"
          disabled={!canPrev}
          onClick={() => canPrev && setActiveStep(steps[stepIdx - 1].id)}
        >
          ← Anterior
        </button>
        <span class="hunt-calc-step-counter">
          {stepIdx + 1} / {steps.length}
        </span>
        <button
          type="button"
          class="chip chip-primary"
          disabled={!canNext}
          onClick={() => canNext && setActiveStep(steps[stepIdx + 1].id)}
        >
          Próximo →
        </button>
      </div>
    </div>
  );
}
