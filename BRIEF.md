# TypeScript Migration Brief for Copilot

## Context

We are **gradually migrating** the Amina Discord bot from JavaScript to
TypeScript without breaking the existing codebase. The bot runs on **Bun**,
which natively supports TypeScript alongside JavaScript files.

## Why We're Doing This

- **Bun's native TS support** - No transpilation needed, runs .ts files directly
- **Better type safety** - Catch bugs earlier with gradual typing
- **Improved DX** - Better IDE autocomplete and IntelliSense
- **Future-proof** - Modern JavaScript/TypeScript features
- **Zero downtime** - Bot continues running during migration

## How We're Approaching It

### Configuration Strategy

- **Very permissive `tsconfig.json`** with `strict: false` and `allowJs: true`
- Mixed .js and .ts files can coexist and import each other
- No breaking changes - existing JavaScript continues to work
- Type checking is optional (`bun typecheck`) and doesn't block execution

### Migration Philosophy

1. **Small bites** - Convert 1-3 small files at a time
2. **Test after each step** - Ensure bot still runs
3. **Low risk first** - Start with utilities, not core classes
4. **Preserve functionality** - Don't refactor logic, just convert syntax
5. **Gradual typing** - Use `any` liberally at first, refine later

## Progress So Far - MASSIVE UPDATE! 🎉

### ✅ Already Converted (24 files) - Foundations Complete!

**Configuration & Types:**

- `src/config.ts` - Main bot configuration
- `types/global.d.ts` - Global type definitions
- `types/schemas.d.ts` - Schema type definitions

**Handlers:**

- `src/handlers/command.ts` - Slash command handler
- `src/handlers/index.ts` - Handler barrel exports

**✨ Helpers (Foundation Layer 1 & 2 - COMPLETE!):**

- `src/helpers/Logger.ts` - Logging utility (114 lines)
- `src/helpers/Validator.ts` - Command validation (253 lines)
- `src/helpers/permissions.ts` - Permission name mapping (43 lines) ⭐
- `src/helpers/channelTypes.ts` - Channel type mapping (31 lines) ⭐
- `src/helpers/HttpUtils.ts` - HTTP utility class (121 lines) ⭐ **NEW**
- `src/helpers/BotUtils.ts` - Bot utility functions (101 lines) ⭐ **NEW**

**✨ Structures (Foundation Layer 2 - COMPLETE!):**

- `src/structures/CommandCategory.ts` - Command category enum
- `src/structures/index.ts` - Barrel export file (13 lines) ⭐
- `src/structures/BaseContext.ts` - Context menu base (42 lines) ⭐ **NEW**
- `src/structures/Command.ts` - Command base structure (130 lines) ⭐ **NEW**

**Database Schemas:**

- `src/database/schemas/User.ts`
- `src/database/schemas/Guild.ts`
- `src/database/schemas/Member.ts`

**Commands (Examples):**

- `src/commands/fun/meme.ts`
- `src/commands/utility/help.ts`

**Services:**

- `src/services/health.ts`

### 📦 Still in JavaScript - Organized by Priority

**🔴 Layer 3: Simple Handlers (Next Priority - 45-95 lines each):**

- `src/handlers/giveaway.js` (45 lines) ⭐ SMALLEST
- `src/handlers/reactionRoles.js` (48 lines) ⭐ VERY SMALL
- `src/handlers/manager.js` (50 lines) ⭐ SMALL
- `src/handlers/counter.js` (72 lines)
- `src/handlers/presence.js` (81 lines)
- `src/handlers/player.js` (86 lines)
- `src/handlers/context.js` (95 lines)

**🟡 Medium Handlers (124-179 lines):**

- `src/handlers/stats.js` (124 lines)
- `src/handlers/greeting.js` (135 lines)
- `src/handlers/invite.js` (172 lines)
- `src/handlers/tod.js` (179 lines)

**🟠 Large Handlers (234-426 lines):**

- `src/handlers/profile.js` (234 lines)
- `src/handlers/guild.js` (239 lines)
- `src/handlers/automod.js` (245 lines)
- `src/handlers/ticket.js` (380 lines)
- `src/handlers/report.js` (424 lines)
- `src/handlers/suggestion.js` (426 lines)

**🟢 Remaining Utilities:**

- `src/helpers/Honeybadger.js` (42 lines) - Simple error tracking config
- `src/helpers/Utils.js` (187 lines) - General utilities
- `src/helpers/ModUtils.js` (616 lines) - Moderation utilities (complex)

**🔵 Core (Final Phase):**

- `src/structures/BotClient.js` (390 lines) - Core client, very complex, convert
  LAST

## Next Step: Layer 3 - Simple Handlers Batch

We want to convert the **3 smallest handlers** next (total ~143 lines):

### 1. `src/handlers/giveaway.js` (45 lines) ⭐ SMALLEST

**What it is:** Giveaway system handler/initializer

**Likely structure:**

```javascript
module.exports = client => {
  // Initialize giveaway manager
  // Setup event handlers
  return giveawayManager
}
```

**Dependencies:**

- `discord-giveaways` package
- BotClient instance
- Database schemas
- Config (giveaway settings)

**Where it's used:**

- Called from `src/structures/BotClient.js` during initialization
- Referenced in giveaway-related commands

