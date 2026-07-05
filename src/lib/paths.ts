const baseUrl = import.meta.env.BASE_URL;

/** Repo subpath on GitHub Pages, e.g. `/opala-wiki` (no trailing slash). */
export const BASE_PATH = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

/** Public asset or route path with Vite `base` prefix. */
export function withBase(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}${normalized}`;
}

/** App route for preact-router (strips GitHub Pages base). */
export function appRoute(pathname = window.location.pathname): string {
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    const rest = pathname.slice(BASE_PATH.length);
    return rest || '/';
  }
  return pathname || '/';
}

/** Full browser URL for an app route, e.g. `/hunts` → `/opala-wiki/hunts`. */
export function resolveRoute(route: string): string {
  const routePath = route.startsWith('/') ? route : `/${route}`;
  if (!BASE_PATH) return routePath;
  return `${BASE_PATH}${routePath}`;
}
