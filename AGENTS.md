# AGENTS.md

- Prefer little code that does more. Reach for mature packages instead of reinventing common solutions.
- Keep modules cohesive, reusable, and easy to share without creating needless file sprawl.
- Breaking changes are acceptable in this repo. Remove dead code instead of adding backward-compatibility or deprecation layers.

---

## project.tools:

```yaml
language: typescript
pm: bun
format: bun run f # formats changed files only — NEVER use bun f:all
lint: bun check # combined lint + typecheck
typecheck: bun check # standalone alternative: bunx tsc --noEmit
test: bun test
build: bun run build # alias for bun check (no compile step — Bun runs TS natively)
detected: 2026-03-15
```

## project.conventions:

```yaml
fileNaming: camelCase (files/modules) | PascalCase (exported classes/types) | UPPER_SNAKE_CASE (.env & config.ts constants)
docs: jsdoc
planDir: plans/
testDir: tests/
```

**Naming enforcement:** Inconsistencies exist in the codebase — fix on encounter.

---

## Stack

- **Runtime:** Bun (>=1.3.11) — runs TypeScript natively, no build/compile step
- **Bot framework:** discord.js v14
- **Database:** MongoDB via Mongoose
- **AI integrations:** Mistral AI (`@mistralai/mistralai`), Groq SDK (`groq-sdk`)
- **Music:** Lavalink server + `lavalink-client` (Spotify, Apple Music, Deezer, YouTube via plugins)
- **Logging:** Pino + pino-pretty
- **Error monitoring:** Honeybadger (`@honeybadger-io/js`)
- **API workspace:** `api/` — Hono on Cloudflare Workers with MongoDB driver
- **Containerization:** Docker + Docker Compose (Bun Alpine image + Lavalink sidecar)
- **Release:** semantic-release (conventional commits)

---

## Path Aliases

| Alias           | Target                   |
| --------------- | ------------------------ |
| `@root/*`       | `./*`                    |
| `@src/*`        | `src/*`                  |
| `@data/*`       | `src/data/*`             |
| `@handlers/*`   | `src/handlers/*`         |
| `@helpers/*`    | `src/helpers/*`          |
| `@schemas/*`    | `src/database/schemas/*` |
| `@structures/*` | `src/structures/*`       |
| `@commands/*`   | `src/commands/*`         |
| `@services/*`   | `src/services/*`         |
| `@types/*`      | `types/*`                |

---

## Structure

- **Entry point:** `src/index.ts` — validates config, inits Mongoose, loads commands/events, logs in via discord.js
- **Commands:** `src/commands/` — organized by category: admin, bot, dev, economy, fun, giveaways, info, moderation, music, social, stats, utility
- **Events:** `src/events/` — discord.js event handlers (guild, interactions, messages, player, voice, etc.)
- **Handlers:** `src/handlers/` — business logic for commands, automod, giveaways, tickets, reminders, AI, etc.
- **Structures:** `src/structures/` — core classes: `BotClient`, `Command`, `CommandCategory`, `BaseContext`
- **Services:** `src/services/` — AI responder, model router, memory service, health check
- **Helpers:** `src/helpers/` — utilities, AI clients, validators, extenders, injection detection
- **Config:** `src/config/` — bot config, secrets, AI responder config
- **Database:** `src/database/` — Mongoose connection + schemas
- **Data:** `src/data/` — static JSON (colors, responses, AI permissions, prompt)
- **Contexts:** `src/contexts/` — context menu commands
- **Shared types:** `types/` — import via `@types/*`
- **API workspace:** `api/` — Hono REST API (routes: bot, guild, images, v1, internal, webhooks)
- **Tests:** `tests/`
- **Plans:** `plans/` — task plans and phase completion records

---

## Workflow Rules

- Use canonical commands from `project.tools:` above. No substitutes.
- Use `bun run build` (which runs `bun check`) for production validation.
- The API workspace has its own scripts: `bun api:dev`, `bun api:check`, `bun api:deploy`.
- Use `bun check:all` to lint/typecheck both the bot and API workspace.

---

## Database & Schema

- **MongoDB via Mongoose.** Schemas live in `src/database/schemas/`.
- Connection is initialized in `src/database/mongoose.ts` before the bot starts.
- When adding or modifying schemas, keep Mongoose schema definitions and the corresponding `@types/*` declarations in sync.

---

## Testing Conventions

| Category         | Approach                                                                    |
| ---------------- | --------------------------------------------------------------------------- |
| AI/service tests | Mock-heavy tests for AI clients, model routing, memory, injection detection |
| Security tests   | Input validation, injection detection, security fixes verification          |
| Logic tests      | `mock.module()` for business logic and service code                         |
