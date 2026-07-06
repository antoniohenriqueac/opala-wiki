import { useCallback, useEffect, useState } from 'preact/hooks';
import { PixQrCode } from '../../components/coins/PixQrCode';
import { useRouter } from '../../context/RouterContext';
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
import {
  getSavedOrders,
  rememberOrder,
  replaceSavedOrders,
  updateSavedOrder,
  type SavedCoinOrder,
} from '../../lib/coins-order-storage';

type Tab = 'buy' | 'sell' | 'track' | 'history';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Aguardando PIX',
  paid: 'Pago — entrega em andamento',
  awaiting_transfer: 'Aguardando transferência in-game',
  processing: 'Processando PIX de saída',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

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
    if (mode === 'buy' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())) {
      setError('Para comprar, informe um e-mail válido (exigido pelo Mercado Pago).');
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
        <span>{mode === 'buy' ? 'E-mail *' : 'WhatsApp ou e-mail *'}</span>
        <input
          type={mode === 'buy' ? 'email' : 'text'}
          value={contact}
          onInput={(e) => setContact(e.currentTarget.value)}
          required
        />
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

function TrackingTokenBox({ token, highlight }: { token: string; highlight?: boolean }) {
  const [copied, setCopied] = useState<'token' | 'link' | null>(null);

  const doCopy = async (kind: 'token' | 'link') => {
    const text = kind === 'token' ? token : orderTrackUrl(token);
    if (await copyText(text)) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  return (
    <div class={`coins-tracking${highlight ? ' coins-tracking-new' : ''}`}>
      <p class="coins-tracking-title">Código de rastreamento</p>
      <p class="coins-tracking-hint">
        Guarde este código — é a única forma de acompanhar seu pedido depois. Também salvamos no seu
        navegador.
      </p>
      <div class="coins-tracking-token">
        <code>{token}</code>
        <button type="button" class="coins-confirm secondary" onClick={() => doCopy('token')}>
          {copied === 'token' ? 'Copiado!' : 'Copiar código'}
        </button>
      </div>
      <button type="button" class="coins-link-btn" onClick={() => doCopy('link')}>
        {copied === 'link' ? 'Link copiado!' : 'Copiar link de acompanhamento'}
      </button>
    </div>
  );
}

function OrderDetail({
  order,
  onRefresh,
  showTrackingHighlight,
}: {
  order: CoinOrder;
  onRefresh?: () => void;
  showTrackingHighlight?: boolean;
}) {
  const [mocking, setMocking] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const tryMockPay = async () => {
    setMocking(true);
    try {
      await mockPayOrder(order.id);
      onRefresh?.();
    } catch {
      /* mock only when enabled */
    } finally {
      setMocking(false);
    }
  };

  const copyPix = async () => {
    if (!order.mpQrCode) return;
    if (await copyText(order.mpQrCode)) {
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    }
  };

  return (
    <div class="coins-result">
      <p>
        Status:{' '}
        <span class={`coins-status coins-status-${order.status}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </p>
      <p>
        {order.type === 'buy' ? 'Compra' : 'Venda'} · {order.coinAmount.toLocaleString('pt-BR')} coins ·{' '}
        {fmtBrl(order.brlAmount)} · Char: <strong>{order.characterName}</strong>
      </p>

      <TrackingTokenBox token={order.accessToken} highlight={showTrackingHighlight} />

      {order.type === 'buy' && order.status === 'pending_payment' && order.mpQrCode && (
        <div class="coins-pix">
          <p class="coins-pix-lead">Pague via PIX para confirmar o pedido:</p>
          {order.mpQrBase64 ? (
            <img
              class="coins-pix-qr"
              src={`data:image/png;base64,${order.mpQrBase64}`}
              alt="QR Code PIX"
              width={200}
              height={200}
            />
          ) : (
            <PixQrCode value={order.mpQrCode} size={200} />
          )}
          <p class="coins-pix-sub">Ou copie o código PIX abaixo:</p>
          <textarea class="coins-pix-code" readOnly rows={4} value={order.mpQrCode} />
          <button type="button" class="coins-confirm secondary" onClick={copyPix}>
            {pixCopied ? 'PIX copiado!' : 'Copiar código PIX'}
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
    </div>
  );
}

function SavedOrdersList({
  orders,
  activeToken,
  onSelect,
  emptyMessage,
}: {
  orders: SavedCoinOrder[];
  activeToken: string;
  onSelect: (token: string) => void;
  emptyMessage?: string;
}) {
  if (!orders.length) {
    return emptyMessage ? <p class="coins-history-empty">{emptyMessage}</p> : null;
  }

  return (
    <ul class="coins-saved-list">
      {orders.map((o) => (
        <li key={o.accessToken}>
          <button
            type="button"
            class={`coins-saved-item${o.accessToken === activeToken ? ' active' : ''}`}
            onClick={() => onSelect(o.accessToken)}
          >
            <span class="coins-saved-main">
              <span class="coins-saved-type">{o.type === 'buy' ? 'Compra' : 'Venda'}</span>
              <span class="coins-saved-meta">
                {o.coinAmount.toLocaleString('pt-BR')} coins · {o.characterName}
                {o.createdAt && (
                  <span class="coins-saved-date">
                    {' '}
                    ·{' '}
                    {new Date(o.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </span>
            </span>
            <span class={`coins-saved-status coins-status coins-status-${o.status}`}>
              {STATUS_LABEL[o.status] ?? o.status}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

async function refreshSavedStatuses(orders: SavedCoinOrder[]): Promise<SavedCoinOrder[]> {
  if (!orders.length) return orders;

  const updated = await Promise.all(
    orders.map(async (o) => {
      try {
        const live = await fetchOrder(o.accessToken);
        return { ...o, status: live.status };
      } catch {
        return o;
      }
    }),
  );

  replaceSavedOrders(updated);
  return updated;
}

function TrackPanel({ initialToken }: { initialToken: string }) {
  const { navigate } = useRouter();
  const [token, setToken] = useState(initialToken || '');
  const [activeToken, setActiveToken] = useState(initialToken || '');
  const [order, setOrder] = useState<CoinOrder | null>(null);
  const [error, setError] = useState('');
  const [highlightTracking, setHighlightTracking] = useState(Boolean(initialToken));

  const load = useCallback(async (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    setError('');
    try {
      const o = await fetchOrder(trimmed);
      setOrder(o);
      rememberOrder(o);
    } catch {
      setOrder(null);
      setError('Pedido não encontrado.');
    }
  }, []);

  const search = (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    setHighlightTracking(false);
    setActiveToken(trimmed);
    navigate(`/coins?pedido=${encodeURIComponent(trimmed)}`);
    void load(trimmed);
  };

  useEffect(() => {
    if (!activeToken.trim()) return;
    void load(activeToken);
    const id = setInterval(() => load(activeToken), 10_000);
    return () => clearInterval(id);
  }, [activeToken, load]);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setActiveToken(initialToken);
      setHighlightTracking(true);
    }
  }, [initialToken]);

  return (
    <div class="coins-track">
      <p class="coins-subtitle">Cole o código de rastreamento do seu pedido.</p>
      <div class="coins-field row">
        <input
          placeholder="Código de rastreamento"
          value={token}
          onInput={(e) => setToken(e.currentTarget.value)}
        />
        <button type="button" class="coins-confirm secondary" onClick={() => search(token)}>
          Buscar
        </button>
      </div>
      {error && <p class="coins-error">{error}</p>}
      {order && (
        <OrderDetail
          order={order}
          onRefresh={() => load(activeToken)}
          showTrackingHighlight={highlightTracking}
        />
      )}
    </div>
  );
}

function OrderModal({
  order,
  loading,
  onClose,
  onRefresh,
}: {
  order: CoinOrder | null;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div class="drawer-backdrop" onClick={onClose} />
      <div class="drawer coins-order-modal" role="dialog" aria-modal="true" aria-label="Detalhes do pedido">
        <button type="button" class="drawer-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        {loading && !order ? (
          <p class="muted">Carregando pedido…</p>
        ) : order ? (
          <OrderDetail order={order} onRefresh={onRefresh} />
        ) : (
          <p class="coins-error">Pedido não encontrado.</p>
        )}
      </div>
    </>
  );
}

function HistoryPanel({ initialToken }: { initialToken: string }) {
  const { navigate } = useRouter();
  const [saved, setSaved] = useState<SavedCoinOrder[]>(() => getSavedOrders());
  const [modalToken, setModalToken] = useState<string | null>(initialToken || null);
  const [order, setOrder] = useState<CoinOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOrder = useCallback(async (t: string) => {
    if (!t.trim()) {
      setOrder(null);
      return;
    }
    setLoading(true);
    try {
      const o = await fetchOrder(t.trim());
      setOrder(o);
      updateSavedOrder(o);
      setSaved(getSavedOrders());
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const openOrder = (t: string) => {
    setModalToken(t);
    navigate(`/coins?pedido=${encodeURIComponent(t)}&aba=historico`);
    void loadOrder(t);
  };

  const closeModal = () => {
    setModalToken(null);
    setOrder(null);
    navigate('/coins?aba=historico');
  };

  useEffect(() => {
    const sync = async () => {
      const current = getSavedOrders();
      setSaved(current.length ? await refreshSavedStatuses(current) : current);
    };
    void sync();
    const id = setInterval(() => void sync(), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!modalToken) return;
    void loadOrder(modalToken);
    const id = setInterval(() => loadOrder(modalToken), 10_000);
    return () => clearInterval(id);
  }, [modalToken, loadOrder]);

  useEffect(() => {
    if (initialToken) setModalToken(initialToken);
  }, [initialToken]);

  return (
    <div class="coins-history">
      <p class="coins-subtitle">Pedidos salvos neste navegador — clique para ver detalhes.</p>
      <SavedOrdersList
        orders={saved}
        activeToken={modalToken ?? ''}
        onSelect={openOrder}
        emptyMessage="Nenhum pedido salvo ainda. Compre ou venda TC para aparecer aqui."
      />
      {modalToken && (
        <OrderModal
          order={order}
          loading={loading}
          onClose={closeModal}
          onRefresh={() => loadOrder(modalToken)}
        />
      )}
    </div>
  );
}

export function CoinsPage() {
  const { navigate } = useRouter();
  const params = new URLSearchParams(window.location.search);
  const pedidoToken = params.get('pedido') ?? '';
  const aba = params.get('aba');

  const [tab, setTab] = useState<Tab>(() => {
    if (aba === 'historico') return 'history';
    if (pedidoToken) return 'track';
    return 'buy';
  });
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
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

  useEffect(() => {
    if (aba === 'historico') setTab('history');
    else if (pedidoToken) setTab('track');
  }, [pedidoToken, aba]);

  const handleOrderSuccess = (order: CoinOrder) => {
    rememberOrder(order);
    navigate(`/coins?pedido=${encodeURIComponent(order.accessToken)}`);
    setTab('track');
    setSelectedId(null);
  };

  const goTab = (next: Tab) => {
    setTab(next);
    if (next === 'buy' || next === 'sell') navigate('/coins');
    else if (next === 'history') navigate('/coins?aba=historico');
    else navigate('/coins');
  };

  if (loadError && !packages.length) {
    return (
      <div class="coins-page">
        <h1>Compre/Venda TC</h1>
        <p class="coins-error">{loadError}</p>
        <p class="muted">Configure VITE_COINS_API_URL e inicie a API em server/.</p>
      </div>
    );
  }

  return (
    <div class="coins-page">
      <h1>Compre/Venda TC</h1>
      <p class="coins-disclaimer">
        Serviço independente — não afiliado ao Stonegy. Compra e venda de coins com entrega manual
        in-game. Tempo de entrega: até 30 minutos em horário comercial.
      </p>

      <div class="coins-tabs">
        <button type="button" class={tab === 'buy' ? 'active' : ''} onClick={() => goTab('buy')}>
          Comprar
        </button>
        <button type="button" class={tab === 'sell' ? 'active' : ''} onClick={() => goTab('sell')}>
          Vender
        </button>
        <button type="button" class={tab === 'track' ? 'active' : ''} onClick={() => goTab('track')}>
          Acompanhar
        </button>
        <button type="button" class={tab === 'history' ? 'active' : ''} onClick={() => goTab('history')}>
          Histórico
        </button>
      </div>

      {tab === 'track' ? (
        <TrackPanel initialToken={pedidoToken} />
      ) : tab === 'history' ? (
        <HistoryPanel initialToken={pedidoToken} />
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
          <OrderForm mode={tab} packages={packages} selectedId={selectedId} onSuccess={handleOrderSuccess} />
        </>
      )}
    </div>
  );
}
