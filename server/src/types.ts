export type OrderType = 'buy' | 'sell';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'awaiting_transfer'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'expired';

export interface PackageRow {
  id: number;
  coin_amount: number;
  official_price_brl: number;
  sell_price_brl: number;
  buy_price_brl: number;
  sort_order: number;
  active: number;
}

export interface OrderRow {
  id: string;
  type: OrderType;
  status: OrderStatus;
  character_name: string;
  world: string | null;
  package_id: number;
  coin_amount: number;
  brl_amount: number;
  official_price_brl: number | null;
  pix_key: string | null;
  contact: string;
  mp_payment_id: string | null;
  mp_qr_code: string | null;
  mp_qr_base64: string | null;
  access_token: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackagePublic {
  id: number;
  coinAmount: number;
  officialPriceBrl: number;
  sellPriceBrl: number;
  buyPriceBrl: number;
  savingsPct: number;
  marginBrl: number;
  inStock: boolean;
}

export interface OrderPublic {
  id: string;
  type: OrderType;
  status: OrderStatus;
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
