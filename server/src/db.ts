import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './env.js';

let db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coin_amount INTEGER NOT NULL UNIQUE,
  official_price_brl REAL NOT NULL,
  sell_price_brl REAL NOT NULL,
  buy_price_brl REAL NOT NULL,
  sort_order INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  CHECK (buy_price_brl < sell_price_brl),
  CHECK (sell_price_brl < official_price_brl)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  status TEXT NOT NULL,
  character_name TEXT NOT NULL,
  world TEXT,
  package_id INTEGER NOT NULL REFERENCES packages(id),
  coin_amount INTEGER NOT NULL,
  brl_amount REAL NOT NULL,
  official_price_brl REAL,
  pix_key TEXT,
  contact TEXT NOT NULL,
  mp_payment_id TEXT,
  mp_qr_code TEXT,
  mp_qr_base64 TEXT,
  access_token TEXT NOT NULL UNIQUE,
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(access_token);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
`;

export function getDb(): Database.Database {
  if (db) return db;
  mkdirSync(dirname(config.dbPath), { recursive: true });
  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

export function closeDb(): void {
  db?.close();
  db = null;
}
