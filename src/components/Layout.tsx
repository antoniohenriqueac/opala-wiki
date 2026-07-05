import { useEffect, useState } from 'preact/hooks';
import { loadManifest } from '../lib/wiki-data';
import { resolveRoute, withBase } from '../lib/paths';
import { isModifiedClick, navigate } from '../lib/router';

const NAV = [
  { href: '/hunts', label: 'Hunt Finder', icon: '⚔' },
  { href: '/bestiary', label: 'Bestiário', icon: '👹' },
  { href: '/items', label: 'Itens', icon: '🗡' },
  { href: '/quests', label: 'Missões', icon: '📜' },
];

interface LayoutProps {
  path?: string;
  url?: string;
  children: preact.ComponentChildren;
}

export function Layout({ url = '/hunts', children }: LayoutProps) {
  const path = url.split('?')[0] || '/hunts';
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    loadManifest().then((m) => {
      if (m?.lastUpdated) {
        setLastUpdated(new Date(m.lastUpdated).toLocaleDateString('pt-BR'));
      }
    });
  }, []);

  return (
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-row">
            <img class="brand-avatar" src={withBase('opala-avatar.png')} alt="Opala" width="40" height="40" />
            <div class="brand-text">
              <span class="brand-title">Opala Wiki</span>
              <span class="brand-sub">Stonegy Wiki - Nao afiliado</span>
            </div>
          </div>
        </div>
        <nav class="nav">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={resolveRoute(item.href)}
              onClick={(event) => {
                if (isModifiedClick(event)) return;
                event.preventDefault();
                navigate(item.href);
              }}
              class={`nav-link${
                item.href === '/hunts'
                  ? path === '/' || path.startsWith('/hunts')
                    ? ' active'
                    : ''
                  : path.startsWith(item.href)
                    ? ' active'
                    : ''
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          class="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? '☀ Claro' : '☾ Escuro'}
        </button>
        <div class="sidebar-footer">
          {lastUpdated && <div>Sync: {lastUpdated}</div>}
          <div>
            Dados de{' '}
            <a href="https://stonegy-online.com" target="_blank" rel="noopener">
              stonegy-online.com
            </a>
          </div>
          <div class="disclaimer">Lucro/h é estimativa NPC.</div>
        </div>
      </aside>
      <main class="main">{children}</main>
    </div>
  );
}
