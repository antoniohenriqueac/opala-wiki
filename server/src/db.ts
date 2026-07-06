import pg from 'pg';
import { config } from './env.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  coin_amount INTEGER NOT NULL UNIQUE,
  official_price_brl NUMERIC(10,2) NOT NULL,
  sell_price_brl NUMERIC(10,2) NOT NULL,
  buy_price_brl NUMERIC(10,2) NOT NULL,
  sort_order INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (buy_price_brl < sell_price_brl),
  CHECK (sell_price_brl < official_price_brl)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  status TEXT NOT NULL,
  character_name TEXT NOT NULL,
  world TEXT,
  package_id INTEGER NOT NULL REFERENCES packages(id),
  coin_amount INTEGER NOT NULL,
  brl_amount NUMERIC(10,2) NOT NULL,
  official_price_brl NUMERIC(10,2),
  pix_key TEXT,
  contact TEXT NOT NULL,
  mp_payment_id TEXT,
  mp_qr_code TEXT,
  mp_qr_base64 TEXT,
  access_token UUID NOT NULL UNIQUE,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(access_token);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
`;

export async function initDb(): Promise<void> {
  await pool.query(SCHEMA);
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ('stock_coins', $1)
     ON CONFLICT (key) DO NOTHING`,
    [String(config.defaultStockCoins)],
  );
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T>(text: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
