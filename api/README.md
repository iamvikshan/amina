# Amina API

> [!INFO]
>
> Read full docs at [docs.4mina.app](https://docs.4mina.app/api). This README is a high-level overview of the API workspace, not a detailed technical manual.

Image generation, bot registry, and webhook transformer API built on
**Hono** + **Cloudflare Workers**.

---

## Stack

| Layer         | Technology                               |
| :------------ | :--------------------------------------- |
| Runtime       | Cloudflare Workers (Smart Placement)     |
| Framework     | Hono v4                                  |
| Database      | MongoDB (official driver)                |
| Validation    | Zod v4                                   |
| KV Bindings   | `RATE_LIMIT`, `CACHE`, `BOTS`            |
| Observability | Wrangler logs + traces (10% sample rate) |

---

## Routes

### Public (no auth)

| Method | Path                             | Description                      |
| :----- | :------------------------------- | :------------------------------- |
| GET    | `/`                              | API info + endpoint listing      |
| GET    | `/health`                        | Health check for uptime monitors |
| GET    | `/bot/stats`                     | Public bot statistics            |
| GET    | `/images/rank-card`              | Legacy rank card                 |
| GET    | `/images/welcome`                | Legacy welcome card              |
| GET    | `/images/leaderboard`            | Leaderboard card (TODO)          |
| GET    | `/webhooks`                      | Supported webhook providers      |
| POST   | `/webhooks/:id/:token/:provider` | Webhook transformer (Doppler)    |

### v1 -- mixed auth

| Method | Path                          | Auth         | Description         |
| :----- | :---------------------------- | :----------- | :------------------ |
| GET    | `/v1/`                        | none         | v1 endpoint listing |
| GET    | `/v1/bots`                    | rate-limited | Bot directory       |
| GET    | `/v1/bots/:clientId`          | rate-limited | Bot info            |
| GET    | `/v1/bots/:clientId/stats`    | rate-limited | Bot stats           |
| GET    | `/v1/bots/:clientId/commands` | rate-limited | Bot commands        |
| GET    | `/v1/bots/:clientId/status`   | rate-limited | Bot status          |
| GET    | `/v1/user/*`                  | API key      | Dashboard user data |
| GET    | `/v1/images/*`                | API key      | Image cards         |
| GET    | `/v1/images/filters/*`        | API key      | Image filters       |
| GET    | `/v1/images/overlays/*`       | API key      | Image overlays      |
| GET    | `/v1/images/generators/*`     | API key      | Image generators    |

### Guild -- API key auth

| Method | Path                 | Description                |
| :----- | :------------------- | :------------------------- |
| GET    | `/guild/:id`         | Guild settings             |
| PATCH  | `/guild/:id`         | Update guild settings      |
| POST   | `/guild/:id/refresh` | Trigger guild data refresh |

### Internal -- bot secret auth (`X-Client-Id` + `X-Client-Secret`)

| Method | Path                         | Auth       | Description                     |
| :----- | :--------------------------- | :--------- | :------------------------------ |
| POST   | `/internal/bots/register`    | none       | Bot registration                |
| DELETE | `/internal/bots/:clientId`   | bot secret | Bot deregistration              |
| PUT    | `/internal/bots/:clientId`   | bot secret | Update bot metadata             |
| POST   | `/internal/bots/:clientId/*` | bot secret | Heartbeat, stats push, commands |
| \*     | `/internal/guilds/*`         | bot secret | Guild sync                      |

---

## Authentication

**API key** -- v1 routes require a `Bearer amina_...` token in the
`Authorization` header. Keys are SHA-256 hashed and validated against
MongoDB.

**Bot secret** -- Internal routes use `X-Client-Id` and `X-Client-Secret`
headers. Secrets are verified with PBKDF2.

**Rate limiting** -- KV-backed fixed-window limiter applied per route
group. Headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset`) are returned on every response.

---

## Development

```bash
# Install dependencies
bun install

# Local dev (Hono node-server on port 3000)
bun run dev:local

# Wrangler dev (Workers runtime on port 8787)
bun run dev

# Type-check
bun run check
```

---

## Deployment

```bash
# Deploy to Cloudflare Workers (production)
bun run deploy:prd
```

Required secrets (set via `wrangler secret put`):

| Secret             | Purpose                       |
| :----------------- | :---------------------------- |
| `MONGO_CONNECTION` | MongoDB connection string     |
| `LOGS_WEBHOOK`     | Logger webhook URL (optional) |

Required KV namespaces (bound in `wrangler.jsonc`):

- `RATE_LIMIT` -- rate limiter state
- `CACHE` -- response cache
- `BOTS` -- bot registry

---

## Path Aliases

| Alias           | Target             |
| :-------------- | :----------------- |
| `@lib/*`        | `src/lib/*`        |
| `@middleware/*` | `src/middleware/*` |
| `@routes/*`     | `src/routes/*`     |
| `@api-types/*`  | `../types/api/*`   |

---

## Project Structure

```
api/
  src/
    index.ts            # Hono app, global middleware, route mounting
    server.ts           # Local dev server (@hono/node-server)
    middleware/
      auth.ts           # API key auth (v1 routes)
      botAuth.ts        # Bot secret auth (internal routes)
      rateLimit.ts      # KV-backed rate limiter factories
      webhooks.ts       # Webhook param validation
    routes/
      bot.ts            # /bot/stats
      guild.ts          # /guild/:id
      images.ts         # /images/* (legacy, no auth)
      webhooks.ts       # /webhooks (GET listing + POST transform)
      v1/               # /v1/* (API key auth)
        images.ts       # Rank, welcome, farewell, spotify, color, circle
        filters.ts      # Image filters
        overlays.ts     # Image overlays
        generators.ts   # Image generators
        bots.ts         # Bot directory
        user.ts         # User profile
      internal/         # /internal/* (bot secret auth)
        bots.ts         # Bot registration
        guilds.ts       # Guild sync
    lib/
      api-keys.ts       # API key lookup + usage tracking
      bot-stats.ts      # Bot statistics aggregation
      botAuth.ts        # PBKDF2 secret validation
      kvBots.ts         # KV bot registry helpers
      logger.ts         # Discord webhook logger
      mongodb.ts        # MongoDB client factory
      rate-limit.ts     # Rate limit check + headers
      response.ts       # Standardised JSON response helpers
      styles.ts         # Amina design system CSS for cards
      svg-utils.ts      # SVG generation utilities
      validation.ts     # Zod schema helpers
      cards/            # Rank, welcome, spotify card renderers
      webhooks/         # Doppler transformer + templates
  wrangler.jsonc        # Workers config, KV bindings, observability
  tsconfig.json         # Strict TS, bundler resolution, path aliases
  package.json          # Dependencies + scripts
```
