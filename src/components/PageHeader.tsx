import { SearchBar } from './SearchBar';

interface PageHeaderProps {
  title: string;
  description?: string;
  searchValue: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  searchInputId?: string;
}

export function PageHeader({
  title,
  description,
  searchValue,
  onSearch,
  searchPlaceholder,
  searchInputId,
}: PageHeaderProps) {
  return (
    <header class="page-header">
      <div class="page-header-inner">
        <div class="page-header-text">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <div class="page-header-search">
          <SearchBar
            inputId={searchInputId}
            value={searchValue}
            onInput={onSearch}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>
    </header>
  );
}
