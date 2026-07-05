type NavigateFn = (route: string) => void;

let navigateFn: NavigateFn | null = null;

export function registerNavigate(fn: NavigateFn): void {
  navigateFn = fn;
}

export function navigate(route: string): void {
  navigateFn?.(route);
}

export function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}
