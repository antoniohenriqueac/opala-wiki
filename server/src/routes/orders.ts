import { Hono } from 'hono';
import { config } from '../env.js';
import { clientIp, rateLimit } from '../middleware/rateLimit.js';
import {
  createBuyOrder,
  createSellOrder,
  getOrderByToken,
  mockApprovePayment,
} from '../orders.js';

export const ordersRoutes = new Hono();

ordersRoutes.get('/:token', async (c) => {
  const order = await getOrderByToken(c.req.param('token'));
  if (!order) return c.json({ error: 'Pedido não encontrado' }, 404);
  return c.json({ order });
});

ordersRoutes.post('/buy', async (c) => {
  if (!rateLimit(clientIp(c.req.raw))) {
    return c.json({ error: 'Limite de pedidos atingido. Tente em 1 hora.' }, 429);
  }

  const body = await c.req.json<{
    packageId: number;
    characterName: string;
    world?: string;
    contact: string;
  }>();

  if (!body.packageId || !body.characterName?.trim() || !body.contact?.trim()) {
    return c.json({ error: 'packageId, characterName e contact são obrigatórios' }, 400);
  }

  try {
    const order = await createBuyOrder(body);
    return c.json({ order }, 201);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Erro ao criar pedido' }, 400);
  }
});

ordersRoutes.post('/sell', async (c) => {
  if (!rateLimit(clientIp(c.req.raw))) {
    return c.json({ error: 'Limite de pedidos atingido. Tente em 1 hora.' }, 429);
  }

  const body = await c.req.json<{
    packageId: number;
    characterName: string;
    world?: string;
    contact: string;
    pixKey: string;
  }>();

  if (!body.packageId || !body.characterName?.trim() || !body.contact?.trim() || !body.pixKey?.trim()) {
    return c.json({ error: 'packageId, characterName, contact e pixKey são obrigatórios' }, 400);
  }

  try {
    const order = await createSellOrder(body);
    return c.json({ order }, 201);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Erro ao criar pedido' }, 400);
  }
});

/** Dev only: simulate PIX payment in mock mode */
ordersRoutes.post('/:id/mock-pay', async (c) => {
  if (!config.mpMock) return c.json({ error: 'Mock disabled' }, 403);
  const order = await mockApprovePayment(c.req.param('id'));
  if (!order) return c.json({ error: 'Pedido inválido' }, 400);
  return c.json({ order });
});
