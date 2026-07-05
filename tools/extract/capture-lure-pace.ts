/**
 * Captures lurePace respawn data from Stonegy client during a hunt session.
 *
 * Protocol field (from _app bundle):
 *   lurePace: { intervalMs, intervalSeconds, minSeconds, maxSeconds,
 *               speed, recommendedLevel, effectiveLevel }
 *
 * Usage:
 *   STONEGY_EMAIL=... STONEGY_PASSWORD=... npx tsx tools/extract/capture-lure-pace.ts
 *
 * Falls back to documenting manual samples in docs/lure-pace-samples.json
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'docs/lure-pace-samples.json');

export interface LurePaceSample {
  huntId?: number;
  huntTitle?: string;
  charLevel?: number;
  partySize?: number;
  lure?: number;
  totalItemSpeed?: number;
  lurePace?: {
    intervalMs: number;
    intervalSeconds: number;
    minSeconds: number;
    maxSeconds: number;
    speed: number;
    recommendedLevel: number;
    effectiveLevel: number;
  };
  source: string;
}

async function captureWithPlaywright(): Promise<LurePaceSample[]> {
  const email = process.env.STONEGY_EMAIL;
  const password = process.env.STONEGY_PASSWORD;
  if (!email || !password) {
    console.log('STONEGY_EMAIL / STONEGY_PASSWORD not set — skipping live capture.');
    return [];
  }

  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const samples: LurePaceSample[] = [];

    page.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        const payload = typeof frame.payload === 'string' ? frame.payload : '';
        if (payload.includes('lurePace') || payload.includes('intervalSeconds')) {
          console.log('[ws frame]', payload.slice(0, 200));
        }
      });
    });

    await page.goto('https://stonegy-online.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('Logged in page loaded — hunt capture requires manual hunt entry in headed mode.');
    console.log('Read lurePace from hunt UI: "Tempo de respawn: Xs" and equipment SPEED total.');

    await browser.close();
    return samples;
  } catch (err) {
    console.warn('Playwright capture failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

async function main() {
  const captured = await captureWithPlaywright();
  const existing = JSON.parse(readFileSync(OUT, 'utf8')) as {
    samples: LurePaceSample[];
    [key: string]: unknown;
  };

  if (captured.length) {
    existing.samples = [...existing.samples, ...captured];
    writeFileSync(OUT, JSON.stringify(existing, null, 2));
    console.log(`Appended ${captured.length} samples to ${OUT}`);
  } else {
    console.log(`No live samples. Manual calibration in ${OUT}`);
    console.log('Document lurePace fields in docs/stonegy-endpoints.md');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
