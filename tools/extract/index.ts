import { fetchGameData } from './fetch-game-data';
import { fetchSprites, buildAtlas } from './build-atlas';
import { buildWikiDataJs } from './build-wiki-data';
import { sha256, writeManifest, readPreviousManifest, manifestChanged } from './manifest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

function parseSource(): 'stonegy' | 'codexloot' {
  const arg = process.argv.find((a) => a.startsWith('--source='));
  if (arg?.endsWith('codexloot')) return 'codexloot';
  return 'stonegy';
}

async function main() {
  const source = parseSource();
  console.log(`Stonegy extract pipeline (source: ${source})…`);

  let data = await fetchGameData({ source });

  await fetchSprites(data);
  try {
    const atlasData = await buildAtlas(data);
    if (atlasData) data = atlasData;
  } catch (err) {
    console.warn('  Atlas build failed, keeping existing sprite maps:', err);
  }

  const content = await buildWikiDataJs(data);
  const wikiHash = sha256(content);

  const manifest = await writeManifest(
    {
      items: data.items.length,
      monsters: data.monsters.length,
      hunts: data.hunts.length,
      quests: data.quests.length,
    },
    { wiki_data: wikiHash },
    source === 'stonegy' ? 'stonegy-extract' : 'codexloot-fallback',
  );

  const prev = await readPreviousManifest();
  const changed = manifestChanged(prev, manifest.hashes);

  console.log('Counts:', manifest.counts);
  console.log('Hash:', wikiHash.slice(0, 12), changed ? '(changed)' : '(unchanged)');

  if (process.env.CI && changed) {
    await import('node:fs/promises').then((fs) =>
      fs.writeFile(join(ROOT, '.extract-changed'), '1'),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
