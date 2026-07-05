/**
 * Varredura estática do codexloot.com — documenta assets, rotas e schema.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://codexloot.com';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/codexloot-audit.md');

const PATHS = ['/', '/monster/', '/item/', '/hunt/', '/data/wiki_data.js'];

async function fetchText(url: string): Promise<{ status: number; text: string; ct: string }> {
  const res = await fetch(url);
  return {
    status: res.status,
    text: await res.text(),
    ct: res.headers.get('content-type') || '',
  };
}

function extractAssets(html: string): string[] {
  const assets = new Set<string>();
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (!u.startsWith('http') && !u.startsWith('#') && !u.startsWith('mailto')) assets.add(u);
  }
  return [...assets].sort();
}

async function main() {
  const sections: string[] = [
    `# Codex Loot — Auditoria`,
    ``,
    `> Gerado em ${new Date().toISOString()}`,
    ``,
    `Site de referência para paridade de features da Stonegy Wiki local.`,
    ``,
  ];

  for (const path of PATHS) {
    const url = `${BASE}${path}`;
    console.log('Scanning', url);
    const { status, text, ct } = await fetchText(url);
    sections.push(`## ${path}`, '', `- URL: \`${url}\``, `- Status: ${status}`, `- Content-Type: ${ct}`, '');

    if (path.endsWith('.js')) {
      const counts = {
        openMonsterDetail: (text.match(/openMonsterDetail/g) || []).length,
        openItemDetail: (text.match(/openItemDetail/g) || []).length,
        openQuestDetail: (text.match(/openQuestDetail/g) || []).length,
        openHuntDetail: (text.match(/openHuntDetail/g) || []).length,
        computeXP: (text.match(/computeXP/g) || []).length,
      };
      sections.push('### Funções principais (app.js)', '', '```json', JSON.stringify(counts, null, 2), '```', '');
      const features = [
        'Tabs: hunts, monsters, items, quests',
        'Filtros: raça, dificuldade, slot, arma, raridade, quest type/premium, hunt level/XP range',
        'Detalhe monstro: stats, resBars, loot por raridade, vozes, skills, defenses, summon, quests',
        'Detalhe item: atributos, bônus/proteções, drops com chance',
        'Detalhe quest: prereqs, missions (caça/hunt/entrega), rooms/waves, rewards, monsters agg',
        'Detalhe hunt: criaturas, calculadora XP, loot agregado',
        'Calculadora XP: presets, DPS, speed, lure, party, boost',
        'Temas múltiplos, doação SOL, splash game selector',
      ];
      sections.push('### Features mapeadas', '', ...features.map((f) => `- ${f}`), '');
    } else {
      const assets = extractAssets(text);
      sections.push(`### Assets (${assets.length})`, '', assets.map((a) => `- \`${a}\``).join('\n'), '');
      const seo = text.match(/<div class="seo-only"[^>]*>([\s\S]*?)<\/div>/);
      if (seo) {
        sections.push('### SEO block (resumo)', '', seo[1].replace(/<[^>]+>/g, ' ').slice(0, 500) + '…', '');
      }
    }
  }

  sections.push(
    '## Paridade local',
    '',
    '| Feature Codex Loot | Stonegy Wiki local |',
    '|--------------------|-------------------|',
    '| Hunt Finder + XP calc | `/hunts` + XPCalculator |',
    '| Bestiário + detalhe completo | `/bestiary` + MonsterDetail |',
    '| Itens + quem dropa | `/items` + ItemDetail |',
    '| Missões + waves/rewards | `/quests` + QuestDetail |',
    '| Seed wiki_data.js | `npm run seed` |',
    '| Sync automático | GitHub Actions (sem deploy) |',
  );

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, sections.join('\n'));
  console.log('Wrote', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
