import { useEffect, useState } from 'preact/hooks';
import Router from 'preact-router';
import { Layout } from '../components/Layout';
import { DetailDrawer } from '../components/DetailDrawer';
import { HuntsPage } from './routes/HuntsPage';
import { BestiaryPage } from './routes/BestiaryPage';
import { ItemsPage } from './routes/ItemsPage';
import { QuestsPage } from './routes/QuestsPage';
import { appRoute, resolveRoute, toAppPath } from '../lib/paths';
import { registerNavigate } from '../lib/router';

function HuntsRoute(_props: { url?: string; path?: string }) {
  return (
    <Layout url={_props.url}>
      <HuntsPage />
    </Layout>
  );
}

function BestiaryRoute(_props: { url?: string; path?: string }) {
  return (
    <Layout url={_props.url}>
      <BestiaryPage />
    </Layout>
  );
}

function ItemsRoute(_props: { url?: string; path?: string }) {
  return (
    <Layout url={_props.url}>
      <ItemsPage />
    </Layout>
  );
}

function QuestsRoute(_props: { url?: string; path?: string }) {
  return (
    <Layout url={_props.url}>
      <QuestsPage />
    </Layout>
  );
}

function currentRouterUrl(): string {
  return appRoute() + window.location.search;
}

export function App() {
  const [url, setUrl] = useState(currentRouterUrl);

  useEffect(() => {
    registerNavigate((route) => {
      const appPath = toAppPath(route);
      const browserUrl = resolveRoute(appPath);
      window.history.pushState(null, '', browserUrl);
      setUrl(appPath);
    });

    const onPopState = () => setUrl(currentRouterUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const onRouteChange = (event: { url?: string }) => {
    const next = toAppPath(event.url ?? '/');
    const browserUrl = resolveRoute(next);

    if (window.location.pathname + window.location.search !== browserUrl) {
      window.history.pushState(null, '', browserUrl);
    }

    setUrl(next);
  };

  return (
    <>
      <Router url={url} onChange={onRouteChange}>
        <HuntsRoute path="/hunts" />
        <HuntsRoute path="/" />
        <BestiaryRoute path="/bestiary" />
        <ItemsRoute path="/items" />
        <QuestsRoute path="/quests" />
      </Router>
      <DetailDrawer />
    </>
  );
}
