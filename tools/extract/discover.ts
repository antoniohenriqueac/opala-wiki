/**
 * Fase 0 — descobre endpoints do client Stonegy via HTTP probe + Playwright opcional.
 * Documenta resultados em docs/stonegy-endpoints.md
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDN_PATHS, STONEGY_CDN, STONEGY_ORIGIN } from './stonegy-config';
import { resolveClientBundleUrl } from './fetch-client-bundle';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = join(ROOT, 'docs/stonegy-endpoints.md');

interface CapturedRequest {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  contentType?: string;
}

async function probeHttpEndpoints(): Promise<{ captured: CapturedRequest[]; notes: string[] }> {
  const captured: CapturedRequest[] = [];
  const notes: string[] = ['\n### HTTP probe (sem Playwright)\n'];

  const probes = [
    CDN_PATHS.staticVersion,
    `${STONEGY_CDN}/game-data/manifest.json`,
    `${STONEGY_CDN}/updates/manifest.json`,
    `${STONEGY_ORIGIN}/game-data/static/version.json`,
  ];

  for (const url of probes) {
    try {
      const res = await fetch(url, { headers: { Referer: `${STONEGY_ORIGIN}/` } });
      const ct = res.headers.get('content-type') || '';
      captured.push({
        url,
        method: 'GET',
        resourceType: 'fetch',
        status: res.status,
        contentType: ct,
      });
      notes.push(`- \`${url}\` → ${res.status} (${ct.split(';')[0]})`);
    } catch (e) {
      notes.push(`- \`${url}\` → erro: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  try {
    const bundleUrl = await resolveClientBundleUrl();
    notes.push(`\n**Client bundle:** \`${bundleUrl}\``);
    captured.push({
      url: bundleUrl,
      method: 'GET',
      resourceType: 'script',
      status: 200,
      contentType: 'application/javascript',
    });
  } catch (e) {
    notes.push(`\nClient bundle: ${e instanceof Error ? e.message : String(e)}`);
  }

  notes.push(`
**Datasets estáticos (.stonegy):**
1. \`GET ${CDN_PATHS.staticVersion}\` → versão + path do manifest
2. \`GET ${STONEGY_CDN}/game-data/static/manifest.{version}.json\` → datasets (items, monsters, mapItems)
3. Baixar cada \`.stonegy\` referenciado no manifest (header \`STGYDAT1\` + zlib + JSON)

**Hunts & Quests:** embutidos no bundle \`_app-*.js\` (Map literals)

**Sprites:** \`${STONEGY_ORIGIN}/assets/inventory/{name}.gif\` e \`/assets/monsters/{name}.gif\`
`);

  return { captured, notes };
}

async function writeDiscoveryDoc(
  captured: CapturedRequest[],
  notes: string[],
): Promise<CapturedRequest[]> {
  const unique = [...new Map(captured.map((c) => [c.url, c])).values()].sort((a, b) =>
    a.url.localeCompare(b.url),
  );

  const md = `# Stonegy Endpoints (auto-discovered)

> Gerado em ${new Date().toISOString()}

## Notas de navegação
${notes.join('\n')}

## Requests capturados (${unique.length})

| URL | Method | Type | Status | Content-Type |
|-----|--------|------|--------|--------------|
${unique
  .map(
    (c) =>
      `| \`${c.url}\` | ${c.method} | ${c.resourceType} | ${c.status ?? '—'} | ${c.contentType ?? '—'} |`,
  )
  .join('\n')}

## Pipeline wiki

1. \`fetch-game-data.ts\` — CDN static datasets + client bundle hunts/quests
2. \`build-atlas.ts\` — sprites de \`/assets/inventory/\` e \`/assets/monsters/\`
3. Fallback: \`npm run seed -- --source=codexloot\`

## Playwright (opcional)

Se auth for necessária no futuro: \`STONEGY_EMAIL\` / \`STONEGY_PASSWORD\` no CI.
Instalar deps WSL: \`npx playwright install-deps chromium\` (requer sudo).
`;

  await mkdir(dirname(DOCS), { recursive: true });
  await writeFile(DOCS, md);
  console.log(`Wrote ${DOCS} (${unique.length} endpoints)`);
  return unique;
}

export async function discoverEndpoints(): Promise<CapturedRequest[]> {
  const { captured: probed, notes: probeNotes } = await probeHttpEndpoints();
  const captured = [...probed];
  const notes = [...probeNotes];

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'StonegyWikiDiscover/1.0 (+local dev)',
    });
    const page = await context.newPage();

    page.on('response', (response) => {
      const url = response.url();
      const ct = response.headers()['content-type'] || '';
      const interesting =
        url.includes('.json') ||
        url.includes('/api/') ||
        url.includes('/assets/') ||
        url.includes('/config') ||
        ct.includes('json') ||
        url.endsWith('.gif') ||
        url.endsWith('.webp') ||
        url.endsWith('.stonegy');

      if (!interesting) return;

      captured.push({
        url,
        method: response.request().method(),
        resourceType: response.request().resourceType(),
        status: response.status(),
        contentType: ct,
      });
    });

    notes.push('\n### Playwright navigation\n');
    await page.goto(STONEGY_ORIGIN, { waitUntil: 'networkidle', timeout: 60000 });
    notes.push('Homepage: OK');

    const playBtn = page.locator('text=Jogar').first();
    if (await playBtn.count()) {
      await playBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(5000);
      notes.push('Clicou Jogar');
    }

    await browser.close();
  } catch (e) {
    notes.push(`\n### Playwright skipped\n\n${e instanceof Error ? e.message : String(e)}\n`);
    notes.push('HTTP probe acima é suficiente para o pipeline de extract.\n');
  }

  return writeDiscoveryDoc(captured, notes);
}

discoverEndpoints().catch((e) => {
  console.error(e);
  process.exit(1);
});
