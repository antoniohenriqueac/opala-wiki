import { useEffect, useState } from 'preact/hooks';
import QRCode from 'qrcode';

interface PixQrCodeProps {
  value: string;
  size?: number;
}

/** Gera QR a partir do copia-e-cola PIX (MP mock não envia base64). */
export function PixQrCode({ value, size = 200 }: PixQrCodeProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setSrc(null);

    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) return null;

  if (!src) {
    return <div class="coins-pix-qr coins-pix-qr-loading">Gerando QR…</div>;
  }

  return (
    <img class="coins-pix-qr" src={src} alt="QR Code PIX" width={size} height={size} />
  );
}
