import { useEffect, useRef } from 'preact/hooks';

interface SearchBarProps {
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  inputId?: string;
}

export function SearchBar({
  value,
  onInput,
  placeholder = 'Buscar…',
  inputId = 'page-search-input',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div class="search-bar search-bar-header">
      <label class="search-bar-label" for={inputId}>
        Buscar
      </label>
      <div class="search-bar-field">
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={value}
          placeholder={placeholder}
          onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        />
        <kbd class="search-bar-kbd" aria-hidden="true">
          /
        </kbd>
      </div>
    </div>
  );
}
