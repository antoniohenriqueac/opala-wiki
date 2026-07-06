import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from './env.js';
import { initDb } from './db.js';
import { seedPackages } from './seed.js';
import { packagesRoutes } from './routes/packages.js';
import { ordersRoutes } from './routes/orders.js';
import { webhookRoutes } from './routes/webhook.js';
import { adminRoutes } from './routes/admin.js';

async function main(): Promise<void> {
  await initDb();
  await seedPackages();

  const app = new Hono();

  app.use(
    '/api/*',
    cors({
      origin: (origin) => {
        if (!origin) return config.corsOrigins[0] ?? '';
        if (config.corsOrigins.includes(origin)) return origin;
        try {
          if (new URL(origin).hostname.endsWith('.onrender.com')) return origin;
        } catch {
          /* ignore */
        }
        return '';
      },
      allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.get('/health', (c) =>
    c.json({
      ok: true,
      mock: config.mpMock,
    }),
  );

  app.route('/api/packages', packagesRoutes);
  app.route('/api/orders', ordersRoutes);
  app.route('/api/webhook', webhookRoutes);
  app.route('/admin', adminRoutes);

  console.log(`Coins API on :${config.port} (MP mock: ${config.mpMock})`);
  console.log(`Admin panel: http://localhost:${config.port}/admin`);

  serve({ fetch: app.fetch, port: config.port });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
