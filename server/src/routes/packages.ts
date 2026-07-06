import { Hono } from 'hono';
import { getPackagesWithStock } from '../pricing.js';

export const packagesRoutes = new Hono();

packagesRoutes.get('/', async (c) => {
  const { packages, stock } = await getPackagesWithStock();
  return c.json({ packages, stock });
});
