const baseUrl = import.meta.env.BASE_URL;

/** Repo subpath on GitHub Pages, e.g. `/opala-wiki` (no trailing slash). */
export const BASE_PATH = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

/** Public asset or route path with Vite `base` prefix. */
export function withBase(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}${normalized}`;
}

/** Strip GitHub Pages base and return app route, e.g. `/opala-wiki/quests` → `/quests`. */
export function toAppPath(route: string): string {
  const [pathname, ...rest] = route.split('?');
  const query = rest.length ? `?${rest.join('?')}` : '';
  let path = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (BASE_PATH && path.startsWith(BASE_PATH)) {
    path = path.slice(BASE_PATH.length) || '/';
  }

  return path + query;
}

/** App route for preact-router (strips GitHub Pages base). */
export function appRoute(pathname = window.location.pathname): string {
  return toAppPath(pathname).split('?')[0] || '/';
}

/** Full browser URL for an app route, e.g. `/hunts` → `/opala-wiki/hunts`. */
export function resolveRoute(route: string): string {
  const appPath = toAppPath(route);
  const [path, query = ''] = appPath.split('?');
  const routePath = path.startsWith('/') ? path : `/${path}`;

  if (!BASE_PATH) return appPath;

  return `${BASE_PATH}${routePath}${query ? `?${query}` : ''}`;
}
