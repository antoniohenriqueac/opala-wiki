interface SearchBarProps {
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onInput, placeholder = 'Buscar… (/)' }: SearchBarProps) {
  return (
    <div class="search-bar">
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
      />
    </div>
  );
}
