import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { STONEGY_ORIGIN } from './stonegy-config';

const MAGIC = 'STGYDAT1';

export interface StonegyDatasetMeta {
  url: string;
  recordCount: number;
  size: number;
  sha256: string;
}

export function sha256Hex(buf: Buffer | Uint8Array): string {
  return createHash('sha256').update(buf).digest('hex');
}

/** Decode a `.stonegy` static dataset into JSON records. */
export function decodeStonegyFile(buf: Buffer): unknown[] {
  const magic = buf.subarray(0, 8).toString('ascii');
  if (magic !== MAGIC) {
    throw new Error(`Invalid .stonegy magic: ${magic}`);
  }

  let zlibOffset = -1;
  for (let i = 8; i < Math.min(buf.length, 128); i++) {
    if (buf[i] === 0x78 && (buf[i + 1] === 0x01 || buf[i + 1] === 0x9c || buf[i + 1] === 0xda)) {
      zlibOffset = i;
      break;
    }
  }
  if (zlibOffset < 0) throw new Error('Zlib payload not found in .stonegy file');

  const inflated = inflateSync(buf.subarray(zlibOffset));
  const parsed = JSON.parse(inflated.toString('utf8'));

  if (!Array.isArray(parsed)) {
    throw new Error('.stonegy payload is not an array');
  }

  return parsed.map((entry) => {
    if (Array.isArray(entry) && entry.length === 2) return entry[1];
    return entry;
  });
}

export async function fetchStonegyDataset(
  meta: StonegyDatasetMeta,
  baseUrl: string,
): Promise<unknown[]> {
  const url = `${baseUrl}${meta.url}`;
  const res = await fetch(url, {
    headers: { Referer: `${STONEGY_ORIGIN}/`, Origin: STONEGY_ORIGIN },
  });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength !== meta.size) {
    throw new Error(
      `Size mismatch for ${meta.url}: expected ${meta.size}, got ${buf.byteLength}`,
    );
  }
  if (sha256Hex(buf) !== meta.sha256) {
    throw new Error(`SHA256 mismatch for ${meta.url}`);
  }

  const records = decodeStonegyFile(buf);
  if (meta.recordCount && records.length !== meta.recordCount) {
    console.warn(
      `  Record count mismatch ${meta.url}: expected ${meta.recordCount}, got ${records.length}`,
    );
  }
  return records;
}
