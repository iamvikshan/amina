# Three-way Architecture: Bot + Dashboard + Public API

This note captures the recommended way to adapt the “dashboard backend demo” style into a production setup for a fully functional bot, without accidentally creating duplicate Discord gateway clients and without relying heavily on Discord REST (rate limits).

## Summary (recommended)

- **One gateway client only**: your Discord bot process is the _only_ service that logs into Discord via the gateway (Discord.js `Client.login()`).
- **Dashboard is UI-only**: the dashboard should not run a second Discord.js gateway client.
- **Public API is the bridge**: the dashboard talks to a public API, and the public API talks to MongoDB and coordinates “actions” for the bot.

This avoids double event handling and keeps Discord REST usage low.

## Why the reference backend looks like a “dummy bot”

The reference backend (Nest + Prisma + Discord.js) logs into Discord mainly to:

- read guild presence from `client.guilds.cache`
- fetch channels/roles
- perform basic permission checks

It intentionally does **not** implement bot behavior (no message handlers, no slash command handlers, no interaction event logic). It’s a dashboard backend demo, not a complete bot.

## Key rule: avoid dual gateway sessions

If you run **two Discord.js clients logged in with the same bot token**:

- Discord will deliver gateway events to _both_ sessions.
- If both have listeners (e.g. `interactionCreate`), they can both respond.
- This can produce duplicated command execution or “already acknowledged” interaction errors.

Therefore: **do not** add a second gateway client to the dashboard or API unless you also implement leader election / single-writer semantics (not worth it for this use case).

## The 3 projects you described (clean split)

### 1) Bot client (Discord.js) — the only gateway connection

Responsibilities:

- All Discord gateway concerns: commands, interactions, message events, member events.
- Permission checks using live guild/member state.
- Executes “actions” requested by the dashboard (e.g. send embeds, post messages).
- Maintains _cache_ in MongoDB for fast reads (channels, roles, guild metadata, etc.).

Notes:

- The bot should be the place that listens to events like channel/role updates and keeps Mongo in sync.
- The bot can still call Discord REST occasionally, but should not be the primary data plane for the dashboard.

### 2) Dashboard (Bun + Hono + HonoX)

Responsibilities:

- UI + SSR/CSR rendering.
- Auth session handling (Discord OAuth on behalf of the user).
- Calls the public API for data and actions.

Should avoid:

- heavy Discord REST calls for channels/roles/etc.
- running a gateway client.

### 3) Public API (Bun + Hono; Cloudflare Worker optional)

Responsibilities:

- Auth tokens / access control for dashboard calls.
- Reads from MongoDB caches.
- Accepts “bot action requests” and routes them to the bot (directly or via queue).

## How the services communicate

You mentioned two needs:

1. **Read**: dashboard needs data like channels/roles for autocomplete.
2. **Write**: dashboard needs to trigger bot actions (send embeds, post messages, etc.).

### Reads: prefer Mongo cache, not Discord REST

- Let the bot populate Mongo with:
  - channels per guild
  - roles per guild
  - guild metadata
  - possibly “manageable guilds” derived from user permission checks

Then the dashboard/public API:

- reads from Mongo (fast)
- only uses Discord REST for:
  - OAuth user identity (`/users/@me`)
  - user guild list (`/users/@me/guilds`)
  - occasional cold-start reconciliation

This dramatically reduces Discord REST usage and rate-limit pressure.

### Writes: bot actions via either a queue or private RPC

**Option A (simplest with shared Mongo): Mongo job queue (recommended)**

- Public API writes a job document:
  - `type`: e.g. `send_embed`
  - `guildId`, `channelId`
  - `payload`: embed content
  - `requestedBy`: user id
  - `status`: `pending|processing|done|failed`
  - timestamps

- Bot consumes jobs:
  - via Mongo Change Streams (preferred) or polling
  - executes action
  - updates the job status + result

Benefits:

- No inbound network exposure on the bot.
- Works naturally in distributed deployments.
- Easy audit trail and retry logic.

Tradeoffs:

- Async by default (can still feel “near real-time” with change streams).

**Option B: bot exposes private HTTP endpoint**

- Bot runs a small internal HTTP server (Hono/Express) protected by shared secret or mTLS.
- Public API sends “do action now” requests.

Benefits:

- Very low latency synchronous calls.

Tradeoffs:

- Harder security + ops (must keep it private, not publicly reachable).
- You still need idempotency and request authentication.

## Authentication and authorization (practical guidance)

A safe shape:

- Dashboard authenticates the user via Discord OAuth.
- Dashboard calls the public API with a session/JWT.
- Public API authorizes actions per guild:
  - either by checking cached guild permission state
  - or by validating the user guild permission bitset from Discord OAuth (`/users/@me/guilds`)
- Public API writes an action job.
- Bot re-validates critical constraints before executing:
  - bot is in guild
  - channel exists and is writable
  - optional: user has permission (based on cached membership/roles if you store it)

## “Easiest is Discord REST, but I hit rate limits”

That’s expected if the dashboard/API repeatedly fetches channels/roles/guild data from Discord for every request or user interaction.

The fix is:

- **Gateway-derived cache** (bot → Mongo) for high-frequency reads.
- **REST only for OAuth/user identity** and low-frequency reconciliation.

This aligns with your current approach in the dashboard codebase where bot token REST is already used in places, but should be reduced for frequently accessed endpoints.

## Recommendation for your next implementation step

Start with the minimal pieces that unlock your two main needs:

1. **Mongo cache schema** for `guildChannels`, `guildRoles`, `guildMeta`.
2. **Bot sync loop**:
   - on ready: initial cache fill for guilds
   - on events: update cache
3. **Public API endpoints**:
   - `GET /guilds/:id/channels` (from Mongo)
   - `GET /guilds/:id/roles` (from Mongo)
   - `POST /guilds/:id/actions/send-embed` (creates job)
4. **Bot job consumer**:
   - executes `send-embed` and stores result

Once that works, you can expand features without introducing a second gateway client.
