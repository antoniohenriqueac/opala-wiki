import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

interface RouterContextValue {
  url: string;
  navigate: (route: string) => void;
}

export const RouterContext = createContext<RouterContextValue | null>(null);

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterContext');
  return ctx;
}

export function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}
