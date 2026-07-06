import { config } from './env.js';
import type { OrderRow } from './types.js';

export async function notifyDiscord(order: OrderRow, event: string): Promise<void> {
  if (!config.discordWebhookUrl) return;

  const emoji = order.type === 'buy' ? '💰' : '🔄';
  const content = [
    `${emoji} **${event}**`,
    `Pedido \`${order.id.slice(0, 8)}\` · ${order.type.toUpperCase()}`,
    `Char: **${order.character_name}** · ${order.coin_amount} coins · R$ ${order.brl_amount.toFixed(2)}`,
    `Status: \`${order.status}\` · Contato: ${order.contact}`,
  ].join('\n');

  await fetch(config.discordWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch(() => {});
}
