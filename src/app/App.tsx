import Router from 'preact-router';
import { Layout } from '../components/Layout';
import { DetailDrawer } from '../components/DetailDrawer';
import { HuntsPage } from './routes/HuntsPage';
import { BestiaryPage } from './routes/BestiaryPage';
import { ItemsPage } from './routes/ItemsPage';
import { QuestsPage } from './routes/QuestsPage';

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

export function App() {
  return (
    <>
      <Router>
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
