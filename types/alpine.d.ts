// Alpine.js + HonoX JSX attribute support
// Allows `x-*` and `x-on:*` / `x-bind:*` attributes in TSX without type errors.

import 'hono/jsx';

declare module 'hono/jsx' {
  namespace JSX {
    interface HTMLAttributes {
      // Common Alpine directives
      'x-data'?: string;
      'x-show'?: string;
      'x-cloak'?: boolean | string;
      'x-init'?: string;

      // Namespaced Alpine directives (TypeScript parses these as JSXNamespacedName)
      'x-on:click'?: string;
      'x-on:keydown.escape'?: string;
      'x-bind:class'?: string;

      // Allow other Alpine directives / shorthands without fighting types
      [key: string]: unknown;
    }
  }
}
