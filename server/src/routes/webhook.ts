import { Hono } from 'hono';
import { handlePaymentWebhook } from '../orders.js';

export const webhookRoutes = new Hono();

webhookRoutes.post('/mercadopago', async (c) => {
  type MpBody = { type?: string; data?: { id?: string } };
  const body = (await c.req.json<MpBody>().catch(() => ({}))) as MpBody;

  if (body.type === 'payment' && body.data?.id) {
    await handlePaymentWebhook(String(body.data.id));
  }

  // MP also sends ?topic=payment&id=123 via query
  const topic = c.req.query('topic');
  const id = c.req.query('id');
  if (topic === 'payment' && id) {
    await handlePaymentWebhook(id);
  }

  return c.json({ ok: true });
});
