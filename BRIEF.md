# TypeScript Migration Brief for Copilot

## Context

We are **gradually migrating** the Amina Discord bot from JavaScript to
TypeScript without breaking the existing codebase. The bot runs on **Bun**,
which natively supports TypeScript alongside JavaScript files.

> **📋 Note:** This BRIEF.md focuses on the **NEXT phase** of work. For the complete
> status and migration plan, see `TODO.md`.

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

## Progress Update - Phase 2: 80% COMPLETE! 🎉

### ✅ Major Milestones Achieved (94 files / 25.1%)

**Phase 1 & 2 Progress:**

- ✅ **All Infrastructure** - Structures (5/5), Helpers (11/12), Config, Services
- ✅ **Database Complete** - All schemas + mongoose (10/10) ⭐
- ✅ **Contexts Complete** - Avatar context (1/1) ⭐
- ✅ **Half of Handlers** - 10/19 converted (53%) ⭐
- ✅ **Core Events** - 5/25 converted (clientReady, error, raw, warn, interactions) ⭐

**Recent Conversions:**

- Database: mongoose.ts + all 9 schemas ✅
- Handlers: manager.ts, reactionRoles.ts, counter.ts, presence.ts, player.ts, context.ts ✅
- Helpers: Guild.ts, Message.ts, GuildChannel.ts extenders ✅
- Events: clientReady.ts, error.ts, raw.ts, warn.ts ✅

**Progress: 94/374 files (25.1%) - Quarter milestone reached!**

---

### 📦 Phase 2 - Final 9 Handlers

**🎯 Remaining: 9 medium-to-large handlers (124-426 lines each)**

**🟡 Medium Handlers (4 files - 124-179 lines):**

- `src/handlers/stats.js` (124 lines) - Stats tracking
- `src/handlers/greeting.js` (135 lines) - Welcome/leave messages
- `src/handlers/invite.js` (172 lines) - Invite tracking
- `src/handlers/tod.js` (179 lines) - Truth or Dare

**🟠 Large Handlers (6 files - 234-426 lines):**

- `src/handlers/profile.js` (234 lines) - User profiles
- `src/handlers/guild.js` (239 lines) - Guild management
- `src/handlers/automod.js` (245 lines) - Automod system
- `src/handlers/ticket.js` (380 lines) - Ticket system
- `src/handlers/report.js` (424 lines) - Report system
- `src/handlers/suggestion.js` (426 lines) - Suggestion system

## Next Step: Convert Medium Handlers (2-3 files)

### Recommended Batch: `stats.js` + `greeting.js` (259 lines total)

**1. `src/handlers/stats.js` (124 lines)**

- Purpose: XP/stats tracking system
- Likely exports: functions for XP calculation, level-up logic
- Used by: message events, stats commands

**2. `src/handlers/greeting.js` (135 lines)**

- Purpose: Welcome/farewell message system
- Likely exports: functions for sending greetings
- Used by: member join/leave events

## Conversion Guidelines

**✅ DO:**

- Convert `require`/`module.exports` → `import`/`export`
- Add basic type annotations (params & return types)
- Use `any` liberally for complex types
- Test after each conversion (`bun dev`)

**❌ DON'T:**

- Refactor logic or change behavior
- Enable strict types or add complex definitions
- Change file locations or break import paths
- Remove existing comments/documentation

## Testing Workflow

1. **Convert** the file to TypeScript
2. **Type check** - `bun typecheck` (warnings OK)
3. **Delete** the old .js file
4. **Start** - `bun dev` (should start normally)
5. **Test features:**
   - `reactionRoles.ts`: Test reaction role add/remove functionality
   - `manager.ts`: Test music commands (`/play`, `/queue`, player controls)
6. **Verify:** No import errors in consuming files (`BotClient.ts`, `events/reaction/*.js`)

## Quick Reference

**Current Status:** 94/374 files (25.1%) - Phase 2 is 80% complete!  
**Next Target:** `stats.js` (124 lines) + `greeting.js` (135 lines) = 259 lines  
**Why:** Medium complexity, well-defined scope, complete Phase 2 handlers  
**Approach:** ES6 syntax + basic types + `any` where needed + preserve logic  
**Success:** Bot runs, stats/greeting features work, no import errors, type check passes
