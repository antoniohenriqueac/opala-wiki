import { useCallback, useEffect, useState } from 'preact/hooks';
import type { CoinOrder, CoinPackage } from '../../lib/types';
import {
  coinsApiConfigured,
  createBuyOrder,
  createSellOrder,
  fetchOrder,
  fetchShop,
  fmtBrl,
  mockPayOrder,
  orderTrackUrl,
} from '../../lib/coins-api';

type Tab = 'buy' | 'sell' | 'track';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Aguardando PIX',
  paid: 'Pago — entrega em andamento',
  awaiting_transfer: 'Aguardando transferência in-game',
  processing: 'Processando PIX de saída',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};

function PackageGrid({
  packages,
  mode,
  selectedId,
  onSelect,
}: {
  packages: CoinPackage[];
  mode: 'buy' | 'sell';
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div class="coins-grid">
      {packages.map((pkg) => {
        const price = mode === 'buy' ? pkg.sellPriceBrl : pkg.buyPriceBrl;
        const selected = selectedId === pkg.id;
        const outOfStock = mode === 'buy' && !pkg.inStock;
        return (
          <button
            type="button"
            key={pkg.id}
            class={`coins-pack${selected ? ' selected' : ''}${outOfStock ? ' out-of-stock' : ''}`}
            disabled={outOfStock}
            onClick={() => !outOfStock && onSelect(pkg.id)}
          >
            <div class="coins-pack-amount">{pkg.coinAmount.toLocaleString('pt-BR')}</div>
            <div class="coins-pack-coin">coins</div>
            {outOfStock ? (
              <div class="coins-pack-badge coins-pack-badge-warn">Esgotado</div>
            ) : mode === 'buy' ? (
              <div class="coins-pack-badge">{pkg.savingsPct}% mais barato</div>
            ) : null}
            <div class="coins-pack-price">{fmtBrl(price)}</div>
            {mode === 'buy' && !outOfStock && (
              <div class="coins-pack-official">Loja: {fmtBrl(pkg.officialPriceBrl)}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function OrderForm({
  mode,
  packages,
  selectedId,
  onSuccess,
}: {
  mode: 'buy' | 'sell';
  packages: CoinPackage[];
  selectedId: number | null;
  onSuccess: (order: CoinOrder) => void;
}) {
  const [characterName, setCharacterName] = useState('');
  const [contact, setContact] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pkg = packages.find((p) => p.id === selectedId);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (!selectedId || !characterName.trim() || !contact.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (mode === 'buy' && pkg && !pkg.inStock) {
      setError('Pacote esgotado — estoque insuficiente.');
      return;
    }
    if (mode === 'sell' && !pixKey.trim()) {
      setError('Informe sua chave PIX.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const order =
        mode === 'buy'
          ? await createBuyOrder({ packageId: selectedId, characterName, contact })
          : await createSellOrder({ packageId: selectedId, characterName, contact, pixKey });
      onSuccess(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form class="coins-form" onSubmit={submit}>
      {pkg && (
        <div class="coins-form-summary">
          Pacote: <strong>{pkg.coinAmount.toLocaleString('pt-BR')} coins</strong> —{' '}
          <strong>{fmtBrl(mode === 'buy' ? pkg.sellPriceBrl : pkg.buyPriceBrl)}</strong>
        </div>
      )}
      <label class="coins-field">
        <span>Nome do personagem *</span>
        <input value={characterName} onInput={(e) => setCharacterName(e.currentTarget.value)} required />
      </label>
      <label class="coins-field">
        <span>WhatsApp ou e-mail *</span>
        <input value={contact} onInput={(e) => setContact(e.currentTarget.value)} required />
      </label>
      {mode === 'sell' && (
        <label class="coins-field">
          <span>Chave PIX *</span>
          <input value={pixKey} onInput={(e) => setPixKey(e.currentTarget.value)} required />
        </label>
      )}
      {error && <p class="coins-error">{error}</p>}
      <button type="submit" class="coins-confirm" disabled={!selectedId || loading}>
        {loading ? 'Processando…' : 'Confirmar'}
      </button>
    </form>
  );
}

function OrderResult({ order, onRefresh }: { order: CoinOrder; onRefresh: () => void }) {
  const [mocking, setMocking] = useState(false);

  const tryMockPay = async () => {
    setMocking(true);
    try {
      await mockPayOrder(order.id);
      onRefresh();
    } catch {
      /* mock only in dev */
    } finally {
      setMocking(false);
    }
  };

  return (
    <div class="coins-result">
      <h3>Pedido criado</h3>
      <p>
        Status: <strong>{STATUS_LABEL[order.status] ?? order.status}</strong>
      </p>
      <p>
        {order.coinAmount.toLocaleString('pt-BR')} coins · {fmtBrl(order.brlAmount)} · Char:{' '}
        <strong>{order.characterName}</strong>
      </p>

      {order.type === 'buy' && order.status === 'pending_payment' && order.mpQrCode && (
        <div class="coins-pix">
          <p>Escaneie ou copie o PIX:</p>
          {order.mpQrBase64 && (
            <img
              class="coins-pix-qr"
              src={`data:image/png;base64,${order.mpQrBase64}`}
              alt="QR Code PIX"
              width={200}
              height={200}
            />
          )}
          <textarea class="coins-pix-code" readOnly rows={4} value={order.mpQrCode} />
          <button
            type="button"
            class="coins-confirm secondary"
            onClick={() => navigator.clipboard.writeText(order.mpQrCode ?? '')}
          >
            Copiar código PIX
          </button>
          {import.meta.env.DEV && (
            <button type="button" class="coins-confirm secondary" disabled={mocking} onClick={tryMockPay}>
              [Dev] Simular pagamento
            </button>
          )}
        </div>
      )}

      {order.type === 'sell' && order.status === 'awaiting_transfer' && (
        <div class="coins-instructions">
          <p>
            Transfira <strong>{order.coinAmount.toLocaleString('pt-BR')} coins</strong> in-game para o
            personagem <strong>{order.gameReceiverChar}</strong>.
          </p>
          <p>Após confirmarmos o recebimento, enviaremos {fmtBrl(order.brlAmount)} para sua chave PIX.</p>
        </div>
      )}

      <p class="coins-track-link">
        Acompanhe:{' '}
        <a href={orderTrackUrl(order.accessToken)}>{orderTrackUrl(order.accessToken)}</a>
      </p>
    </div>
  );
}

function TrackPanel({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken);
  const [order, setOrder] = useState<CoinOrder | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token.trim()) return;
    setError('');
    try {
      const o = await fetchOrder(token.trim());
      setOrder(o);
    } catch {
      setOrder(null);
      setError('Pedido não encontrado.');
    }
  }, [token]);

  useEffect(() => {
    if (!initialToken) return;
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [initialToken, load]);

  return (
    <div class="coins-track">
      <div class="coins-field row">
        <input
          placeholder="Token do pedido"
          value={token}
          onInput={(e) => setToken(e.currentTarget.value)}
        />
        <button type="button" class="coins-confirm secondary" onClick={load}>
          Buscar
        </button>
      </div>
      {error && <p class="coins-error">{error}</p>}
      {order && (
        <div class="coins-result">
          <p>
            <span class={`coins-status coins-status-${order.status}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </p>
          <p>
            {order.type === 'buy' ? 'Compra' : 'Venda'} · {order.coinAmount.toLocaleString('pt-BR')} coins ·{' '}
            {fmtBrl(order.brlAmount)}
          </p>
          <p>
            Char: <strong>{order.characterName}</strong>
          </p>
          {order.type === 'sell' && order.gameReceiverChar && order.status === 'awaiting_transfer' && (
            <p>
              Transfira coins para <strong>{order.gameReceiverChar}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CoinsPage() {
  const params = new URLSearchParams(window.location.search);
  const pedidoToken = params.get('pedido') ?? '';

  const [tab, setTab] = useState<Tab>(pedidoToken ? 'track' : 'buy');
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [order, setOrder] = useState<CoinOrder | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!coinsApiConfigured()) {
      setLoadError('Loja indisponível: API não configurada.');
      return;
    }
    fetchShop()
      .then(({ packages: pkgs }) => setPackages(pkgs))
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Erro ao carregar pacotes'));
  }, []);

  const refreshOrder = useCallback(async () => {
    if (!order) return;
    const o = await fetchOrder(order.accessToken);
    setOrder(o);
  }, [order]);

  if (loadError && !packages.length) {
    return (
      <div class="coins-page">
        <h1>Loja de Coins</h1>
        <p class="coins-error">{loadError}</p>
        <p class="muted">Configure VITE_COINS_API_URL e inicie a API em server/.</p>
      </div>
    );
  }

  return (
    <div class="coins-page">
      <h1>Loja de Coins</h1>
      <p class="coins-disclaimer">
        Serviço independente — não afiliado ao Stonegy. Compra e venda de coins com entrega manual
        in-game. Tempo de entrega: até 30 minutos em horário comercial.
      </p>

      <div class="coins-tabs">
        <button
          type="button"
          class={tab === 'buy' ? 'active' : ''}
          onClick={() => {
            setTab('buy');
            setOrder(null);
          }}
        >
          Comprar
        </button>
        <button
          type="button"
          class={tab === 'sell' ? 'active' : ''}
          onClick={() => {
            setTab('sell');
            setOrder(null);
          }}
        >
          Vender
        </button>
        <button
          type="button"
          class={tab === 'track' ? 'active' : ''}
          onClick={() => setTab('track')}
        >
          Acompanhar pedido
        </button>
      </div>

      {tab === 'track' ? (
        <TrackPanel initialToken={pedidoToken} />
      ) : order ? (
        <OrderResult order={order} onRefresh={refreshOrder} />
      ) : (
        <>
          <p class="coins-subtitle">
            {tab === 'buy' ? 'Selecione um pacote — mais barato que a loja oficial' : 'Venda suas coins'}
          </p>
          <PackageGrid
            packages={packages}
            mode={tab}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <OrderForm
            mode={tab}
            packages={packages}
            selectedId={selectedId}
            onSuccess={setOrder}
          />
        </>
      )}
    </div>
  );
}
