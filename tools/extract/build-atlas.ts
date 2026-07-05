import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { SpriteAsset, WikiData } from '../../src/lib/types';
import { CDN_PATHS } from './stonegy-config';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ASSETS = join(ROOT, 'public/assets');
const CACHE = join(ROOT, '.cache/sprites');

const CELL = 32;
const COLS = 32;

interface SpriteMeta {
  name: string;
  buf: Buffer;
  w: number;
  h: number;
  frames: number;
  strip?: SpriteAsset['strip'];
}

async function downloadSprite(url: string, dest: string): Promise<Buffer | null> {
  try {
    const { readFile } = await import('node:fs/promises');
    try {
      return await readFile(dest);
    } catch {
      /* cache miss */
    }

    const res = await fetch(url, { headers: { Referer: 'https://stonegy-online.com/' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    return buf;
  } catch {
    return null;
  }
}

async function metaFromBuffer(name: string, buf: Buffer): Promise<SpriteMeta | null> {
  try {
    const meta = await sharp(buf, { animated: true }).metadata();
    const fullW = meta.width ?? CELL;
    const frames = Math.max(1, Math.floor(fullW / CELL));
    const frameBuf = await sharp(buf, { animated: true, page: 0 })
      .resize(CELL, CELL, { fit: 'fill' })
      .png()
      .toBuffer();

    return { name, buf: frameBuf, w: CELL, h: CELL, frames: frames > 1 ? frames : 1 };
  } catch {
    return null;
  }
}

async function collectSprites(
  names: string[],
  kind: 'item' | 'monster',
): Promise<SpriteMeta[]> {
  const out: SpriteMeta[] = [];
  for (const name of names) {
    const url =
      kind === 'item' ? CDN_PATHS.inventorySprite(name) : CDN_PATHS.monsterSprite(name);
    const dest = join(CACHE, kind, name);
    const buf = await downloadSprite(url, dest);
    if (!buf) continue;
    const meta = await metaFromBuffer(name, buf);
    if (meta) out.push(meta);
  }
  return out;
}

async function packAtlas(
  sprites: SpriteMeta[],
  prefix: 'inventory' | 'monsters',
): Promise<{ assets: Record<string, SpriteAsset>; pages: { page: number; buf: Buffer }[] }> {
  const assets: Record<string, SpriteAsset> = {};
  const pages: { page: number; buf: Buffer }[] = [];

  for (let page = 0; page * COLS * COLS < sprites.length + COLS; page++) {
    const batch = sprites.slice(page * COLS * COLS, (page + 1) * COLS * COLS);
    if (!batch.length) break;

    const rows = Math.ceil(batch.length / COLS);
    const sheetW = COLS * CELL;
    const sheetH = rows * CELL;
    const composites: sharp.OverlayOptions[] = [];

    for (let idx = 0; idx < batch.length; idx++) {
      const sp = batch[idx];
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = col * CELL;
      const y = row * CELL;

      const tile = await sharp(sp.buf)
        .resize(CELL, CELL, { fit: 'fill' })
        .png()
        .toBuffer();

      assets[sp.name] = {
        p: page,
        x,
        y,
        w: CELL,
        h: CELL,
        frames: sp.frames,
      };

      composites.push({ input: tile, left: x, top: y });
    }

    const base = sharp({
      create: {
        width: sheetW,
        height: sheetH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const png = await base.composite(composites).png().toBuffer();
    pages.push({ page, buf: png });
  }

  return { assets, pages };
}

export async function buildAtlasesFromData(data: WikiData): Promise<WikiData> {
  await mkdir(ASSETS, { recursive: true });

  const itemNames = [...new Set(data.items.map((i) => i.image).filter(Boolean))] as string[];
  const monNames = [...new Set(data.monsters.map((m) => m.image).filter(Boolean))] as string[];

  console.log(`  Building atlases (${itemNames.length} items, ${monNames.length} monsters)…`);

  const itemSprites = await collectSprites(itemNames, 'item');
  const monSprites = await collectSprites(monNames, 'monster');

  const inv = await packAtlas(itemSprites, 'inventory');
  const mon = await packAtlas(monSprites, 'monsters');

  for (const { page, buf } of inv.pages) {
    const webp = await sharp(buf).webp({ quality: 85 }).toBuffer();
    await writeFile(join(ASSETS, `inventory-0${page}.webp`), webp);
  }
  for (const { page, buf } of mon.pages) {
    const webp = await sharp(buf).webp({ quality: 85 }).toBuffer();
    await writeFile(join(ASSETS, `monsters-0${page}.webp`), webp);
  }

  return {
    ...data,
    invAssets: inv.assets,
    monAssets: mon.assets,
  };
}

/** Download individual sprites (cache only — atlases built separately). */
export async function fetchSprites(data?: WikiData): Promise<void> {
  if (!data) return;
  await mkdir(CACHE, { recursive: true });
  const itemNames = [...new Set(data.items.map((i) => i.image).filter(Boolean))] as string[];
  const monNames = [...new Set(data.monsters.map((m) => m.image).filter(Boolean))] as string[];
  console.log(`  Caching sprites (${itemNames.length + monNames.length})…`);
  await collectSprites(itemNames, 'item');
  await collectSprites(monNames, 'monster');
}

export async function buildAtlas(data?: WikiData): Promise<WikiData | void> {
  if (!data) return;
  return buildAtlasesFromData(data);
}
