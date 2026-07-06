import type { OrderRow, PackageRow } from './types.js';

export interface PgPackage {
  id: number;
  coin_amount: number;
  official_price_brl: string | number;
  sell_price_brl: string | number;
  buy_price_brl: string | number;
  sort_order: number;
  active: boolean;
}

export interface PgOrder {
  id: string;
  type: string;
  status: string;
  character_name: string;
  world: string | null;
  package_id: number;
  coin_amount: number;
  brl_amount: string | number;
  official_price_brl: string | number | null;
  pix_key: string | null;
  contact: string;
  mp_payment_id: string | null;
  mp_qr_code: string | null;
  mp_qr_base64: string | null;
  access_token: string;
  admin_notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}

function numOrNull(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  return typeof v === 'number' ? v : Number(v);
}

function iso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : v;
}

export function mapPackage(row: PgPackage): PackageRow {
  return {
    id: row.id,
    coin_amount: row.coin_amount,
    official_price_brl: num(row.official_price_brl),
    sell_price_brl: num(row.sell_price_brl),
    buy_price_brl: num(row.buy_price_brl),
    sort_order: row.sort_order,
    active: row.active ? 1 : 0,
  };
}

export function mapOrder(row: PgOrder): OrderRow {
  return {
    id: row.id,
    type: row.type as OrderRow['type'],
    status: row.status as OrderRow['status'],
    character_name: row.character_name,
    world: row.world,
    package_id: row.package_id,
    coin_amount: row.coin_amount,
    brl_amount: num(row.brl_amount),
    official_price_brl: numOrNull(row.official_price_brl),
    pix_key: row.pix_key,
    contact: row.contact,
    mp_payment_id: row.mp_payment_id,
    mp_qr_code: row.mp_qr_code,
    mp_qr_base64: row.mp_qr_base64,
    access_token: row.access_token,
    admin_notes: row.admin_notes,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}
