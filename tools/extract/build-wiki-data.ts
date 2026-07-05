import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { WikiData } from '../../src/lib/types';
import { validateWikiData } from './validate';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = join(ROOT, 'public');

export async function buildWikiDataJs(data: WikiData): Promise<string> {
  validateWikiData(data);
  const json = JSON.stringify(data);
  const content = `window.WIKI_DATA = ${json};\n`;
  await mkdir(join(PUBLIC, 'data'), { recursive: true });
  await writeFile(join(PUBLIC, 'data/wiki_data.js'), content);
  return content;
}

export async function buildFromSeed(): Promise<WikiData> {
  const seedPath = join(PUBLIC, 'data/wiki_data.js');
  const { readFile } = await import('node:fs/promises');
  const raw = await readFile(seedPath, 'utf8');
  const json = raw.replace(/^window\.WIKI_DATA\s*=\s*/, '').replace(/;\s*$/, '');
  return JSON.parse(json) as WikiData;
}
