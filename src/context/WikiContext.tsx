import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import type { WikiData } from '../lib/types';
import { buildIndexes, type WikiIndexes } from '../lib/indexes';
import { getWikiData } from '../lib/wiki-data';

export interface WikiContextValue {
  data: WikiData;
  indexes: WikiIndexes;
}

const WikiContext = createContext<WikiContextValue | null>(null);

export function WikiProvider({ children }: { children: preact.ComponentChildren }) {
  const value = useMemo(() => {
    const data = getWikiData();
    const indexes = buildIndexes(data);
    return { data, indexes };
  }, []);

  return <WikiContext.Provider value={value}>{children}</WikiContext.Provider>;
}

export function useWiki(): WikiContextValue {
  const ctx = useContext(WikiContext);
  if (!ctx) throw new Error('useWiki must be used within WikiProvider');
  return ctx;
}
