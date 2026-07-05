# Stonegy Endpoints (auto-discovered)

> Gerado em 2026-07-05T18:10:03.990Z

## Notas de navegação

### HTTP probe (sem Playwright)

- `https://assets.stonegy-online.com/game-data/static/version.json` → 200 (application/json)
- `https://assets.stonegy-online.com/game-data/manifest.json` → 200 (application/json)
- `https://assets.stonegy-online.com/updates/manifest.json` → 200 (application/json)
- `https://stonegy-online.com/game-data/static/version.json` → 200 (application/json)

**Client bundle:** `https://stonegy-online.com/_next/static/chunks/pages/_app-c56ee12692a73c9e.js`

**Datasets estáticos (.stonegy):**
1. `GET https://assets.stonegy-online.com/game-data/static/version.json` → versão + path do manifest
2. `GET https://assets.stonegy-online.com/game-data/static/manifest.{version}.json` → datasets (items, monsters, mapItems)
3. Baixar cada `.stonegy` referenciado no manifest (header `STGYDAT1` + zlib + JSON)

**Hunts & Quests:** embutidos no bundle `_app-*.js` (Map literals)

**Sprites:** `https://stonegy-online.com/assets/inventory/{name}.gif` e `/assets/monsters/{name}.gif`


### Playwright skipped

browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /home/antonio_cardoso/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-0klId9 --remote-debugging-pipe --no-startup-window
<launched> pid=61696
[pid=61696][err] /home/antonio_cardoso/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell: error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory
Call log:
[2m  - <launching> /home/antonio_cardoso/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-0klId9 --remote-debugging-pipe --no-startup-window[22m
[2m  - <launched> pid=61696[22m
[2m  - [pid=61696][err] /home/antonio_cardoso/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell: error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory[22m
[2m  - [pid=61696] <gracefully close start>[22m
[2m  - [pid=61696] <kill>[22m
[2m  - [pid=61696] <will force kill>[22m
[2m  - [pid=61696] exception while trying to kill process: Error: kill ESRCH[22m
[2m  - [pid=61696] <process did exit: exitCode=127, signal=null>[22m
[2m  - [pid=61696] starting temporary directories cleanup[22m
[2m  - [pid=61696] finished temporary directories cleanup[22m
[2m  - [pid=61696] <gracefully close end>[22m


HTTP probe acima é suficiente para o pipeline de extract.


## Requests capturados (5)

| URL | Method | Type | Status | Content-Type |
|-----|--------|------|--------|--------------|
| `https://assets.stonegy-online.com/game-data/manifest.json` | GET | fetch | 200 | application/json |
| `https://assets.stonegy-online.com/game-data/static/version.json` | GET | fetch | 200 | application/json |
| `https://assets.stonegy-online.com/updates/manifest.json` | GET | fetch | 200 | application/json |
| `https://stonegy-online.com/_next/static/chunks/pages/_app-c56ee12692a73c9e.js` | GET | script | 200 | application/javascript |
| `https://stonegy-online.com/game-data/static/version.json` | GET | fetch | 200 | application/json |

## Pipeline wiki

1. `fetch-game-data.ts` — CDN static datasets + client bundle hunts/quests
2. `build-atlas.ts` — sprites de `/assets/inventory/` e `/assets/monsters/`
3. Fallback: `npm run seed -- --source=codexloot`

## Playwright (opcional)

Se auth for necessária no futuro: `STONEGY_EMAIL` / `STONEGY_PASSWORD` no CI.
Instalar deps WSL: `npx playwright install-deps chromium` (requer sudo).

## lurePace (respawn durante hunt)

Enviado pelo servidor durante hunt ativa (protocolo WebSocket). Client exibe em **Velocidade de Respawn**:

| Campo | Descrição |
|-------|-----------|
| `intervalSeconds` | Timer exibido ("Tempo de respawn: 3.5s") |
| `intervalMs` | Mesmo valor em ms |
| `minSeconds` / `maxSeconds` | Limites da hunt |
| `speed` | SPEED total do personagem (equipamento) |
| `recommendedLevel` | Level recomendado da hunt |
| `effectiveLevel` | Level efetivo usado no cálculo |

**Regra SPEED (confirmada in-game):** cada **20 pontos de SPEED** reduzem o respawn em **1 segundo** (`interval -= totalSpeed / 20`).

**Importante:** respawn é **por hunt** (timer único do `lurePace`), não por criatura individual. Todos os mobs na mesma hunt compartilham o ciclo de respawn; o wiki usa pesos de spawn (`monsterWeights`) para distribuir XP/loot.

Calibração manual: [`docs/lure-pace-samples.json`](../lure-pace-samples.json). Captura: `npx tsx tools/extract/capture-lure-pace.ts`
