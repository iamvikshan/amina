/* eslint-disable @typescript-eslint/no-unused-vars */
// Environment variable type definitions

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Secrets - Required
      BOT_TOKEN: string
      MONGO_CONNECTION: string
      // Secrets - Optional
      LOGS_WEBHOOK?: string
      GEMINI_KEY?: string
      UPSTASH_VECTOR?: string
      WEATHERSTACK_KEY?: string
      STRANGE_API_KEY?: string
      GH_TOKEN?: string
      SPOTIFY_CLIENT_ID?: string
      SPOTIFY_CLIENT_SECRET?: string
      OPENAI?: string
      HONEYBADGER_API_KEY?: string
      WEBHOOK_SECRET?: string
      // Lavalink Secrets
      LAVALINK_ID_1?: string
      LAVALINK_HOST_1?: string
      LAVALINK_PORT_1?: string
      LAVALINK_PASSWORD_1?: string
      LAVALINK_SECURE_1?: string
      LAVALINK_ID_2?: string
      LAVALINK_HOST_2?: string
      LAVALINK_PORT_2?: string
      LAVALINK_PASSWORD_2?: string
      LAVALINK_SECURE_2?: string
      // Runtime environment (not a secret, but env-specific)
      NODE_ENV?: string
      HONEYBADGER_REVISION?: string
    }
  }
}

export {}

