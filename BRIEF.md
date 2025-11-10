# TypeScript Migration Brief - Phase 4: Commands

## Context

We are in **Phase 4** of gradually migrating the Amina Discord bot from JavaScript to TypeScript. The bot runs on **Bun**, which natively supports TypeScript alongside JavaScript files.

**Current Progress: 133/374 files converted (35.6%)**

> **📋 Note:** This BRIEF.md focuses on **Phase 4: Commands Conversion**. For complete status and history, see `TODO.md`.

## Phase 4 Overview

### What We've Completed (Phases 1-3) ✅

- ✅ **Phase 1:** Core infrastructure, structures, helpers, database schemas (58 files)
- ✅ **Phase 2:** All handlers (19 files)
- ✅ **Phase 3:** All events, entry point, ModUtils refactor (28 files)
- ✅ **Command Structure Enhanced:** Added `Command` type export, made properties optional, added 'INFO' category

**Total Converted:** 133 files (35.6%)

### What's Left: Phase 4 - Commands (210 files)

Convert all bot command files from JavaScript to TypeScript. Commands are organized by category and use the updated `Command` structure with permissive types.

**Current Status:** 4/214 commands converted (2%)

- ✅ bot/bot.ts, bot/sub/botstats.ts
- ✅ fun/meme.ts, utility/help.ts

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

### Migration Philosophy for Commands

1. **Small categories first** - Convert 2-8 files at a time by category
2. **Test after each category** - Ensure bot loads all commands
3. **Use established patterns** - Follow bot.ts and meme.ts examples
4. **Preserve functionality** - Don't refactor logic, just convert syntax
5. **Permissive typing** - Use `any` and type assertions liberally

## Phase 4 Strategy: Commands by Category

### Recommended Conversion Order

Convert commands in groups by category. Start with smaller, simpler categories and work up to more complex ones.

#### 🎯 Priority 1: Small Categories (18 files - Easiest)

**1. Dev Commands (4 files - ~50-150 lines each)**

- `dev.js` - Developer utilities
- `premium.js` - Premium features
- `presence.js` - Bot presence management
- `zzz.js` - Test/debug command

**2. Info Commands (6 files - ~100-200 lines each)**

- `info.js` - Server/user info
- `leaderboard.js` - Leaderboard display
- `shared/*` (4 files) - Shared info utilities

**3. Social Commands (2 files - ~50-150 lines each)**

- `invites.js` - Invite tracking
- `reputation.js` - Reputation system

**4. Stats Commands (4 files - ~100-250 lines each)**

- `rank.js` - User rank display
- `stats.js` - Statistics overview
- `statstracking.js` - Stats tracking config
- `xp.js` - XP management

**5. Suggestions Commands (2 files - ~100-200 lines each)**

- `suggest.js` - Submit suggestions
- `suggestion.js` - Manage suggestions

#### 🎯 Priority 2: Medium Categories (34 files - Moderate)

**6. Economy Commands (8 files - ~100-300 lines each)**

- `bank.js`, `beg.js`, `daily.js`, `gamble.js`
- `sub/*` (4 files) - Economy subcommands

**7. Fun Commands (14 files - ~50-250 lines each)**

- `facts.js`, `filters.js`, `flip.js`, `generators.js`
- `hack.js`, `hangman.js`, `image.js`, `love.js`
- `overlay.js`, `react.js`, `tictactoe.js`, `tod.js`, `together.js`

**8. Utility Commands (12 files - ~100-300 lines each)**

- `afk.js`, `epicgames.js`, `github.js`, `paste.js`
- `pokedex.js`, `profile.js`, `proxies.js`, `qrcode.js`
- `redflag.js`, `report.js`, `urban.js`, `weather.js`

#### 🎯 Priority 3: Complex Categories (41 files - Advanced)

**9. Giveaways Commands (8 files - ~100-400 lines each)**

- `giveaway.js` - Main giveaway command
- `sub/*` (7 files) - Giveaway subcommands

**10. Music Commands (17 files - ~100-500 lines each)**

- Player controls: `play.js`, `pause.js`, `resume.js`, `stop.js`
- Queue management: `queue.js`, `skip.js`, `shuffle.js`
- Audio effects: `bassboost.js`, `volume.js`, `seek.js`
- Info: `np.js`, `lyric.js`, `search.js`
- Settings: `autoplay.js`, `loop.js`, `leave.js`

**11. Moderation Commands (16 files - ~100-400 lines each)**

- Actions: `ban.js`, `kick.js`, `softban.js`, `unban.js`
- Timeouts: `timeout.js`, `untimeout.js`
- Messages: `purge.js`, `message/*` (6 files)
- Warnings: `warn.js`, `warnings.js`
- Voice: `voice.js`
- Utility: `nick.js`

**12. Admin Commands (17 files - ~100-500 lines each)**

- Config: `settings.js`, `logs.js`, `maxwarn.js`
- Features: `autorole.js`, `counter.js`, `reactionrole.js`, `ticket.js`
- Messages: `say.js`, `embed.js`
- Modules: `automod/*` (3 files), `greeting/*` (2 files)

