import { CLIENT_MARKERS, STONEGY_ORIGIN } from './stonegy-config';

export async function resolveClientBundleUrl(): Promise<string> {
  const res = await fetch(STONEGY_ORIGIN);
  if (!res.ok) throw new Error(`Stonegy homepage: ${res.status}`);
  const html = await res.text();
  const match = html.match(/\/_next\/static\/chunks\/pages\/_app-[a-f0-9]+\.js/);
  if (!match) throw new Error('Client bundle URL not found in homepage');
  return `${STONEGY_ORIGIN}${match[0]}`;
}

function extractMapLiteral(source: string, marker: string): string {
  const open = source.indexOf(marker);
  if (open < 0) throw new Error(`Marker not found: ${marker.slice(0, 40)}…`);

  const mapStart = source.lastIndexOf('new Map([', open);
  if (mapStart < 0) throw new Error('Map start not found');

  let i = mapStart + 'new Map('.length;
  let depth = 0;
  let inStr = false;
  let strCh = '';
  let esc = false;

  for (; i < source.length; i++) {
    const c = source[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      strCh = c;
      continue;
    }
    if (c === '[') depth++;
    if (c === ']') {
      depth--;
      if (depth === 0) return source.slice(mapStart + 'new Map('.length, i + 1);
    }
  }
  throw new Error('Unclosed map literal');
}

function sanitizeMapLiteral(literal: string): string {
  return literal
    .replace(/!0/g, 'true')
    .replace(/!1/g, 'false')
    .replace(/,tutorialId:r/g, '');
}

export function parseEmbeddedMap<T>(source: string, marker: string): T[] {
  const literal = sanitizeMapLiteral(extractMapLiteral(source, marker));
  const entries = new Function(`return ${literal}`)() as [number, T][];
  return entries.map(([, value]) => value);
}

export async function fetchClientBundle(): Promise<string> {
  const url = await resolveClientBundleUrl();
  console.log(`  ↓ ${url}`);
  const res = await fetch(url, { headers: { Referer: `${STONEGY_ORIGIN}/` } });
  if (!res.ok) throw new Error(`Client bundle: ${res.status}`);
  return res.text();
}

export async function fetchHuntsAndQuests(): Promise<{ hunts: unknown[]; quests: unknown[] }> {
  const source = await fetchClientBundle();
  const hunts = parseEmbeddedMap<Record<string, unknown>>(source, CLIENT_MARKERS.hunts);
  const quests = parseEmbeddedMap<Record<string, unknown>>(source, CLIENT_MARKERS.quests);
  return { hunts, quests };
}
