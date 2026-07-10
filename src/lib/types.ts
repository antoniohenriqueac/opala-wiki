export interface SpriteAsset {
  p: number;
  x: number;
  y: number;
  w: number;
  h: number;
  frames: number;
  strip?: { sx: number; sy: number; stepX: number; dur: number };
}

export interface Item {
  id: number;
  name: string;
  image: string;
  atk?: number;
  def?: number;
  arm?: number;
  slot?: string;
  weaponType?: string;
  weight?: number;
  classification?: number;
  maxTier?: number;
  rarityBorderTier?: number;
  npcSellPrice?: number;
  levelMin?: number;
  vocation?: string[];
  stackable?: boolean;
  description?: string;
  magicLevel?: number;
  damageType?: string;
  doubleHand?: boolean;
  [key: string]: unknown;
}

export interface LootEntry {
  itemId: number;
  chance: number;
  maxCount?: number;
}

export interface Monster {
  id: number;
  name: string;
  image: string;
  hp: number;
  xp: number;
  bestiaryDifficulty?: number;
  bestiaryRace?: string;
  loot?: LootEntry[];
  goldCoins?: { min: number; max: number };
  elementalResistances?: Record<string, number>;
  arm?: number;
  mitigation?: number;
  voices?: string[];
  corpse?: number;
  [key: string]: unknown;
}

export interface Hunt {
  id: number;
  title: string;
  monsters: number[];
  mapId?: number;
  recommendedLevel?: number;
  levelMin?: number;
  levelMax?: number;
  maxLure?: number;
  minLure?: number;
  /** From lurePace.minSeconds when captured — fastest respawn at max lure */
  minRespawnSec?: number;
  /** From lurePace.maxSeconds when captured — slowest respawn at min lure */
  maxRespawnSec?: number;
  monsterWeights?: Record<string, number>;
  isPremmium?: boolean;
  tutorialOnly?: boolean;
  unlockedByDefault?: boolean;
  [key: string]: unknown;
}

export interface QuestMission {
  id: number;
  title: string;
  description?: string;
  type: string;
  deliveryItems?: { itemId: number; amount: number }[];
  rewards?: QuestReward[];
  rewardChoices?: { id?: string; label?: string; rewards?: QuestReward[] }[];
  rooms?: QuestRoom[];
  monsterTasks?: { monsterId: number; amount: number }[];
}

export interface QuestRoom {
  id: number;
  title?: string;
  mapId?: number;
  ambientLight?: unknown;
  waves?: {
    monsterIds?: number[];
    minMonsters?: number;
    maxMonsters?: number;
    waveAmount?: number;
  }[];
}

export interface QuestReward {
  id?: string;
  type: string;
  amount?: number;
  itemId?: number;
  huntId?: number;
}

export interface Quest {
  id: number;
  title: string;
  description?: string;
  levelMin?: number;
  premium?: boolean;
  repeatPolicy?: { type: string; cooldownMs?: number };
  missions?: QuestMission[];
  rewardHighlight?: { itemId: number };
  requiredQuestIds?: number[];
  unlockedByDefault?: boolean;
}

export interface WikiData {
  items: Item[];
  monsters: Monster[];
  hunts: Hunt[];
  quests: Quest[];
  mapItems?: unknown[];
  invAssets: Record<string, SpriteAsset>;
  monAssets: Record<string, SpriteAsset>;
}

export type PartySize = 1 | 2 | 4;
export type HuntSort = 'xp' | 'profit' | 'level' | 'name' | 'mobs';
export type Vocation = 'ALL' | 'KNIGHT' | 'PALADIN' | 'SORCERER' | 'DRUID';

export interface XPCalcSettings {
  dps: number;
  speed: number;
  boost: number;
  stamina: number; /** Hunt duration in hours (0–12). Scales totals only; raw xp/h is unchanged. */
  xpBoost?: boolean; /** +50% raw XP for 1h in the hunt window. */
  partySize: number;
  dmgShare: number;
  lure: number | null;
  charLevel?: number;
  /** In-game respawn seconds (from client). When set, skips automatic estimate. */
  respawnSec?: number;
  /** XP gain rate % (premium/loyalty). Affects displayed "XP real" only, not raw xp/gp. */
  gainRate?: number;
}

export interface DropSource {
  monsterId: number;
  chance: number;
  maxCount: number;
}

export type CoinOrderType = 'buy' | 'sell';

export type CoinOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'awaiting_transfer'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'expired';

export interface CoinPackage {
  id: number;
  coinAmount: number;
  officialPriceBrl: number;
  sellPriceBrl: number;
  buyPriceBrl: number;
  savingsPct: number;
  marginBrl: number;
  inStock: boolean;
}

export interface CoinStock {
  total: number;
  reserved: number;
  available: number;
}

export interface CoinOrder {
  id: string;
  type: CoinOrderType;
  status: CoinOrderStatus;
  characterName: string;
  coinAmount: number;
  brlAmount: number;
  officialPriceBrl: number | null;
  savingsPct: number | null;
  pixKey: string | null;
  contact: string;
  mpQrCode: string | null;
  mpQrBase64: string | null;
  gameReceiverChar: string | null;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
}
