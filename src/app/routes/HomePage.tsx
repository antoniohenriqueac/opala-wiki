import { useEffect, useMemo, useState } from 'preact/hooks';
import { useWiki } from '../../context/WikiContext';
import { useDetail } from '../../context/DetailContext';
import { useRouter } from '../../context/RouterContext';
import { loadManifest } from '../../lib/wiki-data';
import { fmtCompact } from '../../lib/format';
import { SpriteIcon, monsterHasWalkAnimation } from '../../components/SpriteIcon';
import type { Monster } from '../../lib/types';

const QUICK_LINKS = [
  { href: '/hunts', label: 'Hunt Finder', icon: '⚔', desc: 'Raw xp/h e gp/h por hunt' },
  { href: '/bestiary', label: 'Bestiário', icon: '👹', desc: 'Resistências, loot e stats' },
  { href: '/items', label: 'Itens', icon: '🗡', desc: 'Catálogo com loot reverso' },
  { href: '/quests', label: 'Missões', icon: '📜', desc: 'Objetivos e recompensas' },
  { href: '/exp-share', label: 'Exp Share', icon: '⚡', desc: 'Faixa de party XP' },
  { href: '/rmt-kk', label: 'Preço KK', icon: '💰', desc: 'Referência RMT vs donate' },
];

function LegendaryCard({ monster, onClick }: { monster: Monster; onClick: () => void }) {
  const { data } = useWiki();
  return (
    <button type="button" class="home-legend-card" onClick={onClick}>
      <div class="home-legend-sprite">
        <SpriteIcon
          kind="monster"
          imageName={monster.image}
          animated={monsterHasWalkAnimation(data.monAssets, monster.image)}
          size={56}
          assets={data.monAssets}
        />
      </div>
      <div class="home-legend-name">{monster.name}</div>
      <div class="home-legend-stats">
        <span>HP {fmtCompact(monster.hp)}</span>
        <span>XP {fmtCompact(monster.xp)}</span>
      </div>
    </button>
  );
}

export function HomePage() {
  const { data } = useWiki();
  const { openDetail } = useDetail();
  const { navigate } = useRouter();
  const [counts, setCounts] = useState({ items: 0, monsters: 0, hunts: 0, quests: 0 });

  useEffect(() => {
    loadManifest().then((m) => {
      if (m?.counts) setCounts(m.counts as typeof counts);
    });
  }, []);

  const legendaries = useMemo(() => {
    return [...(data.monsters || [])]
      .filter((m) => m.hp >= 50_000 || m.xp >= 50_000)
      .sort((a, b) => b.xp - a.xp || b.hp - a.hp)
      .slice(0, 8);
  }, [data.monsters]);

  const stats = [
    { label: 'Criaturas', value: counts.monsters || data.monsters?.length || 0 },
    { label: 'Itens', value: counts.items || data.items?.length || 0 },
    { label: 'Hunts', value: counts.hunts || data.hunts?.length || 0 },
    { label: 'Missões', value: counts.quests || data.quests?.length || 0 },
  ];

  return (
    <div class="home-page">
      <section class="home-hero">
        <span class="home-badge">Wiki não oficial · feita por fãs</span>
        <h1>Domine o mundo de Stonegy</h1>
        <p class="home-lead">
          Bestiário completo, Hunt Finder, catálogo de itens com loot reverso, missões e ferramentas
          da comunidade — tudo do MMORPG idle no estilo clássico, em um só lugar.
        </p>
        <div class="home-hero-actions">
          <button type="button" class="home-cta primary" onClick={() => navigate('/hunts')}>
            Hunt Finder
          </button>
          <button type="button" class="home-cta" onClick={() => navigate('/bestiary')}>
            Bestiário
          </button>
          <button type="button" class="home-cta" onClick={() => navigate('/items')}>
            Itens
          </button>
        </div>
      </section>

      <section class="home-stats">
        {stats.map((s) => (
          <div class="home-stat" key={s.label}>
            <div class="home-stat-value">{s.value.toLocaleString('pt-BR')}</div>
            <div class="home-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <section class="home-section">
        <div class="home-section-head">
          <h2>Criaturas lendárias</h2>
          <button type="button" class="home-link" onClick={() => navigate('/bestiary')}>
            ver bestiário completo →
          </button>
        </div>
        <div class="home-legend-grid">
          {legendaries.map((m) => (
            <LegendaryCard
              key={m.id}
              monster={m}
              onClick={() => openDetail({ type: 'monster', data: m })}
            />
          ))}
        </div>
      </section>

      <section class="home-section">
        <h2>Ferramentas</h2>
        <div class="home-tools-grid">
          {QUICK_LINKS.map((link) => (
            <button
              type="button"
              key={link.href}
              class="home-tool-card"
              onClick={() => navigate(link.href)}
            >
              <span class="home-tool-icon">{link.icon}</span>
              <span class="home-tool-label">{link.label}</span>
              <span class="home-tool-desc">{link.desc}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
