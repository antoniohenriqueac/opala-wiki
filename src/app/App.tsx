import { useCallback, useEffect, useState } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { DetailDrawer } from '../components/DetailDrawer';
import { RouterContext } from '../context/RouterContext';
import { HuntsPage } from './routes/HuntsPage';
import { BestiaryPage } from './routes/BestiaryPage';
import { ItemsPage } from './routes/ItemsPage';
import { QuestsPage } from './routes/QuestsPage';
import { CoinsPage } from './routes/CoinsPage';
import { ExpSharePage } from './routes/ExpSharePage';
import { RmtKkPage } from './routes/RmtKkPage';
import { appRoute, resolveRoute, toAppPath } from '../lib/paths';

function currentRouterUrl(): string {
  return appRoute() + window.location.search;
}

function renderPage(path: string) {
  if (path === '/' || path.startsWith('/hunts')) return <HuntsPage />;
  if (path.startsWith('/bestiary')) return <BestiaryPage />;
  if (path.startsWith('/items')) return <ItemsPage />;
  if (path.startsWith('/quests')) return <QuestsPage />;
  if (path.startsWith('/exp-share')) return <ExpSharePage />;
  if (path.startsWith('/rmt-kk')) return <RmtKkPage />;
  if (path.startsWith('/coins')) return <CoinsPage />;
  return <HuntsPage />;
}

export function App() {
  const [url, setUrl] = useState(currentRouterUrl);

  const navigate = useCallback((route: string) => {
    const appPath = toAppPath(route);
    window.history.pushState(null, '', resolveRoute(appPath));
    setUrl(appPath);
  }, []);

  useEffect(() => {
    const onPopState = () => setUrl(currentRouterUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const path = appRoute(url.split('?')[0]);

  return (
    <RouterContext.Provider value={{ url, navigate }}>
      <Layout url={url}>
        <div key={path}>{renderPage(path)}</div>
      </Layout>
      <DetailDrawer />
    </RouterContext.Provider>
  );
}
