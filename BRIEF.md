# TypeScript Migration Brief for Copilot# TypeScript Migration Brief for Copilot

## Context## Context

We are **gradually migrating** the Amina Discord bot from JavaScript toWe are **gradually migrating** the Amina Discord bot from JavaScript to

TypeScript without breaking the existing codebase. The bot runs on **Bun**,TypeScript without breaking the existing codebase. The bot runs on **Bun**,

which natively supports TypeScript alongside JavaScript files.which natively supports TypeScript alongside JavaScript files.

> **📋 Note:** This BRIEF.md focuses on the **NEXT phase** of work. For the complete> **📋 Note:** This BRIEF.md focuses on the **NEXT phase** of work. For the complete

> status and migration plan, see `TODO.md`.> status and migration plan, see `TODO.md`.

## Why We're Doing This## Why We're Doing This

- **Bun's native TS support** - No transpilation needed, runs .ts files directly- **Bun's native TS support** - No transpilation needed, runs .ts files directly

- **Better type safety** - Catch bugs earlier with gradual typing- **Better type safety** - Catch bugs earlier with gradual typing

- **Improved DX** - Better IDE autocomplete and IntelliSense- **Improved DX** - Better IDE autocomplete and IntelliSense

- **Future-proof** - Modern JavaScript/TypeScript features- **Future-proof** - Modern JavaScript/TypeScript features

- **Zero downtime** - Bot continues running during migration- **Zero downtime** - Bot continues running during migration

## How We're Approaching It## How We're Approaching It

### Configuration Strategy### Configuration Strategy

- **Very permissive `tsconfig.json`** with `strict: false` and `allowJs: true`- **Very permissive `tsconfig.json`** with `strict: false` and `allowJs: true`

- Mixed .js and .ts files can coexist and import each other- Mixed .js and .ts files can coexist and import each other

- No breaking changes - existing JavaScript continues to work- No breaking changes - existing JavaScript continues to work

- Type checking is optional (`bun typecheck`) and doesn't block execution- Type checking is optional (`bun typecheck`) and doesn't block execution

### Migration Philosophy### Migration Philosophy

1. **Small bites** - Convert 1-3 small files at a time1. **Small bites** - Convert 1-3 small files at a time

2. **Test after each step** - Ensure bot still runs2. **Test after each step** - Ensure bot still runs

3. **Low risk first** - Start with utilities, not core classes3. **Low risk first** - Start with utilities, not core classes

4. **Preserve functionality** - Don't refactor logic, just convert syntax4. **Preserve functionality** - Don't refactor logic, just convert syntax

5. **Gradual typing** - Use `any` liberally at first, refine later5. **Gradual typing** - Use `any` liberally at first, refine later

## Progress Update - Phase 2: ✅ COMPLETE! 🎉# TypeScript Migration Brief for Copilot

### ✅ Phase 2 Finished! (105/374 files - 28.1%)## Context

**All Handlers Converted:**We are **gradually migrating** the Amina Discord bot from JavaScript to

TypeScript without breaking the existing codebase. The bot runs on **Bun**,

- ✅ **All 19 Handlers Complete** - stats, greeting, invite, tod, profile, guild, automod, ticket, report, suggestion (100%)which natively supports TypeScript alongside JavaScript files.

- ✅ **Infrastructure Complete** - Structures (5/5), Helpers (11/12), Config, Services

- ✅ **Database Complete** - All schemas + mongoose (10/10)> **📋 Note:** This BRIEF.md focuses on the **NEXT phase** of work. For the complete

- ✅ **Contexts Complete** - Avatar context (1/1)> status and migration plan, see `TODO.md`.

- ✅ **6 Events Converted** - clientReady, error, raw, warn, interactionCreate, voiceStateUpdate

## Why We're Doing This

**Progress: 105/374 files (28.1%) - Moving to Phase 3: Events!**

- **Bun's native TS support** - No transpilation needed, runs .ts files directly

---- **Better type safety** - Catch bugs earlier with gradual typing

- **Improved DX** - Better IDE autocomplete and IntelliSense

### 📦 Phase 3 - Events Conversion (6/25 done - 24%)- **Future-proof** - Modern JavaScript/TypeScript features

- **Zero downtime** - Bot continues running during migration

**🎯 Focus: Convert all 19 remaining event files**

## How We're Approaching It

**Categories:**

### Configuration Strategy

- ✅ **Core Events (4/4)** - clientReady, error, raw, warn

- ✅ **Interaction Events (1/1)** - interactionCreate- **Very permissive `tsconfig.json`** with `strict: false` and `allowJs: true`

- ✅ **Voice Events (1/1)** - voiceStateUpdate- Mixed .js and .ts files can coexist and import each other

- 🔄 **Guild Events (0/2)** - guildCreate, guildDelete- No breaking changes - existing JavaScript continues to work

- 🔄 **Invite Events (0/2)** - inviteCreate, inviteDelete- Type checking is optional (`bun typecheck`) and doesn't block execution

- 🔄 **Member Events (0/3)** - guildMemberAdd, guildMemberRemove, rolesChange

- 🔄 **Message Events (0/3)** - messageCreate, messageUpdate, messageDelete### Migration Philosophy

