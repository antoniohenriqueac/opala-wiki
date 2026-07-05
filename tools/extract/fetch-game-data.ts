/**
 * Fetch game data from Stonegy Online (CDN + client bundle).
 */
import type { WikiData } from '../../src/lib/types';
import { CDN_PATHS, STONEGY_CDN } from './stonegy-config';
import { fetchStonegyDataset, type StonegyDatasetMeta } from './parse-stonegy';
import { fetchHuntsAndQuests } from './fetch-client-bundle';
import { normalizeWikiData } from './normalize';
import { buildFromSeed } from './build-wiki-data';

export interface FetchConfig {
  source?: 'stonegy' | 'codexloot';
  email?: string;
  password?: string;
}

interface StaticManifest {
  format: string;
  version: string;
  datasets: Record<string, StonegyDatasetMeta>;
}

async function fetchStaticManifest(): Promise<StaticManifest> {
  const versionRes = await fetch(CDN_PATHS.staticVersion, {
    headers: { Referer: 'https://stonegy-online.com/' },
  });
  if (!versionRes.ok) throw new Error(`static version: ${versionRes.status}`);
  const versionJson = (await versionRes.json()) as {
    version: string;
    manifest: string;
  };

  const manifestUrl = `${STONEGY_CDN}${versionJson.manifest}`;
  console.log(`  ↓ ${manifestUrl}`);
  const manifestRes = await fetch(manifestUrl, {
    headers: { Referer: 'https://stonegy-online.com/' },
  });
  if (!manifestRes.ok) throw new Error(`static manifest: ${manifestRes.status}`);
  return manifestRes.json() as Promise<StaticManifest>;
}

export async function fetchGameData(config: FetchConfig = {}): Promise<WikiData> {
  const source = config.source ?? 'stonegy';

  if (source === 'codexloot') {
    console.log('  Using Codex Loot fallback (--source=codexloot)');
    return buildFromSeed();
  }

  try {
    console.log('  Fetching static datasets from Stonegy CDN…');
    const manifest = await fetchStaticManifest();

    const items = await fetchStonegyDataset(manifest.datasets.items, STONEGY_CDN);
    const monsters = await fetchStonegyDataset(manifest.datasets.monsters, STONEGY_CDN);
    const mapItems = manifest.datasets.mapItems
      ? await fetchStonegyDataset(manifest.datasets.mapItems, STONEGY_CDN)
      : [];

    console.log('  Extracting hunts & quests from client bundle…');
    const { hunts, quests } = await fetchHuntsAndQuests();

    const seed = await buildFromSeed().catch(() => null);

    return normalizeWikiData({
      items,
      monsters,
      hunts,
      quests,
      mapItems,
      invAssets: seed?.invAssets ?? {},
      monAssets: seed?.monAssets ?? {},
    });
  } catch (err) {
    console.warn('  Stonegy fetch failed, falling back to local seed:', err);
    return buildFromSeed();
  }
}
