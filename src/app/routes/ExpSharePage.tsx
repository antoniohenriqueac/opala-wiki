import { useMemo, useState } from 'preact/hooks';
import {
  analyzeParty,
  expShareRange,
  spanLevels,
  type PartyMember,
} from '../../lib/exp-share';

type Mode = 'solo' | 'party';

const QUICK_LEVELS = [50, 80, 100, 150, 200, 300, 500, 800, 1000];

function clampLevel(n: number): number {
  return Math.max(1, Math.min(9999, Math.floor(n) || 1));
}

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function RangeBar({ min, max, focus }: { min: number; max: number; focus: number }) {
  const pad = Math.max(8, Math.round((max - min) * 0.15));
  const lo = Math.max(0, min - pad);
  const hi = max + pad;
  const span = hi - lo || 1;
  const pct = (v: number) => `${((v - lo) / span) * 100}%`;

  return (
    <div class="expshare-bar-wrap">
      <div class="expshare-bar-track">
        <div
          class="expshare-bar-zone"
          style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }}
        />
        <div class="expshare-bar-focus" style={{ left: pct(focus) }} title={`Level ${focus}`} />
      </div>
      <div class="expshare-bar-labels">
        <span>{fmt(lo)}</span>
        <span class="expshare-bar-label-min">{fmt(min)}</span>
        <span class="expshare-bar-label-max">{fmt(max)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  );
}

function SoloPanel() {
  const [level, setLevel] = useState(60);
  const lv = clampLevel(level);
  const range = useMemo(() => expShareRange(lv), [lv]);
  const width = spanLevels(range.min, range.max);

  return (
    <div class="expshare-solo">
      <div class="expshare-level-control">
        <button type="button" class="expshare-step" onClick={() => setLevel(lv - 1)} aria-label="Diminuir level">
          −
        </button>
        <div class="expshare-level-field">
          <label class="expshare-label" for="expshare-level">
            Level do personagem
          </label>
          <input
            id="expshare-level"
            type="number"
            min={1}
            max={9999}
            value={lv}
            onInput={(e) => setLevel(clampLevel(+(e.target as HTMLInputElement).value))}
          />
        </div>
        <button type="button" class="expshare-step" onClick={() => setLevel(lv + 1)} aria-label="Aumentar level">
          +
        </button>
      </div>

      <input
        class="expshare-slider"
        type="range"
        min={1}
        max={500}
        value={Math.min(lv, 500)}
        onInput={(e) => setLevel(+(e.target as HTMLInputElement).value)}
      />

      <div class="expshare-quick">
        {QUICK_LEVELS.map((q) => (
          <button
            key={q}
            type="button"
            class={`expshare-quick-btn${lv === q ? ' active' : ''}`}
            onClick={() => setLevel(q)}
          >
            {q}
          </button>
        ))}
      </div>

      <div class="expshare-result">
        <p class="expshare-result-lead">
          Um personagem level <strong>{fmt(lv)}</strong> compartilha exp com levels entre
        </p>
        <div class="expshare-result-range">
          <div class="expshare-stat">
            <span class="expshare-stat-label">Mínimo</span>
            <span class="expshare-stat-value">{fmt(range.min)}</span>
          </div>
          <div class="expshare-stat expshare-stat-mid">
            <span class="expshare-stat-label">Faixa</span>
            <span class="expshare-stat-value">{fmt(width)} levels</span>
          </div>
          <div class="expshare-stat">
            <span class="expshare-stat-label">Máximo</span>
            <span class="expshare-stat-value">{fmt(range.max)}</span>
          </div>
        </div>
        <RangeBar min={range.min} max={range.max} focus={lv} />
      </div>

      <div class="expshare-formula">
        <h3>Como funciona</h3>
        <ul>
          <li>
            A faixa usa o <strong>maior level</strong> da party como referência.
          </li>
          <li>
            Mínimo = <code>⌈level ÷ 1,5⌉</code> · Máximo = <code>⌊level × 1,5⌋ + ajuste</code>
            (ajuste +2 se o valor for ímpar, senão +1)
          </li>
          <li>Todos os membros precisam estar dentro dessa faixa para compartilhar exp.</li>
        </ul>
      </div>
    </div>
  );
}

