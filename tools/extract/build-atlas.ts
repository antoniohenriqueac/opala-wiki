import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { SpriteAsset, WikiData } from '../../src/lib/types';
import { CDN_PATHS } from './stonegy-config';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ASSETS = join(ROOT, 'public/assets');
const CACHE = join(ROOT, '.cache/sprites');

const ITEM_CELL = 32;
const MONSTER_CELL = 64;
const ITEM_COLS = 32;
const MONSTER_COLS = 16;
const STRIP_DUR_MS = 120;

interface SpriteMeta {
  name: string;
  /** Horizontal strip (all frames) ready to blit into atlas */
  buf: Buffer;
  w: number;
  h: number;
  frames: number;
  stripWidth: number;
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

function detectFrames(fullW: number, fullH: number): { frames: number; frameSize: number } {
  if (fullW === fullH) return { frames: 1, frameSize: fullW };
  if (fullH > fullW && fullH % fullW === 0) {
    return { frames: fullH / fullW, frameSize: fullW };
  }
  if (fullW > fullH && fullW % fullH === 0) {
    return { frames: fullW / fullH, frameSize: fullH };
  }
  return { frames: 1, frameSize: Math.max(fullW, fullH) };
}

async function metaFromBuffer(
  name: string,
  buf: Buffer,
  cellSize: number,
  kind: 'item' | 'monster',
): Promise<SpriteMeta | null> {
  try {
    const frameBuffers: Buffer[] = [];

    if (kind === 'item') {
      const frameBuf = await sharp(buf, { animated: true, page: 0, pages: 1 })
        .resize(cellSize, cellSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      frameBuffers.push(frameBuf);
    } else {
      const meta = await sharp(buf, { animated: true }).metadata();
      const fullW = meta.width ?? cellSize;
      const fullH = meta.height ?? cellSize;
      const pageCount = meta.pages ?? 1;

      if (pageCount > 1) {
        for (let i = 0; i < pageCount; i++) {
          const frameBuf = await sharp(buf, { animated: true, page: i, pages: 1 })
            .resize(cellSize, cellSize, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();
          frameBuffers.push(frameBuf);
        }
      } else {
        const { frames, frameSize } = detectFrames(fullW, fullH);
        for (let i = 0; i < frames; i++) {
          const left = fullW > fullH ? i * frameSize : 0;
          const top = fullH > fullW ? i * frameSize : 0;
          const frameBuf = await sharp(buf)
            .extract({
              left,
              top,
              width: Math.min(frameSize, fullW - left),
              height: Math.min(frameSize, fullH - top),
            })
            .resize(cellSize, cellSize, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();
          frameBuffers.push(frameBuf);
        }
      }
    }

    const frames = frameBuffers.length;
    const stripWidth = cellSize * frames;
    const stripBuf = await sharp({
      create: {
        width: stripWidth,
        height: cellSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(frameBuffers.map((input, i) => ({ input, left: i * cellSize, top: 0 })))
      .png()
      .toBuffer();

    return { name, buf: stripBuf, w: cellSize, h: cellSize, frames, stripWidth };
  } catch {
    return null;
  }
}

async function collectSprites(
  names: string[],
  kind: 'item' | 'monster',
): Promise<SpriteMeta[]> {
  const cellSize = kind === 'monster' ? MONSTER_CELL : ITEM_CELL;
  const out: SpriteMeta[] = [];
  for (const name of names) {
    const url =
      kind === 'item' ? CDN_PATHS.inventorySprite(name) : CDN_PATHS.monsterSprite(name);
    const dest = join(CACHE, kind, name);
    const buf = await downloadSprite(url, dest);
    if (!buf) continue;
    const meta = await metaFromBuffer(name, buf, cellSize, kind);
    if (meta) out.push(meta);
  }
  return out;
}

async function packAtlas(
  sprites: SpriteMeta[],
  cellSize: number,
  cols: number,
): Promise<{ assets: Record<string, SpriteAsset>; pages: { page: number; buf: Buffer }[] }> {
  const assets: Record<string, SpriteAsset> = {};
  const pages: { page: number; buf: Buffer }[] = [];

  let page = 0;
  let idx = 0;

  while (idx < sprites.length) {
    const batch: SpriteMeta[] = [];
    let row = 0;
    let col = 0;
    let maxRow = 0;
    const placements: { sp: SpriteMeta; x: number; y: number }[] = [];

    while (idx < sprites.length) {
      const sp = sprites[idx]!;
      const slotCols = Math.max(1, sp.frames);
      if (slotCols > cols) {
        idx++;
        continue;
      }
      if (col + slotCols > cols) {
        col = 0;
        row++;
      }
      if (row >= cols) break;

      const x = col * cellSize;
      const y = row * cellSize;
      placements.push({ sp, x, y });
      batch.push(sp);
      col += slotCols;
      maxRow = Math.max(maxRow, row);
      idx++;
    }

    if (!placements.length) {
      if (idx < sprites.length) idx++;
      else break;
      continue;
    }

    const sheetW = cols * cellSize;
    const sheetH = (maxRow + 1) * cellSize;
    const composites: sharp.OverlayOptions[] = [];

    for (const { sp, x, y } of placements) {
      assets[sp.name] = {
        p: page,
        x,
        y,
        w: sp.w,
        h: sp.h,
        frames: sp.frames,
        ...(sp.frames > 1
          ? {
              strip: {
                sx: x,
                sy: y,
                stepX: sp.w,
                dur: STRIP_DUR_MS,
              },
            }
          : {}),
      };
      composites.push({ input: sp.buf, left: x, top: y });
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
    page++;
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

  const inv = await packAtlas(itemSprites, ITEM_CELL, ITEM_COLS);
  const mon = await packAtlas(monSprites, MONSTER_CELL, MONSTER_COLS);

  for (const { page, buf } of inv.pages) {
    const webp = await sharp(buf).webp({ quality: 85 }).toBuffer();
    await writeFile(join(ASSETS, `inventory-${String(page).padStart(2, '0')}.webp`), webp);
  }
  for (const { page, buf } of mon.pages) {
    const webp = await sharp(buf).webp({ quality: 85 }).toBuffer();
    await writeFile(join(ASSETS, `monsters-${String(page).padStart(2, '0')}.webp`), webp);
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
