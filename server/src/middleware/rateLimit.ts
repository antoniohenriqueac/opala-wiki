import { config } from '../env.js';

const hits = new Map<string, { count: number; resetAt: number }>();

const MAX = 3;
const WINDOW_MS = 60 * 60 * 1000;

const isLocalApi =
  config.publicApiUrl.includes('localhost') || config.publicApiUrl.includes('127.0.0.1');

export function rateLimit(ip: string): boolean {
  if (isLocalApi) return true;

  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX) return false;
  entry.count++;
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
