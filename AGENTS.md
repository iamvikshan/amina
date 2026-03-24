# AGENTS.md

- Prefer little code that does more. Reach for mature packages instead of reinventing common solutions.
- Keep modules cohesive, reusable, and easy to share without creating needless file sprawl.
- Breaking changes are acceptable in this repo. Remove dead code instead of adding backward-compatibility or deprecation layers.
- node is prohibited, use bun at all times.

---

## project.tools

```yaml
language: typescript
pm: bun
format: bun run f # formats changed files only — NEVER use bun f:all
lint: bun check # combined lint + typecheck (eslint + tsc --noEmit)
typecheck: bunx tsc --noEmit
test: bun test # run all tests
test-single: bun test tests/<name>.test.ts # run one test file
test-grep: bun test --grep "pattern" # run tests matching description
build: bun run build # alias for bun check (no compile step — Bun runs TS natively)
```

## project.conventions

```yaml
fileNaming: camelCase (files/modules) | PascalCase (exported classes, types, schema files) | UPPER_SNAKE_CASE (.env & config.ts constants)
docs: jsdoc (optional but encouraged on public methods)
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
- **Logging:** Pino + pino-pretty, wrapped by `src/helpers/Logger.ts`
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

Always use path aliases for internal imports. Never use deep relative paths when an alias exists.

---

## Structure

- **Entry point:** `src/index.ts` — validates config, inits Mongoose, loads commands/events, logs in
- **Commands:** `src/commands/<category>/` — one file per command, `export default` a `CommandData` object
- **Events:** `src/events/` — each file exports a default async function `(client: BotClient, ...args) => Promise<void>`, filename maps to event name
- **Handlers:** `src/handlers/` — business logic for commands, automod, giveaways, tickets, reminders, AI
- **Structures:** `src/structures/` — core classes: `BotClient`, `Command`, `CommandCategory`, `BaseContext`
- **Services:** `src/services/` — AI responder, model router, memory service, health check
- **Helpers:** `src/helpers/` — utilities, AI clients, validators, extenders, injection detection
- **Config:** `src/config/` — bot config, secrets, AI responder config
- **Database:** `src/database/schemas/` — Mongoose schemas with exported helper functions
- **Data:** `src/data/` — static JSON (colors, responses, AI permissions, prompt)
- **Shared types:** `types/` — ambient global `.d.ts` declarations, import via `@types/*`
- **API workspace:** `api/` — Hono REST API (routes: bot, guild, images, v1, internal, webhooks)
- **Tests:** `tests/` — flat directory, `<name>.test.ts` files

Barrel `index.ts` files exist in many directories (structures, handlers, config, helpers/ModUtils). Use them when importing multiple exports from a module group.

---

## Code Style

### Formatting (Prettier)

No semicolons, single quotes, 2-space indent, trailing commas (ES5), arrow parens avoided, print width 80. See `.prettierrc.json`.

### Imports

- Use path aliases (`@helpers/Logger`, `@schemas/Guild`) — never deep relative paths when an alias covers it.
- Use `import type { X }` for type-only imports (required by `verbatimModuleSyntax` in tsconfig).
- Named imports from libraries: `import { Collection } from 'discord.js'`.
- Default imports for internal modules: `import Logger from '@helpers/Logger'`.

### Exports

- **Commands:** `const command: CommandData = { ... }; export default command`
- **Services:** Export the class and a singleton instance: `export class FooService { ... }` + `export const fooService = new FooService()`
- **Helpers/Logger:** Default export + named convenience exports: `export default Logger` and `export const { success, log, warn, error, debug } = Logger`
- **Schemas:** Export `Model` and helper functions (`getUser`, `saveMemory`, etc.)

### Functions

- Command handlers: `async interactionRun(interaction, data)` inside command objects.
- Handlers: exported as `const handleX = async (...) => { ... }`.
- Prefer arrow functions for handlers passed around; use `function` declarations for standalone utilities.

### Error Handling

- Wrap async I/O in `try/catch`. Log with `Logger.error('context', err)` — this also notifies Honeybadger.
- Use `Honeybadger.setContext()` / `resetContext()` around command lifecycles.
- Send user-friendly fallback messages on failure; swallow non-critical errors with `.catch(() => {})` only when appropriate.
- Prefix unused catch params with underscore: `catch (_err)`.

### Types

- Strict mode enabled (`strict: true` in tsconfig) with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`.
- Shared types are ambient globals in `types/*.d.ts` (e.g., `CommandData`, `IGuildSettings`).
- Prefer typed returns on public methods. Accept `any` only where unavoidable (external lib shapes).
- Prefix unused parameters with `_` (enforced by eslint `argsIgnorePattern: '^_'`).

### Logging

- Always use `src/helpers/Logger.ts` — never instantiate pino directly elsewhere.
- Static methods: `Logger.success()`, `Logger.log()`, `Logger.warn()`, `Logger.error(msg, err?)`, `Logger.debug()`.
- Inside BotClient context, use `client.logger` which delegates to the same Logger.

### Async Patterns

- Heavy `async/await` throughout. Parallelize independent I/O with `Promise.all`.
- Guard long-running loops with iteration limits (e.g., AI ReAct loops).

---

## Workflow Rules

- Use canonical commands from `project.tools` above. No substitutes.
- Use `bun run build` (runs `bun check`) for production validation.
- API workspace scripts: `bun api:dev`, `bun api:check`, `bun api:deploy`.
- Use `bun check:all` to lint/typecheck bot + API + CLI workspaces.
- Pre-commit hook (`husky`) runs `bun check:all && bun f:check` — ensure these pass before committing.

---

## Database & Schema

- Schemas live in `src/database/schemas/`, filenames PascalCase (e.g., `Guild.ts`, `AiMemory.ts`).
- Pattern: `const Schema = new mongoose.Schema({ ... })` then `export const Model = mongoose.model('name', Schema)`.
- Export helper functions from schema files for common queries (`getUser`, `upsertConversation`, etc.).
- Types in `types/schemas.d.ts` must be kept in sync manually with Mongoose schema definitions.
- Use LRUCache for frequently accessed documents (see `Guild.ts`, `User.ts` for pattern).

---

## Testing Conventions

- **Runner:** `bun:test` — import `{ describe, test, expect, mock, beforeEach }` from `'bun:test'`.
- **File naming:** `tests/<name>.test.ts` (flat directory, no nesting).
- **Mocking:** Use `mock()` and `mock.module()`. Declare mocks **before** importing the module under test.
- **DB isolation:** Mock schema module exports (`mock.module('@schemas/AiMemory', () => (...))`) — no in-memory DB.
- **Reset:** Call `mockFn.mockReset()` in `beforeEach` to avoid test pollution.
- **Run single test:** `bun test tests/aiClient.test.ts`
- **Run by pattern:** `bun test --grep "circuit breaker"`

| Category         | Approach                                                           |
| ---------------- | ------------------------------------------------------------------ |
| AI/service tests | Mock AI clients, model routing, memory, injection detection        |
| Security tests   | Input validation, injection detection, security fixes verification |
| Schema tests     | Mock Mongoose models, inspect schema paths and indexes             |
| Logic tests      | `mock.module()` for business logic and service code                |
