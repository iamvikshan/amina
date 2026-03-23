 
// Environment variable type definitions

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Secrets - Required
      BOT_TOKEN: string
      MONGO_CONNECTION: string
      // Secrets - Optional
      LOGS_WEBHOOK?: string
      MISTRAL?: string
      GEMINI?: string
      VOYAGE?: string
      VOYAGE_MONGO?: string
      WEATHERSTACK_KEY?: string
      STRANGE_API_KEY?: string
      SPOTIFY_CLIENT_ID?: string
      SPOTIFY_CLIENT_SECRET?: string
      HONEYBADGER_API_KEY?: string
      WEBHOOK_SECRET?: string
      // Lavalink Secrets
      LAVALINK_PASS?: string
      LAVALINK_1_ID?: string
      LAVALINK_1_HOST?: string
      LAVALINK_1_PORT?: string
      LAVALINK_2_ID?: string
      LAVALINK_2_HOST?: string
      LAVALINK_2_PORT?: string
      // Runtime environment (not a secret, but env-specific)
      NODE_ENV?: string
      HONEYBADGER_REVISION?: string
    }
  }
}

export {}