---

## Command Conversion Template

### Basic Command Structure (TypeScript)

```typescript
import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  // ... other imports
} from 'discord.js'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'commandname',
  description: 'Command description',
  category: 'CATEGORY', // ADMIN, FUN, INFO, MODERATION, etc.
  cooldown: 5, // Optional, defaults to 0
  botPermissions: ['SendMessages'], // Optional
  userPermissions: ['ManageMessages'], // Optional
  slashCommand: {
    enabled: true,
    ephemeral: false, // Optional
    options: [
      {
        name: 'option',
        description: 'Option description',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    // Command logic here
    // Use type assertions (as any) when needed for Discord.js types
    await interaction.followUp('Response')
  },
}

export default command
```

### Command with Subcommands Pattern

```typescript
import type { Command } from '@structures/Command'
import subcommandFunction from './sub/subfile'

const command: Command = {
  name: 'parent',
  description: 'Parent command',
  category: 'CATEGORY',
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'sub1',
        description: 'Subcommand 1',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'sub2',
        description: 'Subcommand 2',
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()

    if (sub === 'sub1') {
      // Handle sub1
    } else if (sub === 'sub2') {
      const response = subcommandFunction(interaction.client as any)
      return interaction.followUp(response)
    }
  },
}

export default command
```

---

## Conversion Guidelines

### ✅ DO:

- Convert `require()` → `import` statements
- Convert `module.exports` → `export default`
- Add `import type { Command } from '@structures/Command'`
- Type the command object: `const command: Command = { ... }`
- Add type to interactionRun: `async interactionRun(interaction: ChatInputCommandInteraction)`
- Use type assertions `as any` or `as BotClient` for complex Discord.js types
- Keep all existing logic, comments, and error handling
- Test after converting each category (`bun dev`)
- Remove old .js files after confirming .ts versions work

### ❌ DON'T:

- Refactor logic or change behavior
- Add strict type checking or complex type definitions
- Change file locations or import paths
- Remove existing comments or documentation
- Convert all at once - work in small batches
- Skip testing between conversions

---

## Testing Strategy

After converting each category:

1. **Start the bot:** `bun dev`
2. **Check logs:** Verify command count matches expected
3. **Test commands:** Try 1-2 commands from the category in Discord
4. **Check errors:** Look for any runtime TypeScript errors
5. **Commit changes:** Once category is working

### Expected Output

```bash
[2025-11-10 07:11:50] INFO: Loaded 87 slash commands  # Should stay same or increase
[2025-11-10 07:11:50] INFO: Loading commands...
# All commands should load successfully
```

---

## Common Patterns in Commands

### Import Conversions

```javascript
// OLD (JavaScript)
const { EmbedBuilder } = require('discord.js')
const { EMBED_COLORS } = require('@src/config.js')
const helper = require('./sub/helper')

// NEW (TypeScript)
import { EmbedBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import helper from './sub/helper'
import type { Command } from '@structures/Command'
```

### Export Conversions

```javascript
// OLD (JavaScript)
module.exports = {
  name: 'test',
  // ...
}

// NEW (TypeScript)
const command: Command = {
  name: 'test',
  // ...
}

export default command
```

### Type Assertions for Client

```typescript
// When accessing custom BotClient methods
import type { BotClient } from '@structures/BotClient'

async interactionRun(interaction: ChatInputCommandInteraction) {
  const client = interaction.client as BotClient
  const config = client.config // Now has proper types
}
```

### Handling Discord.js Partials

```typescript
// Use type assertions for partial types
const member = interaction.member as GuildMember
const guild = interaction.guild as Guild
```

---

## Progress Tracking

Update `TODO.md` after each category:

- Mark converted files with `[x]`
- Update file counts in progress table
- Add note about any issues or special cases
- Update "Next Target" section

---

## Next Steps

1. **Start with Dev Commands (4 files)** - Smallest category, good warmup
2. **Move to Info Commands (6 files)** - Simple display commands
3. **Continue through Priority 1** - Build momentum with easy wins
4. **Tackle Priority 2** - More complex but manageable
5. **Finish with Priority 3** - Most complex categories last

**Goal:** Complete Phase 4 and achieve ~100% TypeScript migration! 🎯

- Use non-null assertions (`value!`) - use null checks instead**Then Message Events (3 files - ~150-300 lines each):**

## Common Event File Patterns8. `src/events/message/messageCreate.js` - Processes new messages

9. `src/events/message/messageUpdate.js` - Handles message edits

**Typical Event Structure:**10. `src/events/message/messageDelete.js` - Handles message deletions

```typescript

import { Client, Guild } from 'discord.js'**Then Player Events (5 files - ~50-150 lines each):**

import type BotClient from '@structures/BotClient'

11. `src/events/player/trackStart.js` - Music track starts

export default async (client: Client, guild: Guild) => {12. `src/events/player/trackEnd.js` - Music track ends

  // Cast client if needed to access custom properties13. `src/events/player/playerDisconnect.js` - Player disconnects

  const botClient = client as BotClient14. `src/events/player/playerDestroy.js` - Player destroyed

  15. `src/events/player/queueEnd.js` - Queue finished

  // Event logic here

}**Finally Reaction Events (2 files - ~50-150 lines each):**

```

