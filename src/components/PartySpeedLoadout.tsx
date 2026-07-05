import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Item, Hunt, XPCalcSettings } from '../lib/types';
import {
  SPEED_SLOTS,
  type SpeedLoadout,
  type SpeedSlot,
  loadSpeedLoadout,
  saveSpeedLoadout,
  sumEquippedSpeed,
  speedItemsBySlot,
  SPEED_PRESETS,
  itemSpeedValue,
} from '../lib/speed-items';
import { filterItems } from '../lib/item-filters';
import { estimateRespawnInterval, SPEED_COEFF } from '../lib/respawn-model';

interface PartySpeedLoadoutProps {
  items: Item[];
  itemById: Record<number, Item>;
  settings: XPCalcSettings;
  hunt: Hunt;
  onSpeedChange: (totalSpeed: number, loadout: SpeedLoadout) => void;
}

const SLOT_LABELS: Record<SpeedSlot, string> = {
  FOOT: 'Botas',
  LEGS: 'Pernas',
  BODY: 'Armadura',
  HEAD: 'Capacete',
  NECK: 'Colar/Anel',
};

export function PartySpeedLoadout({
  items,
  itemById,
  settings,
  hunt,
  onSpeedChange,
}: PartySpeedLoadoutProps) {
  const [loadout, setLoadout] = useState<SpeedLoadout>(() => loadSpeedLoadout());
  const [manualSpeed, setManualSpeed] = useState<number | null>(null);

  const charLevel = settings.charLevel ?? 50;

  const eligibleItems = useMemo(
    () => filterItems(items.filter((i) => itemSpeedValue(i) > 0), { levelMax: charLevel + 20 }),
    [items, charLevel],
  );

  const bySlot = useMemo(() => speedItemsBySlot(eligibleItems), [eligibleItems]);

  const computedSpeed = sumEquippedSpeed(loadout, itemById);
  const totalSpeed = manualSpeed ?? computedSpeed;

  useEffect(() => {
    saveSpeedLoadout(loadout);
    onSpeedChange(totalSpeed, loadout);
  }, [loadout, totalSpeed]);

  const baseInterval = estimateRespawnInterval(hunt, { ...settings, totalItemSpeed: 0 });
  const withSpeed = estimateRespawnInterval(hunt, { ...settings, totalItemSpeed: totalSpeed });

  const setSlot = (slot: SpeedSlot, itemId: number | null) => {
    setLoadout((prev) => {
      const next = { ...prev };
      if (itemId) next[slot] = itemId;
      else delete next[slot];
      return next;
    });
    setManualSpeed(null);
  };

  return (
    <div class="speed-loadout panel">
      <div class="speed-loadout-head">
        <span class="speed-loadout-title">Equipamento SPEED</span>
        <span class="speed-loadout-total">Total: {totalSpeed} speed</span>
      </div>
      <div class="loot-filter-actions">
        {SPEED_PRESETS.map((p) => (
          <button
            type="button"
            key={p.label}
            class="chip"
            onClick={() => {
              setLoadout({ ...p.loadout });
              setManualSpeed(null);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {SPEED_SLOTS.map((slot) => (
        <div class="speed-slot-row" key={slot}>
          <label>{SLOT_LABELS[slot]}</label>
          <select
            value={loadout[slot] ?? ''}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              setSlot(slot, v ? +v : null);
            }}
          >
            <option value="">— nenhum —</option>
            {bySlot[slot].map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} (+{itemSpeedValue(it)})
                {it.levelMin ? ` · lvl ${it.levelMin}` : ''}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div class="xp-input speed-override">
        <label>SPEED manual (override)</label>
        <input
          type="number"
          min={0}
          placeholder={String(computedSpeed)}
          value={manualSpeed ?? ''}
          onInput={(e) => {
            const v = (e.target as HTMLInputElement).value;
            setManualSpeed(v === '' ? null : +v);
          }}
        />
      </div>
      <div class="speed-respawn-est">
        Respawn estimado: <b>{withSpeed.toFixed(1)}s</b>
        {totalSpeed > 0 && (
          <span class="muted">
            {' '}
            (sem speed: {baseInterval.toFixed(1)}s · ~{(SPEED_COEFF * totalSpeed * 100).toFixed(0)}%
            mais rápido)
          </span>
        )}
      </div>
      <div class="xp-warn speed-note">
        Impacto de SPEED é estimativa (~{SPEED_COEFF}/pt). BOH +20 ≈{' '}
        {((1 - 1 / (1 + 20 * SPEED_COEFF)) * 100).toFixed(0)}% respawn mais rápido (aprox.).
      </div>
    </div>
  );
}
