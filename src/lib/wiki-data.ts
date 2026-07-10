import { withBase } from './paths';
import type { WikiData } from './types';

declare global {
  interface Window {
    WIKI_DATA?: WikiData;
  }
}

export function getWikiData(): WikiData {
  if (!window.WIKI_DATA) {
    throw new Error('WIKI_DATA não carregou. Execute npm run seed primeiro.');
  }
  return window.WIKI_DATA;
}

export interface WikiManifest {
  lastUpdated?: string;
  source?: string;
  counts?: {
    items?: number;
    monsters?: number;
    hunts?: number;
    quests?: number;
  };
}

export async function loadManifest(): Promise<WikiManifest | null> {
  try {
    const res = await fetch(withBase('data/manifest.json'));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
