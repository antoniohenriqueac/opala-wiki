import { useEffect, useState } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { DetailDrawer } from '../components/DetailDrawer';
import { HuntsPage } from './routes/HuntsPage';
import { BestiaryPage } from './routes/BestiaryPage';
import { ItemsPage } from './routes/ItemsPage';
import { QuestsPage } from './routes/QuestsPage';
import { appRoute, resolveRoute, toAppPath } from '../lib/paths';
import { registerNavigate } from '../lib/router';

function currentRouterUrl(): string {
  return appRoute() + window.location.search;
}

function renderPage(path: string) {
  if (path === '/' || path.startsWith('/hunts')) return <HuntsPage />;
  if (path.startsWith('/bestiary')) return <BestiaryPage />;
  if (path.startsWith('/items')) return <ItemsPage />;
  if (path.startsWith('/quests')) return <QuestsPage />;
  return <HuntsPage />;
}

export function App() {
  const [url, setUrl] = useState(currentRouterUrl);

  useEffect(() => {
    registerNavigate((route) => {
      const appPath = toAppPath(route);
      window.history.pushState(null, '', resolveRoute(appPath));
      setUrl(appPath);
    });

    const onPopState = () => setUrl(currentRouterUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const path = appRoute(url.split('?')[0]);

  return (
    <>
      <Layout url={url}>{renderPage(path)}</Layout>
      <DetailDrawer />
    </>
  );
}
