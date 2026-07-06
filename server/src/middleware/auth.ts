import { SignJWT, jwtVerify } from 'jose';
import type { Context, Next } from 'hono';
import { config } from '../env.js';

const secret = new TextEncoder().encode(config.jwtSecret);

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret);
}

export async function adminAuth(c: Context, next: Next): Promise<Response | void> {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : c.req.query('token');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  try {
    await jwtVerify(token, secret);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

export function verifyAdminPassword(password: string): boolean {
  return password === config.adminPassword;
}
