# TypeScript Migration Brief - Phase 4: Commands

## 🎯 Purpose of This Document

**BRIEF.md is your quick-start guide for converting the next batch of commands.**

- **Not a progress tracker** → See TODO.md for detailed progress
- **Not a historical record** → See TODO.md for completed phases
- **Focus:** What to convert next + How to do it

---

## 📍 Current Status (Reference Only)

**Migration Status:** 159/374 files (42.5%) | Phase 4: Commands - 30/214 (14%)

**For detailed progress breakdown, see TODO.md**

---

## 🚀 What You're Converting Next

### Immediate Next Steps: Small Categories First

Convert commands in order of size (smallest to largest for momentum):

**1. Social Commands (2 files) - ~50-150 lines each**

- `invites.js` - Invite tracking
- `reputation.js` - Reputation system

**2. Suggestions Commands (2 files) - ~100-200 lines each**

- `suggest.js` - Submit suggestions
- `suggestion.js` - Manage suggestions

**3. Stats Commands (4 files) - ~100-250 lines each**

- `rank.js`, `stats.js`, `statstracking.js`, `xp.js`

**4. Info Commands (6 files) - ~100-200 lines each**

- `info.js`, `leaderboard.js`, `shared/*` (4 files)

**5. Moderation (5 remaining files)**

- Complete the remaining moderation utilities

**Later: Larger Categories**

- Economy (8 files)
- Fun (13 files)
- Utility (12 files)
- Giveaways (8 files)
- Music (17 files)

---

## 🏗️ Why We're Doing This

- **Bun native TS** - No build step, runs .ts directly
- **Gradual migration** - Bot stays running, JS and TS coexist
- **Better DX** - Type hints, autocomplete, catch bugs early
- **Future-proof** - Modern codebase with optional type safety

---

## 📐 Conversion Patterns

### Pattern 1: Simple Command (< 150 lines)

```typescript
import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'commandname',
  description: 'Command description',
  category: 'CATEGORY', // ADMIN, FUN, INFO, MODERATION, etc.
  cooldown: 5,
  botPermissions: ['SendMessages'],
  userPermissions: ['ManageMessages'],
  slashCommand: {
    enabled: true,
    ephemeral: false,
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
    await interaction.followUp('Response')
  },
}

export default command
```

### Pattern 2: Command with Subcommands

```typescript
import type { Command } from '@structures/Command'
import { ApplicationCommandOptionType } from 'discord.js'
import subHandler from './sub/subfile'

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
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()

    if (sub === 'sub1') {
      // Handle inline
    } else if (sub === 'sub2') {
      const response = subHandler(interaction.client as any)
      return interaction.followUp(response)
    }
  },
}

export default command
```

### Pattern 3: Accessing Custom Client Properties

```typescript
import type { BotClient } from '@structures/BotClient'

async interactionRun(interaction: ChatInputCommandInteraction) {
  const client = interaction.client as BotClient
  const config = client.config // Now typed correctly
}
```

---

## 📝 Conversion Checklist

### ✅ DO

- [ ] Convert `require()` → `import`
- [ ] Convert `module.exports` → `export default`
- [ ] Add `import type { Command } from '@structures/Command'`
- [ ] Type command: `const command: Command = { ... }`
- [ ] Type interactionRun: `async interactionRun(interaction: ChatInputCommandInteraction)`
- [ ] Use `as any` or `as BotClient` for complex types
- [ ] Keep all logic, comments, and error handling
- [ ] Test after each category: `bun dev`
- [ ] Delete old .js file after .ts works

### ❌ DON'T

- [ ] ~~Refactor logic or change behavior~~
- [ ] ~~Add strict typing or complex types~~
- [ ] ~~Change file locations or paths~~
- [ ] ~~Remove comments or documentation~~
- [ ] ~~Convert everything at once~~
- [ ] ~~Skip testing between batches~~

---

## 🧪 Testing Workflow

After converting each category:

1. **Start bot:** `bun dev`
2. **Check logs:** Verify command count
   ```
   [INFO] Loaded 87 slash commands  # Should match expected
   ```
3. **Test commands:** Try 1-2 commands from category in Discord
4. **Check errors:** Look for runtime TypeScript errors
5. **Commit:** Once category works

---

## 🔧 Common Conversions

### Import/Export Transform

```javascript
// OLD (JavaScript)
const { EmbedBuilder } = require('discord.js')
const { EMBED_COLORS } = require('@src/config.js')
const helper = require('./sub/helper')

module.exports = {
  name: 'test',
  // ...
}

// NEW (TypeScript)
import { EmbedBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import helper from './sub/helper'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'test',
  // ...
}

export default command
```

### Type Assertions

```typescript
// For partial types
const member = interaction.member as GuildMember
const guild = interaction.guild as Guild

// For custom client
const client = interaction.client as BotClient
```

---

## 🎓 Quick Reference

**tsconfig.json:** Permissive (`strict: false`, `allowJs: true`)  
**Type checking:** `bun typecheck` (optional, doesn't block execution)  
**Running:** `bun dev` (runs .js and .ts files together)  
**Philosophy:** Preserve functionality, add types gradually  
**When stuck:** Use `as any` and move forward

---

## 📚 Category Details

### Command Categories by Size

**Extra Small (2-4 files):**

- Social (2 files)
- Suggestions (2 files)

**Small (4-6 files):**

- Stats (4 files)
- Moderation remaining (5 files)
- Info (6 files)

**Medium (8-13 files):**

- Economy (8 files)
- Giveaways (8 files)
- Utility (12 files)
- Fun (13 files)

**Large (17 files):**

- Music (17 files) - Save for last

---

## 🎯 Success Criteria

**For each category:**

- ✅ All .js files converted to .ts
- ✅ Bot starts without errors
- ✅ Command count matches expected
- ✅ Commands work in Discord
- ✅ Old .js files deleted

**Overall Phase 4 Goal:**

- Convert all 214 command files
- Achieve 100% TypeScript migration
- Maintain zero downtime

---

## 🔗 Related Documentation

- **TODO.md** - Detailed progress tracking, phase history, feature roadmap
- **tsconfig.json** - TypeScript configuration
- **src/structures/Command.ts** - Command type definition

---

## 💡 Tips for Success

1. **Work in small batches** - 2-6 files at a time
2. **Test frequently** - Don't accumulate untested changes
3. **Use existing examples** - Reference bot.ts, meme.ts, admin commands
4. **When in doubt, cast** - `as any` is your friend
5. **Don't overthink** - This is syntax conversion, not refactoring
6. **Commit often** - Each working category should be a commit

---

**Next Action:** Convert Social commands (invites.js, reputation.js) → Test → Move to Suggestions
