import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import type { Hunt, Item, Monster, Quest } from '../lib/types';

export type DetailTarget =
  | { type: 'hunt'; data: Hunt }
  | { type: 'monster'; data: Monster }
  | { type: 'item'; data: Item }
  | { type: 'quest'; data: Quest }
  | null;

type NonNullDetailTarget = Exclude<DetailTarget, null>;

function syncDetailUrl(target: NonNullDetailTarget) {
  const key =
    target.type === 'monster'
      ? 'monster'
      : target.type === 'item'
        ? 'item'
        : target.type === 'quest'
          ? 'quest'
          : 'hunt';
  const url = new URL(window.location.href);
  url.searchParams.delete('monster');
  url.searchParams.delete('item');
  url.searchParams.delete('quest');
  url.searchParams.delete('hunt');
  url.searchParams.set(key, String(target.data.id));
  window.history.replaceState({}, '', url);
}

function clearDetailUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('monster');
  url.searchParams.delete('item');
  url.searchParams.delete('quest');
  url.searchParams.delete('hunt');
  window.history.replaceState({}, '', url);
}

interface DetailContextValue {
  detail: DetailTarget;
  canGoBack: boolean;
  openDetail: (target: DetailTarget, options?: { reset?: boolean }) => void;
  goBack: () => void;
  closeDetail: () => void;
}

const DetailContext = createContext<DetailContextValue | null>(null);

export function DetailProvider({ children }: { children: preact.ComponentChildren }) {
  const [stack, setStack] = useState<NonNullDetailTarget[]>([]);
  const detail = stack.length > 0 ? stack[stack.length - 1] : null;
  const canGoBack = stack.length > 1;

  const openDetail = useCallback((target: DetailTarget, options?: { reset?: boolean }) => {
    if (!target) return;
    setStack((prev) => {
      const next = options?.reset || prev.length === 0 ? [target] : [...prev, target];
      syncDetailUrl(target);
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      syncDetailUrl(next[next.length - 1]);
      return next;
    });
  }, []);

  const closeDetail = useCallback(() => {
    setStack([]);
    clearDetailUrl();
  }, []);

  return (
    <DetailContext.Provider value={{ detail, canGoBack, openDetail, goBack, closeDetail }}>
      {children}
    </DetailContext.Provider>
  );
}

export function useDetail(): DetailContextValue {
  const ctx = useContext(DetailContext);
  if (!ctx) throw new Error('useDetail must be used within DetailProvider');
  return ctx;
}
