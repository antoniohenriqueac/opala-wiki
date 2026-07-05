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

export async function loadManifest(): Promise<{ lastUpdated?: string } | null> {
  try {
    const res = await fetch('/data/manifest.json');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
