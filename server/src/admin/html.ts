export function adminHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opala Coins — Admin</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f0d0a; color: #f5f0e8; margin: 0; padding: 1rem; }
    h1 { color: #c9a24b; }
    input, select, button, textarea { font: inherit; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #5c4520; background: #1a1612; color: inherit; }
    button { cursor: pointer; background: #8b1a1a; border-color: #8b1a1a; color: #fff; }
    button.secondary { background: #2a241c; border-color: #5c4520; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
    th, td { border: 1px solid #3b2c14; padding: 0.4rem; text-align: left; }
    th { background: #1e1914; }
    .row { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem; }
    .hidden { display: none; }
    .tag { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 4px; background: #2a241c; font-size: 0.75rem; }
    .tag.buy { color: #2563eb; }
    .tag.sell { color: #b8860b; }
    .tabs button { margin-right: 0.25rem; }
    .tabs button.active { background: #c9a24b; color: #1a1510; }
    .stock-banner { padding: 0.65rem 1rem; margin-bottom: 1rem; background: #1e1914; border: 1px solid #5c4520; border-radius: 8px; }
    .stock-banner.warn { border-color: #8b1a1a; background: #2a1212; }
    .stock-banner strong { color: #c9a24b; }
  </style>
</head>
<body>
  <h1>Opala Coins Admin</h1>
  <div id="login">
    <div class="row">
      <input type="password" id="password" placeholder="Senha admin" />
      <button onclick="doLogin()">Entrar</button>
    </div>
  </div>
  <div id="app" class="hidden">
    <div id="stock-banner" class="stock-banner"></div>
    <div class="row tabs">
      <button class="active" data-tab="orders" onclick="showTab('orders')">Pedidos</button>
      <button data-tab="stock" onclick="showTab('stock')">Estoque</button>
      <button data-tab="packages" onclick="showTab('packages')">Pacotes</button>
      <button class="secondary" onclick="logout()">Sair</button>
    </div>
    <div id="tab-stock" class="hidden">
      <h2 style="color:#c9a24b;margin:0 0 0.5rem">Controle de estoque (TC)</h2>
      <p style="color:#9a8b7a;margin:0 0 1rem;font-size:0.9rem">
        Quantas coins você tem in-game para vender. Novos pedidos de compra só passam se houver estoque disponível.
      </p>
      <div class="row">
        <label>Total em estoque (coins): <input type="number" id="stock-total" min="0" step="1" style="width:8rem" /></label>
        <button onclick="saveStock()">Salvar estoque</button>
        <button class="secondary" onclick="loadStock()">Atualizar</button>
      </div>
      <p id="stock-info" style="margin-top:0.75rem;color:#9a8b7a"></p>
    </div>
    <div id="tab-orders">
      <button onclick="loadOrders()">Atualizar</button>
      <table>
        <thead><tr><th>ID</th><th>Tipo</th><th>Status</th><th>Char</th><th>Coins</th><th>R$</th><th>Contato</th><th>Ações</th></tr></thead>
        <tbody id="orders-body"></tbody>
      </table>
    </div>
    <div id="tab-packages" class="hidden">
      <button onclick="loadPackages()">Atualizar</button>
      <table>
        <thead><tr><th>Coins</th><th>Oficial</th><th>Venda</th><th>Compra</th><th>Margem</th><th>Salvar</th></tr></thead>
        <tbody id="packages-body"></tbody>
      </table>
    </div>
  </div>
  <script>
    let token = localStorage.getItem('adminToken') || '';
    const api = (path, opts = {}) => fetch('/admin' + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opts.headers||{}) },
    });

    async function doLogin() {
      const password = document.getElementById('password').value;
      const res = await fetch('/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Erro');
      token = data.token;
      localStorage.setItem('adminToken', token);
      showApp();
    }

    function logout() { token = ''; localStorage.removeItem('adminToken'); location.reload(); }

    function showApp() {
      document.getElementById('login').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      loadStock();
      loadOrders();
    }

    async function refreshStockBanner() {
      const res = await api('/stock');
      const { stock } = await res.json();
      const el = document.getElementById('stock-banner');
      const low = stock.available <= 0;
      el.className = 'stock-banner' + (low ? ' warn' : '');
      el.innerHTML = low
        ? '<strong>Sem estoque!</strong> Disponível: ' + stock.available.toLocaleString('pt-BR') +
          ' coins · Total: ' + stock.total.toLocaleString('pt-BR') +
          ' · <a href="#" style="color:#c9a24b" onclick="showTab(\\'stock\\');return false">Configurar estoque →</a>'
        : 'Estoque: <strong>' + stock.available.toLocaleString('pt-BR') + '</strong> disponíveis · ' +
          stock.total.toLocaleString('pt-BR') + ' total · ' +
          stock.reserved.toLocaleString('pt-BR') + ' reservadas · ' +
          '<a href="#" style="color:#c9a24b" onclick="showTab(\\'stock\\');return false">Editar</a>';
    }

    function showTab(name) {
      document.querySelectorAll('.tabs button[data-tab]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-tab') === name);
      });
      ['orders','stock','packages'].forEach((t) => {
        document.getElementById('tab-' + t).classList.toggle('hidden', t !== name);
      });
      if (name === 'packages') loadPackages();
      if (name === 'stock') loadStock();
    }

    async function loadStock() {
      const res = await api('/stock');
      const { stock } = await res.json();
      document.getElementById('stock-total').value = stock.total;
      document.getElementById('stock-info').textContent =
        'Reservado (pedidos abertos): ' + stock.reserved.toLocaleString('pt-BR') +
        ' · Disponível para venda: ' + stock.available.toLocaleString('pt-BR') + ' coins';
      refreshStockBanner();
    }

    async function saveStock() {
      const total = +document.getElementById('stock-total').value;
      const res = await api('/stock', { method: 'PATCH', body: JSON.stringify({ total }) });
      const data = await res.json();
      if (!res.ok) return alert(data.error);
      loadStock();
    }

    async function loadOrders() {
      const res = await api('/orders');
      const { orders } = await res.json();
      const tbody = document.getElementById('orders-body');
      tbody.innerHTML = orders.map(o => \`
        <tr>
          <td>\${o.id.slice(0,8)}</td>
          <td><span class="tag \${o.type}">\${o.type}</span></td>
          <td>\${o.status}</td>
          <td>\${o.character_name}</td>
          <td>\${o.coin_amount}</td>
          <td>\${o.brl_amount.toFixed(2)}</td>
          <td>\${o.contact}\${o.pix_key ? '<br>PIX: '+o.pix_key : ''}</td>
          <td>
            \${o.type==='buy' && o.status==='paid' ? '<button onclick="setStatus(\\''+o.id+'\\',\\'completed\\')">Entregue</button>' : ''}
            \${o.type==='sell' && o.status==='awaiting_transfer' ? '<button onclick="setStatus(\\''+o.id+'\\',\\'processing\\')">Coins recebidos</button>' : ''}
            \${o.type==='sell' && o.status==='processing' ? '<button onclick="setStatus(\\''+o.id+'\\',\\'completed\\')">PIX enviado</button>' : ''}
            \${o.status!=='cancelled' && o.status!=='completed' ? '<button class="secondary" onclick="setStatus(\\''+o.id+'\\',\\'cancelled\\')">Cancelar</button>' : ''}
          </td>
        </tr>\`).join('');
    }

    async function setStatus(id, status) {
      const res = await api('/orders/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Erro');
      if (data.order?.admin_notes) alert(data.order.admin_notes);
      loadOrders();
      loadStock();
    }

    async function loadPackages() {
      const res = await api('/packages');
      const { packages } = await res.json();
      const tbody = document.getElementById('packages-body');
      tbody.innerHTML = packages.map(p => \`
        <tr data-id="\${p.id}">
          <td>\${p.coinAmount.toLocaleString('pt-BR')}</td>
          <td><input type="number" step="0.01" class="official" value="\${p.officialPriceBrl}" /></td>
          <td><input type="number" step="0.01" class="sell" value="\${p.sellPriceBrl}" /></td>
          <td><input type="number" step="0.01" class="buy" value="\${p.buyPriceBrl}" /></td>
          <td>R$ \${p.marginBrl.toFixed(2)}</td>
          <td><button onclick="savePackage(\${p.id}, this)">Salvar</button></td>
        </tr>\`).join('');
    }

    async function savePackage(id, btn) {
      const row = btn.closest('tr');
      const body = {
        officialPriceBrl: +row.querySelector('.official').value,
        sellPriceBrl: +row.querySelector('.sell').value,
        buyPriceBrl: +row.querySelector('.buy').value,
      };
      const res = await api('/packages/' + id, { method: 'PATCH', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return alert(data.error);
      loadPackages();
    }

    if (token) { showApp(); }
  </script>
</body>
</html>`;
}
