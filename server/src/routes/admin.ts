import { Hono } from 'hono';
import { adminAuth, signAdminToken, verifyAdminPassword } from '../middleware/auth.js';
import {
  getOrderById,
  listOrders,
  updateOrderStatus,
  type OrderStatus,
} from '../orders.js';
import { getAllPackagesAdmin, updatePackage } from '../pricing.js';
import { getStockInfo, setStockTotal } from '../stock.js';
import { adminHtml } from '../admin/html.js';

export const adminRoutes = new Hono();

adminRoutes.get('/', (c) => c.html(adminHtml()));

adminRoutes.post('/login', async (c) => {
  const { password } = await c.req.json<{ password: string }>();
  if (!verifyAdminPassword(password)) {
    return c.json({ error: 'Senha incorreta' }, 401);
  }
  const token = await signAdminToken();
  return c.json({ token });
});

adminRoutes.get('/orders', adminAuth, async (c) => {
  const orders = await listOrders(200);
  return c.json({ orders });
});

adminRoutes.patch('/orders/:id', adminAuth, async (c) => {
  const { status, notes } = await c.req.json<{ status: OrderStatus; notes?: string }>();
  const valid: OrderStatus[] = [
    'pending_payment',
    'paid',
    'awaiting_transfer',
    'processing',
    'completed',
    'cancelled',
    'expired',
  ];
  if (!valid.includes(status)) return c.json({ error: 'Status inválido' }, 400);

  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID obrigatório' }, 400);
  const updated = await updateOrderStatus(id, status, notes);
  if (!updated) return c.json({ error: 'Pedido não encontrado' }, 404);
  return c.json({ order: updated });
});

adminRoutes.get('/packages', adminAuth, async (c) => {
  return c.json({ packages: await getAllPackagesAdmin() });
});

adminRoutes.patch('/packages/:id', adminAuth, async (c) => {
  const body = await c.req.json<{
    officialPriceBrl?: number;
    sellPriceBrl?: number;
    buyPriceBrl?: number;
    active?: boolean;
  }>();

  try {
    const updated = await updatePackage(Number(c.req.param('id')), {
      official_price_brl: body.officialPriceBrl,
      sell_price_brl: body.sellPriceBrl,
      buy_price_brl: body.buyPriceBrl,
      active: body.active === undefined ? undefined : body.active ? 1 : 0,
    });
    if (!updated) return c.json({ error: 'Pacote não encontrado' }, 404);
    return c.json({ package: updated });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Erro' }, 400);
  }
});

adminRoutes.get('/stock', adminAuth, async (c) => {
  return c.json({ stock: await getStockInfo() });
});

adminRoutes.patch('/stock', adminAuth, async (c) => {
  const { total } = await c.req.json<{ total: number }>();
  try {
    await setStockTotal(total);
    return c.json({ stock: await getStockInfo() });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Erro' }, 400);
  }
});

adminRoutes.get('/orders/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID obrigatório' }, 400);
  const order = await getOrderById(id);
  if (!order) return c.json({ error: 'Não encontrado' }, 404);
  return c.json({ order });
});
