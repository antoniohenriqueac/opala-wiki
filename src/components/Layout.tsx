import { useEffect, useState } from 'preact/hooks';
import { loadManifest } from '../lib/wiki-data';
import { resolveRoute, withBase } from '../lib/paths';
import { isModifiedClick, useRouter } from '../context/RouterContext';

const DONATE_PIX_URL =
  'https://nubank.com.br/cobrar/5hux2/6a4aa55b-32b6-44ca-a71f-85d7fc5ef765';

const STONEGY_PLAY_URL = 'https://stonegy-online.com';

const MOBILE_NAV_MQ = '(max-width: 768px)';

/** Set to true when the TC shop should appear in the sidebar. */
const COINS_SHOP_VISIBLE = false;

const NAV_MAIN: Array<{ href: string; label: string; icon?: string; iconSrc?: string; badge?: string }> = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/hunts', label: 'Hunt Finder', icon: '⚔' },
  { href: '/bestiary', label: 'Bestiário', icon: '👹' },
  { href: '/items', label: 'Itens', icon: '🗡' },
  { href: '/quests', label: 'Missões', icon: '📜' },
];

const NAV_TOOLS: Array<{ href: string; label: string; icon?: string }> = [
  { href: '/exp-share', label: 'Exp Share', icon: '⚡' },
  { href: '/rmt-kk', label: 'Preço KK', icon: '💰' },
];

const NAV_SHOP = { href: '/coins', label: 'Compre/Venda TC', iconSrc: 'tc-coin.png', badge: 'BETA' };

interface LayoutProps {
  path?: string;
  url?: string;
  children: preact.ComponentChildren;
}

export function Layout({ url = '/', children }: LayoutProps) {
  const { navigate } = useRouter();
  const path = url.split('?')[0] || '/';
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.classList.remove('mobile-menu-open');
      return;
    }
    document.body.classList.add('mobile-menu-open');
    return () => document.body.classList.remove('mobile-menu-open');
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ);
    const onChange = () => {
      if (!mq.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    if (href === '/hunts') return path.startsWith('/hunts');
    return path.startsWith(href);
  };

  const go = (href: string, event: MouseEvent) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    setMenuOpen(false);
    navigate(href);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const renderNavLink = (item: (typeof NAV_MAIN)[0]) => (
    <a
      key={item.href}
      href={resolveRoute(item.href)}
      onClick={(event) => go(item.href, event)}
      class={`nav-link${isActive(item.href) ? ' active' : ''}`}
    >
      <span class="nav-link-icon">
        {item.iconSrc ? (
          <img class="nav-link-icon-img" src={withBase(item.iconSrc)} alt="" width={20} height={20} />
        ) : (
          item.icon
        )}
      </span>
      <span class="nav-link-text">
        {item.label}
        {item.badge && <span class="nav-link-badge">{item.badge}</span>}
      </span>
    </a>
  );

  return (
    <div class={`layout${menuOpen ? ' menu-open' : ''}`}>
      <header class="mobile-topbar">
        <button
          type="button"
          class="mobile-menu-btn"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span class="mobile-menu-icon" aria-hidden="true" />
        </button>
        <a href={resolveRoute('/')} class="mobile-topbar-brand" onClick={(e) => go('/', e)}>
          <img
            class="mobile-topbar-avatar"
            src={withBase('opala-avatar.png')}
            alt=""
            width={32}
            height={32}
          />
          <span>Opala Wiki</span>
        </a>
        <button type="button" class="mobile-theme-btn" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <button
        type="button"
        class="sidebar-backdrop"
        aria-label="Fechar menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <aside class="sidebar" id="site-sidebar">
        <div class="brand">
          <div class="brand-row">
            <img class="brand-avatar" src={withBase('opala-avatar.png')} alt="Opala" width="40" height="40" />
            <div class="brand-text">
              <span class="brand-title">Opala Wiki</span>
              <span class="brand-sub">Wiki não oficial · feita por fãs</span>
            </div>
          </div>
        </div>

        <a
          href={STONEGY_PLAY_URL}
          class="sidebar-play-cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jogar Stonegy
        </a>

        <div class="nav-section-label">Navegação</div>
        <nav class="nav" aria-label="Principal">
          {NAV_MAIN.map(renderNavLink)}
        </nav>

        <div class="nav-section-label">Ferramentas</div>
        <nav class="nav" aria-label="Ferramentas">
          {NAV_TOOLS.map((item) => renderNavLink(item))}
          {COINS_SHOP_VISIBLE && renderNavLink(NAV_SHOP)}
        </nav>

        <button type="button" class="theme-toggle sidebar-theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀ Claro' : '☾ Escuro'}
        </button>
        <div class="donate-block">
          <div class="donate-label">Apoie o projeto</div>
          <img
            class="donate-qr"
            src={withBase('donate-pix-qr.png')}
            alt="QR Code Pix para doação"
            width="112"
            height="112"
          />
          <a class="donate-link" href={DONATE_PIX_URL} target="_blank" rel="noopener">
            Doar via Pix
          </a>
        </div>
        <div class="sidebar-footer">
          {lastUpdated && <div>Sync: {lastUpdated}</div>}
          <div>
            Dados de{' '}
            <a href="https://stonegy-online.com" target="_blank" rel="noopener">
              stonegy-online.com
            </a>
          </div>
          <div class="disclaimer">gp/h é estimativa NPC (venda). XP sempre em raw xp (Stonegy).</div>
        </div>
      </aside>
      <main class="main">{children}</main>
    </div>
  );
}
