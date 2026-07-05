import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Item, Hunt, XPCalcSettings } from '../lib/types';
import {
  SPEED_SLOTS,
  SPEED_SLOT_LABELS,
  type SpeedLoadout,
  type SpeedSlot,
  loadSpeedLoadout,
  saveSpeedLoadout,
  sumEquippedSpeed,
  speedItemsBySlot,
  SPEED_PRESETS,
  itemSpeedValue,
} from '../lib/speed-items';
import { estimateRespawnInterval, speedRespawnReductionSec, SPEED_POINTS_PER_SEC } from '../lib/respawn-model';

interface PartySpeedLoadoutProps {
  items: Item[];
  itemById: Record<number, Item>;
  settings: XPCalcSettings;
  hunt: Hunt;
  onSpeedChange: (totalSpeed: number, loadout: SpeedLoadout) => void;
}

const SLOT_LABELS = SPEED_SLOT_LABELS;

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

  const speedCatalog = useMemo(() => {
    const byId = new Map<number, Item>();
    for (const it of items) {
      if (itemSpeedValue(it) > 0) byId.set(it.id, it);
    }
    for (const it of Object.values(itemById)) {
      if (itemSpeedValue(it) > 0) byId.set(it.id, it);
    }
    return [...byId.values()];
  }, [items, itemById]);

  const bySlot = useMemo(() => speedItemsBySlot(speedCatalog), [speedCatalog]);

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
            {bySlot[slot].map((it) => {
              const overLevel = it.levelMin != null && it.levelMin > charLevel;
              return (
                <option key={it.id} value={it.id}>
                  {it.name} (+{itemSpeedValue(it)})
                  {it.levelMin != null ? ` · lvl ${it.levelMin}` : ''}
                  {overLevel ? ' ⚠' : ''}
                </option>
              );
            })}
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
            (sem speed: {baseInterval.toFixed(1)}s · −{speedRespawnReductionSec(totalSpeed).toFixed(1)}s)
          </span>
        )}
      </div>
      <div class="speed-catalog-note muted">
        {speedCatalog.length} itens SPEED no wiki · {SPEED_SLOTS.filter((s) => bySlot[s].length).length}{' '}
        slots com opções
      </div>
      <div class="xp-warn speed-note">
        Regra in-game: {SPEED_POINTS_PER_SEC} SPEED = −1s no respawn. BOH +20 ≈ −1.0s. Mesmo ciclo
        afeta XP/h e GP/h.
      </div>
    </div>
  );
}
