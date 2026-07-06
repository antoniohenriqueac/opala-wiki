import { randomUUID } from 'node:crypto';
import { config } from './env.js';

export interface PixPaymentResult {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string | null;
  status: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOCKED_EMAIL_TLDS = new Set(['local', 'invalid', 'test']);

function isValidPayerEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) return false;
  const tld = normalized.split('.').pop();
  if (!tld || BLOCKED_EMAIL_TLDS.has(tld)) return false;
  if (normalized.endsWith('@testuser.com')) return false;
  return true;
}

/** MP exige e-mail válido; usa contato do pedido ou MP_PAYER_FALLBACK_EMAIL. */
export function resolvePayerEmail(contact: string): string {
  const candidates = [
    contact.trim(),
    contact.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0] ?? '',
    config.mpPayerFallbackEmail,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (isValidPayerEmail(candidate)) return candidate.trim();
  }

  throw new Error(
    'Informe um e-mail válido no campo de contato para pagamento via PIX (Mercado Pago).',
  );
}

/** MP só aceita notification_url pública HTTPS (localhost é rejeitado). */
function publicWebhookUrl(): string | undefined {
  try {
    const base = config.publicApiUrl.replace(/\/$/, '');
    const url = new URL(`${base}/api/webhook/mercadopago`);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return undefined;
    if (url.protocol !== 'https:') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export async function createPixPayment(
  orderId: string,
  amountBrl: number,
  description: string,
  contact: string,
): Promise<PixPaymentResult> {
  if (config.mpMock) {
    const mockCode = `00020126580014BR.GOV.BCB.PIX0136${randomUUID()}520400005303986540${amountBrl.toFixed(2)}5802BR5925OPALA WIKI COINS6009SAO PAULO62070503***6304MOCK`;
    return {
      paymentId: `mock_${orderId}`,
      qrCode: mockCode,
      qrCodeBase64: null,
      status: 'pending',
    };
  }

  const notificationUrl = publicWebhookUrl();

  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.mpAccessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': orderId,
    },
    body: JSON.stringify({
      transaction_amount: amountBrl,
      description,
      payment_method_id: 'pix',
      payer: { email: resolvePayerEmail(contact) },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      external_reference: orderId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    try {
      const parsed = JSON.parse(err) as { cause?: { code?: number }[]; message?: string };
      const liveCredError = parsed.cause?.some((c) => c.code === 7);
      if (liveCredError) {
        throw new Error(
          'Mercado Pago: PIX não funciona com credenciais de teste. Use credenciais de produção (conta real + chave PIX) ou MP_MOCK=true para testar localmente.',
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Mercado Pago: PIX')) throw e;
    }
    throw new Error(`Mercado Pago error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    id: number;
    status: string;
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
      };
    };
  };

  const tx = data.point_of_interaction?.transaction_data;
  return {
    paymentId: String(data.id),
    qrCode: tx?.qr_code ?? '',
    qrCodeBase64: tx?.qr_code_base64 ?? null,
    status: data.status,
  };
}

export async function fetchPaymentStatus(paymentId: string): Promise<string | null> {
  if (config.mpMock) {
    return paymentId.startsWith('mock_') ? 'pending' : null;
  }

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${config.mpAccessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { status: string };
  return data.status;
}

export function isPaymentApproved(status: string): boolean {
  return status === 'approved';
}
