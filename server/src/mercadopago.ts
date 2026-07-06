import { randomUUID } from 'node:crypto';
import { config } from './env.js';

export interface PixPaymentResult {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string | null;
  status: string;
}

export async function createPixPayment(
  orderId: string,
  amountBrl: number,
  description: string,
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
      payer: { email: 'buyer@opala-wiki.local' },
      notification_url: `${config.publicApiUrl}/api/webhook/mercadopago`,
      external_reference: orderId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
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
