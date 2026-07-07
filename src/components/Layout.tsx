import { useEffect, useState } from 'preact/hooks';
import { loadManifest } from '../lib/wiki-data';
import { resolveRoute, withBase } from '../lib/paths';
import { isModifiedClick, useRouter } from '../context/RouterContext';

const DONATE_PIX_URL =
  'https://nubank.com.br/cobrar/5hux2/6a4aa55b-32b6-44ca-a71f-85d7fc5ef765';

const MOBILE_NAV_MQ = '(max-width: 768px)';

/** Set to true when the TC shop should appear in the sidebar. */
const COINS_SHOP_VISIBLE = false;

const NAV: Array<{ href: string; label: string; icon?: string; iconSrc?: string; badge?: string }> = [
  { href: '/hunts', label: 'Hunt Finder', icon: '⚔' },
  { href: '/bestiary', label: 'Bestiário', icon: '👹' },
  { href: '/items', label: 'Itens', icon: '🗡' },
  { href: '/quests', label: 'Missões', icon: '📜' },
  { href: '/exp-share', label: 'Exp Share', icon: '⚡' },
  { href: '/rmt-kk', label: 'Preço KK', icon: '💰' },
  { href: '/coins', label: 'Compre/Venda TC', iconSrc: 'tc-coin.png', badge: 'BETA' },
].filter((item) => COINS_SHOP_VISIBLE || item.href !== '/coins');

interface LayoutProps {
  path?: string;
  url?: string;
  children: preact.ComponentChildren;
}

export function Layout({ url = '/hunts', children }: LayoutProps) {
  const { navigate } = useRouter();
  const path = url.split('?')[0] || '/hunts';
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

  const isActive = (href: string) =>
    href === '/hunts'
      ? path === '/' || path.startsWith('/hunts')
      : path.startsWith(href);

  const go = (href: string, event: MouseEvent) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    setMenuOpen(false);
    navigate(href);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

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
        <a
          href={resolveRoute('/hunts')}
          class="mobile-topbar-brand"
          onClick={(e) => go('/hunts', e)}
        >
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
              <span class="brand-sub">Stonegy Wiki - Nao afiliado</span>
            </div>
          </div>
        </div>
        <nav class="nav" aria-label="Principal">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={resolveRoute(item.href)}
              onClick={(event) => go(item.href, event)}
              class={`nav-link${isActive(item.href) ? ' active' : ''}`}
            >
              <span class="nav-link-icon">
                {item.iconSrc ? (
                  <img
                    class="nav-link-icon-img"
                    src={withBase(item.iconSrc)}
                    alt=""
                    width={20}
                    height={20}
                  />
                ) : (
                  item.icon
                )}
              </span>
              <span class="nav-link-text">
                {item.label}
                {item.badge && <span class="nav-link-badge">{item.badge}</span>}
              </span>
            </a>
          ))}
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