16. `src/events/reaction/messageReactionAdd.js` - Reaction added

**Key Typing Tips for Events:**17. `src/events/reaction/messageReactionRemove.js` - Reaction removed

- Guild events: `(client: Client, guild: Guild) => void`

- Member events: `(client: Client, member: GuildMember) => void`## Conversion Guidelines

- Message events: `(client: Client, message: Message) => void`

- Player events: Check existing player.ts handler for Lavalink types**✅ DO:**

- Reaction events: `(client: Client, reaction: MessageReaction, user: User) => void`

- Voice events: `(client: Client, oldState: VoiceState, newState: VoiceState) => void`- Convert `require`/`module.exports` → `import`/`export` or `export default`

- Add basic type annotations for parameters & return types

**Handler Integration:**- Use `any` liberally for complex Discord.js types

- Events often call handler functions (greeting, stats, invite, etc.)- Cast problematic types with `as any` when needed

- Import handlers with: `import handlerName from '@handlers/handlerName'`- Test after each conversion (`bun dev`)

- Handlers now have proper TypeScript types from Phase 2- Use `export default` pattern for event files (matches existing TS events)

## Testing Workflow**❌ DON'T:**

1. **Convert** the event file to TypeScript- Refactor logic or change behavior

2. **Type check** - `bun typecheck` (warnings OK, focus on errors)- Enable strict types or add complex definitions

3. **Delete** the old .js file- Change file locations or break import paths

4. **Start** - `bun dev` (should start normally with all 23 events)- Remove existing comments/documentation

5. **Test features:**- Use non-null assertions (`value!`) - use null checks instead
   - Guild events: Join/leave a test server

   - Member events: Test member join/leave with greeting system## Common Event File Patterns

   - Message events: Send messages, test automod/stats tracking

   - Player events: Play music, test track transitions**Typical Event Structure:**

   - Reaction events: Test reaction roles

6. **Verify:** Bot runs, events fire correctly, handlers integrate properly```typescript

import { Client, Guild } from 'discord.js'

## Quick Referenceimport type BotClient from '@structures/BotClient'

**Current Status:** 105/374 files (28.1%) - Phase 2 Complete! export default async (client: Client, guild: Guild) => {

**Phase 3 Target:** 19 event files (guild, invite, member, message, player, reaction) // Cast client if needed to access custom properties

**Next Files:** Start with Guild events (guildCreate.js, guildDelete.js) const botClient = client as BotClient

**Approach:** ES6 imports, `export default`, basic types, preserve logic, test each batch

**Success:** Bot runs, all 23 events load, features work, no runtime errors // Event logic here

}

**Key Patterns from Phase 2:**```

- Use `(type as any)` for complex Discord.js types

- Cast `client as BotClient` for custom properties**Key Typing Tips for Events:**

- Import handlers with proper TypeScript paths

- Use `export default` for event exports- Guild events: `(client: Client, guild: Guild) => void`

- Test incrementally after each batch- Member events: `(client: Client, member: GuildMember) => void`

- Message events: `(client: Client, message: Message) => void`
- Player events: Check existing player.ts handler for Lavalink types
- Reaction events: `(client: Client, reaction: MessageReaction, user: User) => void`
- Voice events: `(client: Client, oldState: VoiceState, newState: VoiceState) => void`

**Handler Integration:**

- Events often call handler functions (greeting, stats, invite, etc.)
- Import handlers with: `import handlerName from '@handlers/handlerName'`
- Handlers now have proper TypeScript types from Phase 2

## Testing Workflow

1. **Convert** the event file to TypeScript
2. **Type check** - `bun typecheck` (warnings OK, focus on errors)
3. **Delete** the old .js file
4. **Start** - `bun dev` (should start normally with all 23 events)
5. **Test features:**
   - Guild events: Join/leave a test server
   - Member events: Test member join/leave with greeting system
   - Message events: Send messages, test automod/stats tracking
   - Player events: Play music, test track transitions
   - Reaction events: Test reaction roles
6. **Verify:** Bot runs, events fire correctly, handlers integrate properly

## Quick Reference

**Current Status:** 105/374 files (28.1%) - Phase 2 Complete!  
**Phase 3 Target:** 19 event files (guild, invite, member, message, player, reaction)  
**Next Files:** Start with Guild events (guildCreate.js, guildDelete.js)  
**Approach:** ES6 imports, `export default`, basic types, preserve logic, test each batch  
**Success:** Bot runs, all 23 events load, features work, no runtime errors

**Key Patterns from Phase 2:**

- Use `(type as any)` for complex Discord.js types
- Cast `client as BotClient` for custom properties
- Import handlers with proper TypeScript paths
- Use `export default` for event exports
- Test incrementally after each batch