function newMember(): PartyMember {
  return { id: crypto.randomUUID(), name: '', level: 50 };
}

function PartyPanel() {
  const [members, setMembers] = useState<PartyMember[]>([
    { id: '1', name: 'Main', level: 100 },
    { id: '2', name: 'Druid', level: 85 },
    { id: '3', name: 'Knight', level: 70 },
  ]);

  const analysis = useMemo(() => analyzeParty(members), [members]);

  const update = (id: string, patch: Partial<PartyMember>) => {
    setMembers((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  return (
    <div class="expshare-party">
      <p class="expshare-party-hint">
        Adicione os levels da party. O cálculo usa o <strong>maior level</strong> como referência.
      </p>

      <ul class="expshare-member-list">
        {members.map((m) => (
          <li key={m.id} class="expshare-member-row">
            <input
              type="text"
              placeholder="Nome (opcional)"
              value={m.name}
              onInput={(e) => update(m.id, { name: (e.target as HTMLInputElement).value })}
            />
            <input
              type="number"
              min={1}
              max={9999}
              value={m.level}
              onInput={(e) => update(m.id, { level: clampLevel(+(e.target as HTMLInputElement).value) })}
            />
            <button
              type="button"
              class="expshare-member-remove"
              onClick={() => setMembers((list) => list.filter((x) => x.id !== m.id))}
              disabled={members.length <= 1}
              aria-label="Remover membro"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <button type="button" class="expshare-add-member" onClick={() => setMembers((l) => [...l, newMember()])}>
        + Adicionar membro
      </button>

      {analysis && (
        <div class={`expshare-party-result${analysis.allInRange ? ' ok' : ' warn'}`}>
          <div class="expshare-party-verdict">
            {analysis.allInRange ? (
              <>
                <span class="expshare-verdict-icon">✓</span>
                <span>Party pode compartilhar exp</span>
              </>
            ) : (
              <>
                <span class="expshare-verdict-icon">✕</span>
                <span>Alguns membros estão fora da faixa</span>
              </>
            )}
          </div>

          <p class="expshare-party-range">
            Referência: level <strong>{fmt(analysis.highestLevel)}</strong> → faixa{' '}
            <strong>{fmt(analysis.range.min)}</strong> a <strong>{fmt(analysis.range.max)}</strong>
          </p>

          <RangeBar
            min={analysis.range.min}
            max={analysis.range.max}
            focus={analysis.highestLevel}
          />

          <ul class="expshare-member-status">
            {analysis.members.map((m) => (
              <li key={m.id} class={m.inRange ? 'in' : 'out'}>
                <span class="expshare-member-dot" />
                <span class="expshare-member-name">{m.name.trim() || 'Sem nome'}</span>
                <span class="expshare-member-lv">Lv {fmt(m.level)}</span>
                <span class="expshare-member-tag">{m.inRange ? 'OK' : 'Fora'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ExpSharePage() {
  const [mode, setMode] = useState<Mode>('solo');

  return (
    <div class="expshare-page">
      <header class="expshare-header">
        <div>
          <h1>Exp Share Calculator</h1>
          <p class="expshare-subtitle">
            Descubra a faixa de levels para compartilhar experiência em party — mesma regra do Tibia / OT.
          </p>
        </div>
        <div class="expshare-header-badge">Party XP</div>
      </header>

      <div class="expshare-tabs">
        <button
          type="button"
          class={mode === 'solo' ? 'active' : ''}
          onClick={() => setMode('solo')}
        >
          Por level
        </button>
        <button
          type="button"
          class={mode === 'party' ? 'active' : ''}
          onClick={() => setMode('party')}
        >
          Verificar party
        </button>
      </div>

      <div class="expshare-panel">{mode === 'solo' ? <SoloPanel /> : <PartyPanel />}</div>
    </div>
  );
}