**Conversion approach:**

- Convert to ES6 `export default`
- Add types for function parameters (BotClient)
- Type the return value (GiveawayManager)
- Ensure compatibility with BotClient.js (still .js)
- Use `any` types liberally for complex giveaway manager types

### 2. `src/handlers/reactionRoles.js` (48 lines) ⭐ VERY SMALL

**What it is:** Reaction role system handler

**Likely structure:**

```javascript
module.exports = {
  handleReactionAdd: async (reaction, user) => { ... },
  handleReactionRemove: async (reaction, user) => { ... },
  setupReactionRoles: async (guild) => { ... }
}
```

**Dependencies:**

- Discord.js reaction events (MessageReaction, User)
- Database schemas (ReactionRoles)
- Possibly emoji utilities

**Where it's used:**

- Event handlers (`src/events/reaction/`)
- Setup functions called from guild join/command

**Conversion approach:**

- Convert to ES6 exports (named exports preferred)
- Add types for Discord.js reaction parameters
- Type async function returns as `Promise<void>`
- Keep handler functions flexible with `any` where needed

### 3. `src/handlers/manager.js` (50 lines) ⭐ SMALL

**What it is:** Music manager handler (Lavalink client wrapper)

**Likely structure:**

```javascript
const { Manager } = require('lavalink-client')

module.exports = class CustomManager extends Manager {
  constructor(client) {
    super({
      nodes: [...],
      // ... config
    })
  }
}
```

**Dependencies:**

- `lavalink-client` package (Manager class)
- Config for Lavalink nodes
- BotClient instance
- Player event handlers

**Where it's used:**

- `src/structures/BotClient.js` creates `this.musicManager = new Manager(this)`
- Music commands access via `client.musicManager`

**Conversion approach:**

- Convert to ES6 class export
- Extend from lavalink-client's Manager
- Type constructor parameter (BotClient)
- Type node configurations
- Ensure BotClient.js can still instantiate it (backward compatible)

## Critical Requirements

### DO ✅

1. **Convert to ES6 syntax** - Use `import`/`export` instead of
   `require`/`module.exports`
2. **Add basic type annotations** - Parameter types and return types
3. **Use `any` liberally** - Don't get stuck on complex types
4. **Maintain exact functionality** - Don't change logic or behavior
5. **Keep exports compatible** - Ensure .js files can still import
6. **Test after each conversion** - Run `bun start` to verify bot works
7. **Use loose typing** - Match our permissive tsconfig

### DON'T ❌

1. **Don't refactor logic** - Just convert syntax, keep behavior identical
2. **Don't enable strict types** - Keep types loose
3. **Don't change file locations** - Keep files in same directory
4. **Don't break existing imports** - All import paths must still work
5. **Don't convert dependencies yet** - BotClient.js, Utils.js stay as-is
6. **Don't add complex type definitions** - Simple types only
7. **Don't remove comments** - Preserve existing documentation

## How to Verify Success

After conversion, these should all work:

```typescript
// TypeScript files importing
import giveawayHandler from '@handlers/giveaway'
import reactionRoleHandler from '@handlers/reactionRoles'
import Manager from '@handlers/manager'

// JavaScript files importing (CommonJS) - from BotClient.js
const giveawayHandler = require('./handlers/giveaway')
const Manager = require('./handlers/manager')
```

## Testing Steps

For each converted file:

1. **Convert the file** to TypeScript
2. **Run type check** - `bun typecheck` (warnings OK, no errors)
3. **Start the bot** - `bun start` (should start normally)
4. **Test related features:**
   - For `giveaway.js` - Try `/giveaway` command
   - For `reactionRoles.js` - Test reaction role functionality
   - For `manager.js` - Try playing music with `/play`
5. **Check logs** - No unusual errors or warnings
6. **Verify imports** - Ensure no "cannot find module" errors

## Example Conversion Pattern

### Before (JavaScript):

```javascript
const { GiveawaysManager } = require('discord-giveaways')

module.exports = client => {
  const manager = new GiveawaysManager(client, {
    storage: './giveaways.json',
    default: {
      embedColor: '#FF0000',
    },
  })

  return manager
}
```

### After (TypeScript):

```typescript
import { GiveawaysManager } from 'discord-giveaways'
import type { Client } from 'discord.js'

export default function initGiveaways(client: Client): any {
  const manager = new GiveawaysManager(client, {
    storage: './giveaways.json',
    default: {
      embedColor: '#FF0000',
    },
  })

  return manager
}

// Optional: Also export as named for flexibility
export { initGiveaways }
```

## Summary

**Goal:** Convert the 3 smallest handlers to TypeScript (Layer 3 start)

**Files:**

1. `src/handlers/giveaway.js` (45 lines)
2. `src/handlers/reactionRoles.js` (48 lines)
3. `src/handlers/manager.js` (50 lines)

**Why these:**

- Small, manageable files
- Complete Foundation Layers 1 & 2
- Natural next step in migration
- Low risk, high confidence

**How:**

- ES6 syntax
- Loose types with `any` where needed
- Maintain compatibility
- No logic changes
- Test thoroughly

**Success criteria:**

- Bot runs without errors
- All features work normally
- Both .js and .ts files can import them
- No breaking changes to existing code
