import type { JSX } from 'preact';

declare module 'preact' {
  namespace JSX {
    interface HTMLAttributes<Target extends EventTarget = EventTarget>
      extends preact.JSX.HTMLAttributes<Target> {
      path?: string;
      default?: boolean;
      url?: string;
    }
  }
}

export {};
