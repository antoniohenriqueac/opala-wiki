# Stonegy Wiki Local

Wiki estática fan do Stonegy — Hunt Finder, bestiário, itens, drops e missões. UI inspirada no client in-game (Stonegypedia + Modos de Jogo).

**Não afiliado a [stonegy-online.com](https://stonegy-online.com).**

## Setup

```bash
# Requer Node.js 20+
npm install
npm run seed      # extrai dados do Stonegy Online (CDN + client bundle)
npm run dev       # http://localhost:5173
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run seed` | Alias de `extract` — fonte Stonegy por padrão |
| `npm run seed:codexloot` | Fallback bootstrap via Codex Loot |
| `npm run extract` | Pipeline Stonegy → `wiki_data.js` + sprites |
| `npm run extract -- --source=codexloot` | Extract usando Codex Loot |
| `npm run discover` | Mapeia endpoints Stonegy → `docs/stonegy-endpoints.md` |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build estático |
| `npm run preview` | Preview local da build (:4173) |

## Fonte de dados

1. **CDN** `assets.stonegy-online.com` — datasets `.stonegy` (items, monsters, mapItems)
2. **Client bundle** — hunts e quests embutidos no `_app-*.js`
3. **Sprites** — `stonegy-online.com/assets/inventory/` e `/assets/monsters/`
4. **Fallback** — Codex Loot se Stonegy estiver indisponível

Ver [docs/stonegy-endpoints.md](docs/stonegy-endpoints.md).

## UI

- **Stonegypedia** (`/items`, `/bestiary`) — sidebar de categorias, lista, paginação
- **Modos de Jogo** (`/hunts`, `/quests`) — grid de cards estilo client
- Detalhe (drawer) mantém calculadora XP/h e loot tables

## Estrutura

- `src/` — frontend Vite + Preact
- `src/components/game/` — shell UI in-game
- `public/data/` — `wiki_data.js` + `manifest.json`
- `public/assets/` — sprite atlases webp
- `tools/extract/` — pipeline automatizado

## CI

Workflow `.github/workflows/sync-stonegy-data.yml` roda `npm run extract` diariamente e commita se `manifest.json` mudar. Sem deploy cloud — use `npm run preview` localmente.

## WSL / Playwright

`npm run discover` funciona via HTTP probe sem Playwright. Para captura de rede completa no WSL:

```bash
npx playwright install-deps chromium  # requer sudo
```
