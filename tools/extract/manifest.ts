import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = join(ROOT, 'public');

export function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export async function writeManifest(
  counts: Record<string, number>,
  hashes: Record<string, string>,
  source = 'stonegy-extract',
) {
  const manifest = {
    lastUpdated: new Date().toISOString(),
    source,
    counts,
    hashes,
  };
  await mkdir(join(PUBLIC, 'data'), { recursive: true });
  await writeFile(join(PUBLIC, 'data/manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

export async function readPreviousManifest(): Promise<{ hashes?: Record<string, string> } | null> {
  try {
    const raw = await readFile(join(PUBLIC, 'data/manifest.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function manifestChanged(
  prev: { hashes?: Record<string, string> } | null,
  next: Record<string, string>,
): boolean {
  if (!prev?.hashes) return true;
  return JSON.stringify(prev.hashes) !== JSON.stringify(next);
}
