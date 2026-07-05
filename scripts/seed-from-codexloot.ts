import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const BASE = 'https://codexloot.com';

async function download(url: string, dest: string): Promise<void> {
  console.log(`  ↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  await mkdir(dirname(dest), { recursive: true });
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

function parseWikiData(js: string): Record<string, unknown> {
  const json = js.replace(/^window\.WIKI_DATA\s*=\s*/, '').replace(/;\s*$/, '');
  return JSON.parse(json);
}

async function main() {
  console.log('Seeding from Codex Loot…');

  const wikiRes = await fetch(`${BASE}/data/wiki_data.js`);
  if (!wikiRes.ok) throw new Error(`wiki_data.js: ${wikiRes.status}`);
  const wikiJs = await wikiRes.text();
  await download(`${BASE}/data/wiki_data.js`, join(PUBLIC, 'data/wiki_data.js'));

  const data = parseWikiData(wikiJs);
  const invPages = new Set<number>();
  const monPages = new Set<number>();
  for (const a of Object.values(data.invAssets as Record<string, { p: number }>))
    invPages.add(a.p);
  for (const a of Object.values(data.monAssets as Record<string, { p: number }>))
    monPages.add(a.p);

  for (const p of invPages) {
    const name = `inventory-0${p}.webp`;
    await download(`${BASE}/assets/${name}`, join(PUBLIC, 'assets', name));
  }
  for (const p of monPages) {
    const name = `monsters-0${p}.webp`;
    await download(`${BASE}/assets/${name}`, join(PUBLIC, 'assets', name));
  }

  const manifest = {
    lastUpdated: new Date().toISOString(),
    source: 'codexloot-seed',
    counts: {
      items: (data.items as unknown[]).length,
      monsters: (data.monsters as unknown[]).length,
      hunts: (data.hunts as unknown[]).length,
      quests: (data.quests as unknown[]).length,
    },
    hashes: { wiki_data: 'seed' },
  };
  await writeFile(join(PUBLIC, 'data/manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('Done:', manifest.counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
