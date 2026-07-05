import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import type { Hunt, Item, Monster, Quest } from '../lib/types';

export type DetailTarget =
  | { type: 'hunt'; data: Hunt }
  | { type: 'monster'; data: Monster }
  | { type: 'item'; data: Item }
  | { type: 'quest'; data: Quest }
  | null;

interface DetailContextValue {
  detail: DetailTarget;
  openDetail: (target: DetailTarget) => void;
  closeDetail: () => void;
}

const DetailContext = createContext<DetailContextValue | null>(null);

export function DetailProvider({ children }: { children: preact.ComponentChildren }) {
  const [detail, setDetail] = useState<DetailTarget>(null);

  const openDetail = useCallback((target: DetailTarget) => {
    setDetail(target);
    if (target) {
      const key = target.type === 'monster' ? 'monster' : target.type === 'item' ? 'item' : target.type === 'quest' ? 'quest' : 'hunt';
      const id = target.data.id;
      const url = new URL(window.location.href);
      url.searchParams.delete('monster');
      url.searchParams.delete('item');
      url.searchParams.delete('quest');
      url.searchParams.delete('hunt');
      url.searchParams.set(key, String(id));
      window.history.replaceState({}, '', url);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetail(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('monster');
    url.searchParams.delete('item');
    url.searchParams.delete('quest');
    url.searchParams.delete('hunt');
    window.history.replaceState({}, '', url);
  }, []);

  return (
    <DetailContext.Provider value={{ detail, openDetail, closeDetail }}>
      {children}
    </DetailContext.Provider>
  );
}

export function useDetail(): DetailContextValue {
  const ctx = useContext(DetailContext);
  if (!ctx) throw new Error('useDetail must be used within DetailProvider');
  return ctx;
}
