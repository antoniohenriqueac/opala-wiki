# Coins API — Opala Wiki

Backend para loja de coins (intermediador) com PIX via Mercado Pago e PostgreSQL.

## Setup

```bash
cd server
cp .env.example .env
# Edite .env: DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET
npm install
npm run dev
```

- API: `http://localhost:3001`
- Admin: `http://localhost:3001/admin`
- Health: `http://localhost:3001/health`

### PostgreSQL local

```bash
# Docker
docker run -d --name opala-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=opala_coins -p 5432:5432 postgres:16-alpine

# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/opala_coins
```

O schema é criado automaticamente no startup (`initDb`).

## Mercado Pago

1. Crie app em [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app)
2. Copie **Access Token** de produção ou teste para `MP_ACCESS_TOKEN`
3. Configure webhook: `{PUBLIC_API_URL}/api/webhook/mercadopago`
4. Com token vazio ou `MP_MOCK=true`, PIX é simulado (dev)

## Deploy (Render / Docker)

No Render: crie um **PostgreSQL** + **Web Service** apontando para `server/`.

Variáveis essenciais:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Injetada automaticamente pelo Render Postgres |
| `DATABASE_SSL` | `true` em Postgres gerenciado |
| `ADMIN_PASSWORD` | Senha do painel `/admin` |
| `JWT_SECRET` | Segredo longo para tokens admin |
| `CORS_ORIGIN` | URL(s) da wiki |
| `PUBLIC_API_URL` | URL pública desta API |
| `GAME_RECEIVER_CHAR` | Char que recebe coins na venda |

```bash
docker build -t opala-coins-api .
docker run -p 3001:3001 --env-file .env opala-coins-api
```

## Frontend

Build da wiki com:

```bash
VITE_COINS_API_URL=https://sua-api.onrender.com npm run build
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
Edite via painel admin ou `npm run seed -- --force`.

## Fluxos

| Tipo | Status inicial | Admin action |
|------|----------------|--------------|
| buy | pending_payment → paid (webhook PIX) | Marcar **Entregue** |
| sell | awaiting_transfer | **Coins recebidos** → **PIX enviado** |