- 🔄 **Player Events (0/5)** - trackStart, trackEnd, playerDisconnect, playerDestroy, queueEnd

- 🔄 **Reaction Events (0/2)** - messageReactionAdd, messageReactionRemove1. **Small bites** - Convert 1-3 small files at a time

2. **Test after each step** - Ensure bot still runs

**Event files are typically small (50-200 lines) and straightforward to convert.**3. **Low risk first** - Start with utilities, not core classes

4. **Preserve functionality** - Don't refactor logic, just convert syntax

---5. **Gradual typing** - Use `any` liberally at first, refine later

## Next Step: Convert Event Files by Category## Progress Update - Phase 2: ✅ COMPLETE! 🎉

### Recommended Approach: Convert by event type (2-3 files per batch)### ✅ Phase 2 Finished! (105/374 files - 28.1%)

**Start with Guild Events (2 files - ~100-150 lines each):\*\***All Handlers Converted:\*\*

1. `src/events/guild/guildCreate.js` - Handles when bot joins a server- ✅ **All 19 Handlers Complete** - stats, greeting, invite, tod, profile, guild, automod, ticket, report, suggestion (100%)

2. `src/events/guild/guildDelete.js` - Handles when bot leaves a server- ✅ **Infrastructure Complete** - Structures (5/5), Helpers (11/12), Config, Services

- ✅ **Database Complete** - All schemas + mongoose (10/10)

**Then Invite Events (2 files - ~50-100 lines each):**- ✅ **Contexts Complete** - Avatar context (1/1)

- ✅ **6 Events Converted** - clientReady, error, raw, warn, interactionCreate, voiceStateUpdate

3. `src/events/invite/inviteCreate.js` - Tracks invite creation

4. `src/events/invite/inviteDelete.js` - Tracks invite deletion**Progress: 105/374 files (28.1%) - Moving to Phase 3: Events!**

**Then Member Events (3 files - ~100-200 lines each):**---

5. `src/events/member/guildMemberAdd.js` - Handles member joins### 📦 Phase 3 - Events Conversion (6/25 done - 24%)

6. `src/events/member/guildMemberRemove.js` - Handles member leaves

7. `src/events/member/rolesChange.js` - Tracks role changes**🎯 Focus: Convert all 19 remaining event files**

**Then Message Events (3 files - ~150-300 lines each):\*\***Categories:\*\*

8. `src/events/message/messageCreate.js` - Processes new messages- ✅ **Core Events (4/4)** - clientReady, error, raw, warn

9. `src/events/message/messageUpdate.js` - Handles message edits- ✅ **Interaction Events (1/1)** - interactionCreate

10. `src/events/message/messageDelete.js` - Handles message deletions- ✅ **Voice Events (1/1)** - voiceStateUpdate

- 🔄 **Guild Events (0/2)** - guildCreate, guildDelete

**Then Player Events (5 files - ~50-150 lines each):**- 🔄 **Invite Events (0/2)** - inviteCreate, inviteDelete

- 🔄 **Member Events (0/3)** - guildMemberAdd, guildMemberRemove, rolesChange

11. `src/events/player/trackStart.js` - Music track starts- 🔄 **Message Events (0/3)** - messageCreate, messageUpdate, messageDelete

12. `src/events/player/trackEnd.js` - Music track ends- 🔄 **Player Events (0/5)** - trackStart, trackEnd, playerDisconnect, playerDestroy, queueEnd

13. `src/events/player/playerDisconnect.js` - Player disconnects- 🔄 **Reaction Events (0/2)** - messageReactionAdd, messageReactionRemove

14. `src/events/player/playerDestroy.js` - Player destroyed

15. `src/events/player/queueEnd.js` - Queue finished**Event files are typically small (50-200 lines) and straightforward to convert.**

**Finally Reaction Events (2 files - ~50-150 lines each):**---

16. `src/events/reaction/messageReactionAdd.js` - Reaction added## Next Step: Convert Event Files by Category

17. `src/events/reaction/messageReactionRemove.js` - Reaction removed

### Recommended Approach: Convert by event type (2-3 files per batch)

## Conversion Guidelines

**Start with Guild Events (2 files - ~100-150 lines each):**

**✅ DO:**

1. `src/events/guild/guildCreate.js` - Handles when bot joins a server

- Convert `require`/`module.exports` → `import`/`export` or `export default`2. `src/events/guild/guildDelete.js` - Handles when bot leaves a server

- Add basic type annotations for parameters & return types

- Use `any` liberally for complex Discord.js types**Then Invite Events (2 files - ~50-100 lines each):**

- Cast problematic types with `as any` when needed

- Test after each conversion (`bun dev`)3. `src/events/invite/inviteCreate.js` - Tracks invite creation

- Use `export default` pattern for event files (matches existing TS events)4. `src/events/invite/inviteDelete.js` - Tracks invite deletion

**❌ DON'T:\*\***Then Member Events (3 files - ~100-200 lines each):\*\*

- Refactor logic or change behavior5. `src/events/member/guildMemberAdd.js` - Handles member joins

- Enable strict types or add complex definitions6. `src/events/member/guildMemberRemove.js` - Handles member leaves

- Change file locations or break import paths7. `src/events/member/rolesChange.js` - Tracks role changes

- Remove existing comments/documentation

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
