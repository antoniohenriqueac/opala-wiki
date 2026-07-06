import { Hono } from 'hono';
import { getPackagesWithStock } from '../pricing.js';

export const packagesRoutes = new Hono();

packagesRoutes.get('/', (c) => {
  const { packages, stock } = getPackagesWithStock();
  return c.json({ packages, stock });
});
