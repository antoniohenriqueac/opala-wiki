import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';
import { config } from './env.js';
import { createPixPayment, isPaymentApproved } from './mercadopago.js';
import { notifyDiscord } from './notify.js';
import { calcOrderAmount, getPackageById, savingsPct } from './pricing.js';
import { assertStockForBuy, onBuyOrderCompleted, onSellOrderCompleted } from './stock.js';
import type { OrderPublic, OrderRow, OrderStatus, OrderType } from './types.js';

function now(): string {
  return new Date().toISOString();
}

function rowToPublic(row: OrderRow): OrderPublic {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    characterName: row.character_name,
    coinAmount: row.coin_amount,
    brlAmount: row.brl_amount,
    officialPriceBrl: row.official_price_brl,
    savingsPct:
      row.official_price_brl != null && row.type === 'buy'
        ? savingsPct(row.official_price_brl, row.brl_amount)
        : null,
    pixKey: row.pix_key,
    contact: row.contact,
    mpQrCode: row.mp_qr_code,
    mpQrBase64: row.mp_qr_base64,
    gameReceiverChar: row.type === 'sell' ? config.gameReceiverChar : null,
    accessToken: row.access_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getOrderByToken(token: string): OrderPublic | null {
  const row = getDb().prepare('SELECT * FROM orders WHERE access_token = ?').get(token) as
    | OrderRow
    | undefined;
  return row ? rowToPublic(row) : null;
}

export function getOrderById(id: string): OrderRow | undefined {
  return getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
}

export function listOrders(limit = 100): OrderRow[] {
  return getDb()
    .prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?')
    .all(limit) as OrderRow[];
}

function insertOrder(row: Omit<OrderRow, 'created_at' | 'updated_at'>): OrderRow {
  const ts = now();
  getDb()
    .prepare(
      `INSERT INTO orders (
        id, type, status, character_name, world, package_id, coin_amount, brl_amount,
        official_price_brl, pix_key, contact, mp_payment_id, mp_qr_code, mp_qr_base64,
        access_token, admin_notes, created_at, updated_at
      ) VALUES (
        @id, @type, @status, @character_name, @world, @package_id, @coin_amount, @brl_amount,
        @official_price_brl, @pix_key, @contact, @mp_payment_id, @mp_qr_code, @mp_qr_base64,
        @access_token, @admin_notes, @created_at, @updated_at
      )`,
    )
    .run({ ...row, created_at: ts, updated_at: ts });
  return getOrderById(row.id)!;
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  notes?: string,
): OrderRow | undefined {
  const existing = getOrderById(id);
  if (!existing) return undefined;

  const prevStatus = existing.status;

  getDb()
    .prepare(
      `UPDATE orders SET status = @status, admin_notes = COALESCE(@notes, admin_notes), updated_at = @updated_at WHERE id = @id`,
    )
    .run({ id, status, notes: notes ?? null, updated_at: now() });

  if (existing.type === 'buy' && status === 'completed' && prevStatus !== 'completed') {
    const stockWarning = onBuyOrderCompleted(existing.coin_amount);
    if (stockWarning) {
      const note = [notes, stockWarning].filter(Boolean).join(' | ');
      getDb()
        .prepare(`UPDATE orders SET admin_notes = @notes, updated_at = @updated_at WHERE id = @id`)
        .run({ id, notes: note, updated_at: now() });
    }
  }
  if (existing.type === 'sell' && status === 'completed' && prevStatus !== 'completed') {
    onSellOrderCompleted(existing.coin_amount);
  }

  const final = getOrderById(id)!;
  void notifyDiscord(final, `Status → ${status}`);
  return final;
}

export async function createBuyOrder(input: {
  packageId: number;
  characterName: string;
  world?: string;
  contact: string;
}): Promise<OrderPublic> {
  const pkg = getPackageById(input.packageId);
  if (!pkg) throw new Error('Pacote inválido');

  assertStockForBuy(pkg.coin_amount);

  const id = randomUUID();
  const accessToken = randomUUID();
  const brl = calcOrderAmount('buy', pkg);

  const pix = await createPixPayment(
    id,
    brl,
    `${pkg.coin_amount} coins — ${input.characterName}`,
  );

  const row = insertOrder({
    id,
    type: 'buy',
    status: 'pending_payment',
    character_name: input.characterName.trim(),
    world: input.world?.trim() || null,
    package_id: pkg.id,
    coin_amount: pkg.coin_amount,
    brl_amount: brl,
    official_price_brl: pkg.official_price_brl,
    pix_key: null,
    contact: input.contact.trim(),
    mp_payment_id: pix.paymentId,
    mp_qr_code: pix.qrCode,
    mp_qr_base64: pix.qrCodeBase64,
    access_token: accessToken,
    admin_notes: null,
  });

  void notifyDiscord(row, 'Novo pedido COMPRA');
  return rowToPublic(row);
}

export function createSellOrder(input: {
  packageId: number;
  characterName: string;
  world?: string;
  contact: string;
  pixKey: string;
}): OrderPublic {
  const pkg = getPackageById(input.packageId);
  if (!pkg) throw new Error('Pacote inválido');

  const id = randomUUID();
  const accessToken = randomUUID();
  const brl = calcOrderAmount('sell', pkg);

  const row = insertOrder({
    id,
    type: 'sell',
    status: 'awaiting_transfer',
    character_name: input.characterName.trim(),
    world: input.world?.trim() || null,
    package_id: pkg.id,
    coin_amount: pkg.coin_amount,
    brl_amount: brl,
    official_price_brl: pkg.official_price_brl,
    pix_key: input.pixKey.trim(),
    contact: input.contact.trim(),
    mp_payment_id: null,
    mp_qr_code: null,
    mp_qr_base64: null,
    access_token: accessToken,
    admin_notes: null,
  });

  void notifyDiscord(row, 'Novo pedido VENDA');
  return rowToPublic(row);
}

export async function handlePaymentWebhook(paymentId: string): Promise<void> {
  const row = getDb()
    .prepare('SELECT * FROM orders WHERE mp_payment_id = ?')
    .get(paymentId) as OrderRow | undefined;
  if (!row || row.type !== 'buy' || row.status !== 'pending_payment') return;

  const { fetchPaymentStatus } = await import('./mercadopago.js');
  const status = await fetchPaymentStatus(paymentId);
  if (status && isPaymentApproved(status)) {
    updateOrderStatus(row.id, 'paid');
  }
}

/** Dev/mock: simulate PIX payment approval */
export function mockApprovePayment(orderId: string): OrderPublic | null {
  const row = getOrderById(orderId);
  if (!row || row.type !== 'buy' || row.status !== 'pending_payment') return null;
  const updated = updateOrderStatus(row.id, 'paid');
  return updated ? rowToPublic(updated) : null;
}

export type { OrderType, OrderStatus };
