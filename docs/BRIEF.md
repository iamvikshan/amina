# TypeScript Migration Brief - Commands Conversion Guide

## 🎯 Purpose of This Document

**BRIEF.md is your planning and conversion guide for converting JavaScript commands to TypeScript.**

- **Focus:** What to convert next + How to do it
- **Not a progress tracker** → See TODO.md for detailed progress
- **Not a historical record** → See TODO.md for completed phases

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
import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js'
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
      const response = await subHandler(interaction.member as GuildMember, ...args)
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
  const logger = client.logger
  const giveawaysManager = client.giveawaysManager // Use 'as any' for external libraries
}
```

### Pattern 4: Helper Functions (Sub-commands)

```typescript
import { GuildMember } from 'discord.js'

export default async function helperFunction(
  member: GuildMember,
  param1: string,
  param2?: number
): Promise<string> {
  // Function logic
  return 'Response string'
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
- [ ] Type helper function parameters (GuildMember, string, number, etc.)
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
const channel = interaction.channel as TextChannel

// For custom client
const client = interaction.client as BotClient

// For external libraries (discord-giveaways, etc.)
const manager = (member.client as any).giveawaysManager
const giveaway = manager.giveaways.find((g: any) => g.messageId === id)
```

### Error Handling

```typescript
try {
  // Code
} catch (error: any) {
  ;(interaction.client as any).logger.error('Command Name', error)
  return interaction.followUp(`Error: ${error.message}`)
}
```

---

## 📚 Category Details

### Command Categories Status

**✅ All Completed Categories:**

- ✅ Admin (17 files)
- ✅ Bot (2 files)
- ✅ Dev (4 files)
- ✅ Economy (8 files)
- ✅ Fun (13 files)
- ✅ Giveaways (8 files)
- ✅ Moderation (17 files)
- ✅ Info (6 files)
- ✅ Social (2 files)
- ✅ Stats (4 files)
- ✅ Suggestions (2 files)
- ✅ Utility (10 files)

**🔄 Remaining Category:**

- Music (16 files) - Most complex, save for last

---

## 🎯 Conversion Status

**✅ All command categories completed except Music!**

**Remaining:**
- **Music Commands (16 files)** - Most complex category, involves Lavalink integration, queue management, and audio filters
  - Files: autoplay, bassboost, leave, loop, lyric, np, pause, play, queue, resume, search, seek, shuffle, skip, stop, volume
  - Complexity: High - involves external library types (discord-player), audio filters, queue management, and complex state handling
  - Recommendation: Convert in batches of 3-4 files, test thoroughly after each batch

---

## 🎓 Quick Reference

**tsconfig.json:** Permissive (`strict: false`, `allowJs: true`)  
**Type checking:** `bun typecheck` (optional, doesn't block execution)  
**Running:** `bun dev` (runs .js and .ts files together)  
**Philosophy:** Preserve functionality, add types gradually  
**When stuck:** Use `as any` and move forward

---

## 🔗 Related Documentation

- **TODO.md** - Detailed progress tracking, phase history, feature roadmap
- **tsconfig.json** - TypeScript configuration
- **src/structures/Command.ts** - Command type definition
- **types/global.d.ts** - Global type definitions

---

## 💡 Tips for Success

1. **Work in small batches** - 2-6 files at a time
2. **Test frequently** - Don't accumulate untested changes
3. **Use existing examples** - Reference converted commands in economy/, fun/, giveaways/
4. **When in doubt, cast** - `as any` is your friend
5. **Don't overthink** - This is syntax conversion, not refactoring
6. **Commit often** - Each working category should be a commit
7. **Fix bugs as you find them** - But don't refactor unnecessarily

---

## 🐛 Common Issues & Solutions

### Issue: External Library Types

**Solution:** Use `as any` for external libraries like `discord-giveaways`, `discord-gamecord`, etc.

```typescript
const manager = (client as any).giveawaysManager
const giveaway = manager.giveaways.find((g: any) => g.messageId === id)
```

### Issue: Optional Parameters

**Solution:** Use TypeScript optional syntax `param?: Type` or `param: Type | null`

```typescript
export default async function edit(
  member: GuildMember,
  messageId: string,
  addDuration: number | null,
  newPrize: string | null
): Promise<string> {
  // Handle nulls
}
```

### Issue: Modal/Button Interactions

**Solution:** Type interactions properly and handle nulls

```typescript
const member = interaction.member as GuildMember
const channel = interaction.channel as TextChannel
const guild = interaction.guild as Guild

if (!member || !channel || !guild) {
  return interaction.followUp('Missing required information!')
}
```

---

## 🎵 Music Commands - Special Considerations

Music commands are the most complex category due to:

1. **External Library Types** - `discord-player` library requires extensive use of `as any` for types
2. **Queue Management** - Complex state handling for music queues
3. **Audio Filters** - Bass boost, filters, and audio processing
4. **Lavalink Integration** - Connection handling and player management
5. **Error Handling** - Network issues, player disconnections, queue errors

### Recommended Approach:

1. **Start with simple commands** - `pause`, `resume`, `skip`, `leave` (4 files)
2. **Then core functionality** - `play`, `queue`, `np`, `search` (4 files)
3. **Then advanced features** - `loop`, `shuffle`, `seek`, `volume` (4 files)
4. **Finally complex features** - `autoplay`, `bassboost`, `lyric`, `stop` (4 files)

**Next Action:** Convert Music commands starting with simple ones (pause, resume, skip, leave) → Test → Continue with core functionality
