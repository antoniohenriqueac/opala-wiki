# Coins API — Opala Wiki

Backend para loja de coins (intermediador) com PIX via Mercado Pago.

## Setup

```bash
cd server
cp .env.example .env
# Edite .env com MP_ACCESS_TOKEN, ADMIN_PASSWORD, JWT_SECRET
npm install
npm run dev
```

- API: `http://localhost:3001`
- Admin: `http://localhost:3001/admin`
- Health: `http://localhost:3001/health`

## Mercado Pago

1. Crie app em [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app)
2. Copie **Access Token** de produção ou teste para `MP_ACCESS_TOKEN`
3. Configure webhook: `{PUBLIC_API_URL}/api/webhook/mercadopago`
4. Com token vazio ou `MP_MOCK=true`, PIX é simulado (dev)

## Deploy (Railway / Fly / Docker)

```bash
docker build -t opala-coins-api .
docker run -p 3001:3001 --env-file .env -v coins-data:/app/data opala-coins-api
```

Defina `PUBLIC_API_URL` com a URL pública da API e `CORS_ORIGIN` com o domínio da wiki.

## Frontend

Build da wiki com:

```bash
VITE_COINS_API_URL=https://sua-api.railway.app npm run build
```

Dev local (proxy Vite):

```bash
# terminal 1
npm run dev:api
# terminal 2 — use .env.local com VITE_COINS_API_URL=/coins-api
npm run dev
```

## Pacotes (seed)

8 pacotes espelhando a loja Stonegy, com ~10% desconto na venda e ~20% margem na compra.
Edite via painel admin ou `npm run seed -- --force` (requer script manual).

## Fluxos

| Tipo | Status inicial | Admin action |
|------|----------------|--------------|
| buy | pending_payment → paid (webhook PIX) | Marcar **Entregue** |
| sell | awaiting_transfer | **Coins recebidos** → **PIX enviado** |
