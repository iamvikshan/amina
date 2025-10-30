# Bun-Optimized TypeScript Setup 🚀

A comprehensive guide and example for migrating one JavaScript file to
TypeScript as a demonstration.

## Quick Start with Bun

```bash
# Install dependencies
bun install

# Start development server (with auto-reload)
bun dev

# Start production
bun start

# Type checking (optional, won't block execution)
bun typecheck

# Format code
bun f
```

## Example Migration: ping.ts

Let's migrate a simple command as an example. Create
`src/commands/utility/ping.ts`:

```typescript
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandData } from '@structures/Command'

/**
 * Simple ping command to demonstrate TypeScript migration
 */
const command: CommandData = {
  name: 'ping',
  description: 'Check bot and API latency',
  category: 'UTILITY',
  cooldown: 5,
  botPermissions: ['SendMessages'],
  slashCommand: {
    enabled: true,
    ephemeral: false,
  },
  async interactionRun(interaction: ChatInputCommandInteraction) {
    const start = Date.now()
    await interaction.followUp('🏓 Pinging...')
    const latency = Date.now() - start
    const apiLatency = interaction.client.ws.ping
    await interaction.editReply(
      `🏓 Pong!\n` +
        `📡 API Latency: ${apiLatency}ms\n` +
        `⚡ Bot Latency: ${latency}ms`
    )
  },
}

export default command
```

### Key Changes from JavaScript:

1.  **Import Statements**: Using `import` instead of `require()`
2.  **Type Annotations**: `CommandData` and `ChatInputCommandInteraction` types
3.  **Export**: Using `export default` instead of `module.exports`
4.  **Type Safety**: IDE now provides autocomplete and catches errors

### But It Still Works with JavaScript!

The bot can run with a mix of `.js` and `.ts` files. TypeScript is optional and
gradual.

## Migration Features

✅ **Permissive TypeScript**: Won't yell at you, code runs immediately ✅
**Gradual Migration**: Migrate one file at a time at your own pace ✅ **Bun
Native**: No transpilation needed, runs TypeScript directly ✅ **Path Aliases**:
Use `@helpers/*`, `@schemas/*`, etc. in both JS and TS ✅ **Type Definitions**:
Pre-built types for all structures ✅ **IDE Support**: Full autocomplete and
IntelliSense

## What Changed?

### New Files

- `tsconfig.json` - TypeScript configuration (very permissive)
- `types/global.d.ts` - Global type definitions
- `types/schemas.d.ts` - Database schema types
- `eslint.config.mjs` - Updated ESLint for TS support
- `MIGRATION.md` - Detailed migration guide

### Updated Files

- `package.json` - Added TypeScript, Bun types, updated scripts
- Scripts now use `bun` instead of `node`

### Unchanged

- All existing `.js` files still work!
- No breaking changes to your code
- Bot runs exactly the same way

## Type Checking

Type checking is **optional** and runs separately:

```bash
# Check types once
bun typecheck

# Watch mode - checks as you edit
bun typecheck:watch
```

Type errors **won't prevent the bot from running**. They're just helpful hints!

## Development Workflow

### Option 1: Keep JavaScript

Continue using `.js` files - everything works as before.

### Option 2: Add JSDoc Types

Add types via comments without changing to `.ts`:

```javascript
/**
 * @type {import('@structures/Command').CommandData}
 */
module.exports = {
  name: 'example',
  // ...
}
```

### Option 3: Convert to TypeScript

Rename `.js` to `.ts` and add proper types:

```typescript
import type { CommandData } from '@structures/Command'

const command: CommandData = {
  name: 'example',
  // ...
}

export default command
```

## Benefits of Bun

- ⚡ **3x faster** startup than Node.js
- 🔥 **Hot reload** built-in with `--watch`
- 📦 **Native TypeScript** - no compilation step
- 🚀 **Fast package manager** - replaces npm
- 💾 **Lower memory usage**

## File Structure

```
amina/
├── src/
│   ├── commands/   # Mix of .js and .ts files
│   ├── events/     # Mix of .js and .ts files
│   ├── handlers/   # Mix of .js and .ts files
│   ├── helpers/    # Mix of .js and .ts files
│   ├── structures/ # Mix of .js and .ts files
│   └── index.js    # Can be renamed to index.ts later
├── types/
│   ├── global.d.ts   # Global type definitions
│   └── schemas.d.ts  # Database types
├── tsconfig.json       # TypeScript config (loose)
├── eslint.config.mjs   # ESLint config (supports TS)
├── MIGRATION.md        # Detailed migration guide
└── package.json        # Updated with Bun + TS
```

## Available Types

Pre-defined types you can use immediately:

```typescript
// Command structure
import type { CommandData } from '@structures/Command'

// Context menus
import type { ContextData } from '@structures/BaseContext'

// Database schemas
import type { IGuildSettings } from '@schemas/Guild'
import type { IUser } from '@schemas/User'
import type { IMember } from '@schemas/Member'

// Config
import type { Config } from '@src/config'

// Discord.js types
import type {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Client,
  // ... many more
} from 'discord.js'
```

## Next Steps

1.  **Read**: Check `MIGRATION.md` for detailed guide
2.  **Try**: Convert one simple command to TypeScript
3.  **Test**: Run with `bun dev` - it should work!
4.  **Iterate**: Gradually convert more files as you edit them
5.  **Enjoy**: Better IDE support and type safety!

## Troubleshooting

### "Cannot find module" errors

- Make sure you're using `bun` not `node`
- Check path aliases in `tsconfig.json`

### Type errors but code works

- This is expected! Types are loose by default
- Add `// @ts-ignore` above the line if needed
- Or fix the types when you have time

### Bot won't start

- Try `bun start:node` as fallback
- Check if all dependencies installed: `bun install`
- Verify `.env` file is configured

## Resources

- 📖 [MIGRATION.md](./MIGRATION.md) - Detailed migration guide
- 🐰 [Bun Documentation](https://bun.sh/docs)
- 📘 [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- 🤖 [Discord.js Guide](https://discordjs.guide/)

## Questions?

The setup is designed to be **non-breaking** and **gradual**. Your existing code
will continue to work while you slowly add TypeScript where it makes sense!

