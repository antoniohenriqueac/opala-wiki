export function env(key: string, fallback = ''): string {
  return process.env[key]?.trim() || fallback;
}

export const config = {
  port: Number(env('PORT', '3001')),
  dbPath: env('DATABASE_PATH', './data/coins.db'),
  mpAccessToken: env('MP_ACCESS_TOKEN'),
  mpWebhookSecret: env('MP_WEBHOOK_SECRET'),
  mpMock: env('MP_MOCK', 'true') === 'true' || !env('MP_ACCESS_TOKEN'),
  adminPassword: env('ADMIN_PASSWORD', 'admin'),
  jwtSecret: env('JWT_SECRET', 'dev-secret-change-in-production'),
  corsOrigins: env('CORS_ORIGIN', 'http://localhost:5173').split(',').map((s) => s.trim()),
  gameReceiverChar: env('GAME_RECEIVER_CHAR', 'Admin'),
  discordWebhookUrl: env('DISCORD_WEBHOOK_URL'),
  publicApiUrl: env('PUBLIC_API_URL', `http://localhost:${env('PORT', '3001')}`),
};
