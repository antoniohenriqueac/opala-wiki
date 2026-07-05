interface GameChipBarProps {
  chips: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function GameChipBar({ chips, active, onChange }: GameChipBarProps) {
  return (
    <div class="game-chip-bar">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          class={`game-chip${active === chip.id ? ' active' : ''}`}
          onClick={() => onChange(chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
