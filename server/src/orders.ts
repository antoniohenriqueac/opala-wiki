import { randomUUID } from 'node:crypto';
import { query, queryOne } from './db.js';
import { config } from './env.js';
import { createPixPayment, isPaymentApproved } from './mercadopago.js';
import { notifyDiscord } from './notify.js';
import { calcOrderAmount, getPackageById, savingsPct } from './pricing.js';
import { mapOrder } from './row-map.js';
import type { PgOrder } from './row-map.js';
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

export async function getOrderByToken(token: string): Promise<OrderPublic | null> {
  const row = await queryOne<PgOrder>('SELECT * FROM orders WHERE access_token = $1', [token]);
  return row ? rowToPublic(mapOrder(row)) : null;
}

export async function getOrderById(id: string): Promise<OrderRow | undefined> {
  const row = await queryOne<PgOrder>('SELECT * FROM orders WHERE id = $1', [id]);
  return row ? mapOrder(row) : undefined;
}

export async function listOrders(limit = 100): Promise<OrderRow[]> {
  const rows = await query<PgOrder>(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1',
    [limit],
  );
  return rows.map(mapOrder);
}

async function insertOrder(row: Omit<OrderRow, 'created_at' | 'updated_at'>): Promise<OrderRow> {
  const ts = now();
  await query(
    `INSERT INTO orders (
      id, type, status, character_name, world, package_id, coin_amount, brl_amount,
      official_price_brl, pix_key, contact, mp_payment_id, mp_qr_code, mp_qr_base64,
      access_token, admin_notes, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    )`,
    [
      row.id,
      row.type,
      row.status,
      row.character_name,
      row.world,
      row.package_id,
      row.coin_amount,
      row.brl_amount,
      row.official_price_brl,
      row.pix_key,
      row.contact,
      row.mp_payment_id,
      row.mp_qr_code,
      row.mp_qr_base64,
      row.access_token,
      row.admin_notes,
      ts,
      ts,
    ],
  );
  return (await getOrderById(row.id))!;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  notes?: string,
): Promise<OrderRow | undefined> {
  const existing = await getOrderById(id);
  if (!existing) return undefined;

  const prevStatus = existing.status;
  const ts = now();

  await query(
    `UPDATE orders SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = $3 WHERE id = $4`,
    [status, notes ?? null, ts, id],
  );

  if (existing.type === 'buy' && status === 'completed' && prevStatus !== 'completed') {
    const stockWarning = await onBuyOrderCompleted(existing.coin_amount);
    if (stockWarning) {
      const note = [notes, stockWarning].filter(Boolean).join(' | ');
      await query(`UPDATE orders SET admin_notes = $1, updated_at = $2 WHERE id = $3`, [
        note,
        now(),
        id,
      ]);
    }
  }
  if (existing.type === 'sell' && status === 'completed' && prevStatus !== 'completed') {
    await onSellOrderCompleted(existing.coin_amount);
  }

  const final = (await getOrderById(id))!;
  void notifyDiscord(final, `Status → ${status}`);
  return final;
}

export async function createBuyOrder(input: {
  packageId: number;
  characterName: string;
  world?: string;
  contact: string;
}): Promise<OrderPublic> {
  const pkg = await getPackageById(input.packageId);
  if (!pkg) throw new Error('Pacote inválido');

  await assertStockForBuy(pkg.coin_amount);

  const id = randomUUID();
  const accessToken = randomUUID();
  const brl = calcOrderAmount('buy', pkg);

  const pix = await createPixPayment(
    id,
    brl,
    `${pkg.coin_amount} coins — ${input.characterName}`,
    input.contact,
  );

  const row = await insertOrder({
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

export async function createSellOrder(input: {
  packageId: number;
  characterName: string;
  world?: string;
  contact: string;
  pixKey: string;
}): Promise<OrderPublic> {
  const pkg = await getPackageById(input.packageId);
  if (!pkg) throw new Error('Pacote inválido');

  const id = randomUUID();
  const accessToken = randomUUID();
  const brl = calcOrderAmount('sell', pkg);

  const row = await insertOrder({
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
  const row = await queryOne<PgOrder>('SELECT * FROM orders WHERE mp_payment_id = $1', [
    paymentId,
  ]);
  if (!row || row.type !== 'buy' || row.status !== 'pending_payment') return;

  const { fetchPaymentStatus } = await import('./mercadopago.js');
  const status = await fetchPaymentStatus(paymentId);
  if (status && isPaymentApproved(status)) {
    await updateOrderStatus(row.id, 'paid');
  }
}

/** Dev/mock: simulate PIX payment approval */
export async function mockApprovePayment(orderId: string): Promise<OrderPublic | null> {
  const row = await getOrderById(orderId);
  if (!row || row.type !== 'buy' || row.status !== 'pending_payment') return null;
  const updated = await updateOrderStatus(row.id, 'paid');
  return updated ? rowToPublic(updated) : null;
}

export type { OrderType, OrderStatus };
