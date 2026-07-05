export const STONEGY_ORIGIN = 'https://stonegy-online.com';
export const STONEGY_CDN = 'https://assets.stonegy-online.com';

export const STATIC_DATASETS = ['items', 'monsters', 'mapItems', 'weaponMasteryCatalog'] as const;

export const CDN_PATHS = {
  staticVersion: `${STONEGY_CDN}/game-data/static/version.json`,
  staticManifest: (version: string) =>
    `${STONEGY_CDN}/game-data/static/manifest.${version}.json`,
  staticFile: (path: string) => `${STONEGY_CDN}${path.startsWith('/') ? path : `/${path}`}`,
  inventorySprite: (name: string) => `${STONEGY_ORIGIN}/assets/inventory/${name}`,
  monsterSprite: (name: string) => `${STONEGY_ORIGIN}/assets/monsters/${name}`,
} as const;

export const CLIENT_MARKERS = {
  hunts: 'new Map([[1,{id:1,title:"Sewers"',
  quests: 'new Map([[1,{id:1,title:"Esconderijo',
} as const;
