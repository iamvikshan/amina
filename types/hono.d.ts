import type { DiscordUser } from '@types';

declare module 'hono' {
  interface ContextVariableMap {
    user: DiscordUser;
  }
}
