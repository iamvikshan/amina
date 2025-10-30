# Amina Discord Bot - TODO & Feature Roadmap

## 🎵 Music System - Feature Implementation Roadmap

### 🔴 High Priority Features

Implement these first - leverage existing Lavalink capabilities.

#### 1. Filter Commands (Uses existing enabled filters)

- [ ] **`/nightcore`** - Speed up + pitch up effect
- [ ] **`/vaporwave`** - Slow down + pitch down aesthetic effect
- [ ] **`/8d`** - 8D audio rotation effect
- [ ] **`/karaoke`** - Remove vocals for karaoke mode
- [ ] **`/tremolo`** - Trembling sound effect
- [ ] **`/vibrato`** - Vibrating pitch effect
- [ ] **`/distortion`** - Distorted sound effect
- [ ] **`/pitch`** - Adjust pitch without changing speed
- [ ] **`/speed`** - Adjust playback speed without pitch
- [ ] **`/filters`** - Show active filters & reset all

#### 2. Platform-Specific Search Commands

- [ ] **`/spotify <query>`** - Search & play from Spotify (spsearch)
- [ ] **`/deezer <query>`** - Search & play from Deezer (dzsearch)
- [ ] **`/applemusic <query>`** - Search & play from Apple Music (amsearch)
- [ ] **`/soundcloud <query>`** - Explicit SoundCloud search (scsearch)

#### 3. Enhanced Equalizer

- [ ] **`/equalizer`** - Full 15-band EQ control
- [ ] Add preset options: Flat, Bass, Treble, Vocal, Party, Soft
- [ ] Save custom user presets

#### 4. Advanced Queue Management

- [ ] **`/skipto <position>`** - Skip to specific queue position
- [ ] **`/remove <position>`** - Remove song from queue
- [ ] **`/move <from> <to>`** - Reorder queue songs
- [ ] **`/clearqueue`** - Clear queue but keep playing
- [ ] **`/previous`** - Play previous track from history
- [ ] **`/replay`** - Restart current song from beginning

### 🟡 Medium Priority Features

Implement after high priority features.

#### 5. Favorites & Playlist System

- [ ] **`/favorite add`** - Add current song to favorites
- [ ] **`/favorite list`** - Show user's favorite songs
- [ ] **`/favorite play`** - Play all favorites
- [ ] **`/favorite remove`** - Remove from favorites
- [ ] **`/playlist create <name>`** - Create custom playlist
- [ ] **`/playlist add <name>`** - Add song to playlist
- [ ] **`/playlist play <name>`** - Play playlist
- [ ] **`/playlist list`** - Show all playlists
- [ ] Create database schema for user playlists/favorites

#### 6. Radio Station Support

- [ ] **`/radio <station>`** - Play internet radio
- [ ] **`/radio list`** - Show available stations
- [ ] Add predefined station list (genre-based)
- [ ] Support for HTTP/HTTPS streams

#### 7. Enhanced Lyrics

- [ ] Improve `/lyrics` command
- [ ] Add synced lyrics with timing
- [ ] Auto-scroll lyrics as song plays
- [ ] Lyrics from multiple sources (Genius, Musixmatch)

#### 8. Filter Presets & Combinations

- [ ] **`/preset save <name>`** - Save current filter combo
- [ ] **`/preset load <name>`** - Load saved preset
- [ ] **`/preset list`** - Show available presets
- [ ] Add pre-built presets: Cinema, Concert, Club, Studio

#### 9. DJ Mode (Role-based Control)

- [ ] **`/dj enable`** - Enable DJ-only mode
- [ ] **`/dj role <role>`** - Set DJ role
- [ ] Only DJ role can control music when enabled
- [ ] Admin override capability

### 🟢 Low Priority Features

Nice to have - implement when time permits.

#### 10. SponsorBlock Integration

- [ ] Install `sponsorblock-plugin` for Lavalink
- [ ] Auto-skip sponsored segments
- [ ] Auto-skip intros/outros (configurable)
- [ ] User toggleable settings

#### 11. Text-to-Speech

- [ ] **`/tts <text>`** - Text-to-speech in voice
- [ ] Multiple language support
- [ ] Voice selection options
- [ ] Requires TTS plugin installation

#### 12. Music Statistics

- [ ] **`/stats user [@user]`** - User listening stats
- [ ] **`/stats server`** - Server music stats
- [ ] Track most played songs
- [ ] Listening time tracking
- [ ] Leaderboards

#### 13. Custom Soundboard

- [ ] **`/soundboard add <name> <url>`** - Add sound
- [ ] **`/soundboard play <name>`** - Play sound effect
- [ ] **`/soundboard list`** - Show available sounds
- [ ] Per-server soundboard management

---

## 🔧 Lavalink Configuration Enhancements

### A. ⚠️ URGENT - Replace Deprecated YouTube Source

**Status**: Deprecation warning in logs

**Action Required**: Switch to one of these alternatives:
- `youtube-source` - Modern replacement
- `youtubemusicsearch` - Music-focused
- `soundcloud` - Alternative platform

**Timeline**: Update before YouTube plugin breaks

### B. Current Lavalink Plugins Status

- ✅ **LavaSearch** - Ready
- ✅ **Duncte Bot Filters** - Ready (for /nightcore, /vaporwave, etc.)
- ⚠️ **YouTube Plugin** - Deprecated
- ❓ **SponsorBlock** - Not installed (needed for feature #10)
- ❓ **TTS Plugin** - Not installed (needed for feature #11)

---

# TypeScript Migration Guide for Bun

## Overview

We've set up a **very permissive** TypeScript configuration that allows you to gradually migrate from JavaScript to TypeScript without breaking the build. The code can run immediately with both `.js` and `.ts` files.

## Why TypeScript with Bun?

1. **Native TypeScript Support**: Bun runs TypeScript natively without transpilation
2. **Better Performance**: Bun is significantly faster than Node.js
3. **Type Safety**: Gradually add type safety to catch bugs earlier
4. **Better IDE Support**: Enhanced autocomplete and IntelliSense
5. **Future-Proof**: Modern JavaScript/TypeScript features

## Current Setup

### Configuration Files

- **`tsconfig.json`**: Very loose TypeScript configuration
  - `allowJs: true` - JavaScript files are allowed
  - `checkJs: false` - No type checking on JS files
  - `strict: false` - All strict checks disabled
  - `noEmit: true` - No compilation, Bun runs TS directly
  - `skipLibCheck: true` - Skip type checking of declaration files
- **`types/`**: Ambient type declarations
  - `global.d.ts` - Types for structures, config, helpers
  - `schemas.d.ts` - Types for Mongoose schemas

### Updated Scripts

```bash
# Development with auto-reload
bun dev

# Production start
bun start

# Type checking (optional, doesn't block execution)
bun typecheck

# Watch mode for type checking
bun typecheck:watch

# Legacy Node.js start
bun start:node
```

## Migration Strategy

### Phase 1: Setup (✅ Complete)

- [x] Create loose `tsconfig.json`
- [x] Add Bun types and TypeScript dependencies
- [x] Create ambient type declarations
- [x] Update scripts to use Bun

### Phase 2: Gradual File Migration (In Progress)

You can migrate files **one at a time** without breaking anything:

#### Option A: Rename `.js` to `.ts`

Simply rename a file from `.js` to `.ts`:

```bash
mv src/commands/fun/meme.js src/commands/fun/meme.ts
```

The code will work immediately! TypeScript won't complain because of our loose configuration.

#### Option B: Add JSDoc Types (Recommended for gradual migration)

Keep files as `.js` but add JSDoc comments for types:

```javascript
/**
 * @type {import('@structures/Command').CommandData}
 */
module.exports = {
  name: 'ping',
  description: 'Check bot latency',
  // ...
}
```

#### Option C: Convert to TypeScript Gradually

Convert a file to TypeScript with proper types:

```typescript
import { CommandData } from '@structures/Command'
import { ChatInputCommandInteraction } from 'discord.js'

const command: CommandData = {
  name: 'ping',
  description: 'Check bot latency',
  category: 'UTILITY',
  cooldown: 5,
  slashCommand: {
    enabled: true,
  },
  async interactionRun(interaction: ChatInputCommandInteraction) {
    await interaction.followUp(`🏓 Pong! ${interaction.client.ws.ping}ms`)
  },
}

export default command
```

### Phase 3: Incremental Type Safety

As you migrate more files, you can gradually enable stricter checks:

1. Start with files that are easiest to type (utilities, helpers)
2. Move to command handlers
3. Finally migrate complex files (BotClient, handlers)

When ready, you can enable stricter checks **per-file** using:

```typescript
// @ts-check
// At the top of a JS file to enable type checking

// or

// At the top of a TS file for strict mode
'use strict'
```

### Phase 4: Enable Strict Mode (Future)

Once most files are migrated, gradually enable strict checks in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
    // Enable one at a time and fix errors
  }
}
```

## File Migration Priority

Recommended order for migration:

1. **Utilities** (`src/helpers/`) - Usually type-safe already
2. **Schemas** (`src/database/schemas/`) - Well-defined structures
3. **Simple Commands** - Commands with straightforward logic
4. **Event Handlers** - Defined by Discord.js types
5. **Complex Commands** - Commands with subcommands
6. **Core Classes** (`src/structures/`) - Most critical, migrate last

## Best Practices

### DO ✅

- Migrate files incrementally, one at a time
- Test after each migration
- Use `bun typecheck` to find issues (but don't block on them)
- Add types gradually as you understand the code better
- Use `any` type liberally at first, refine later
- Keep the bot running while migrating

### DON'T ❌

- Try to migrate everything at once
- Enable strict mode immediately
- Block on type errors if the code works
- Remove JSDoc comments (they help with types)
- Change working logic just to satisfy TypeScript

## Type Checking

### Manual Type Check

```bash
# Check all files for type errors
bun typecheck

# Watch mode - checks as you edit
bun typecheck:watch
```

Type errors won't prevent the bot from running since `noEmit: true` is set.

### IDE Integration

Your IDE (VS Code) will show type hints and errors automatically. You can:

- Hover over variables to see inferred types
- Get autocomplete for Discord.js objects
- See function signatures
- Find unused variables

## Bun-Specific Optimizations

### Fast Restarts

Bun's `--watch` flag is faster than nodemon:

```bash
bun --watch src/index.js
```

### Native APIs

You can use Bun's native APIs for better performance:

```typescript
// File operations
import { file } from 'bun'
const data = await file('data.json').json()

// Fetch (native, no need for node-fetch)
const response = await fetch('https://api.example.com')

// Fast hashing
import { hash } from 'bun'
const hashed = hash('some-string')
```

### SQLite (Optional)

Bun has native SQLite support if you want to migrate from MongoDB:

```typescript
import { Database } from 'bun:sqlite'
const db = new Database('bot.db')
```

## Troubleshooting

### "Cannot find module" errors

Make sure path aliases work:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@helpers/*": ["./src/helpers/*"]
    }
  }
}
```

### Type errors but code works

This is expected with loose config. You can:

1. Ignore for now (code still works)
2. Add `// @ts-ignore` above the line
3. Use `any` type temporarily
4. Fix the type properly when you have time

### Slow type checking

Add more exclusions to `tsconfig.json`:

```json
{
  "exclude": ["node_modules", "dist", "logs", "**/*.spec.ts"]
}
```

## Examples

### Before (JavaScript)

```javascript
const { ApplicationCommandOptionType } = require('discord.js')

module.exports = {
  name: 'ping',
  description: 'Check bot latency',
  category: 'UTILITY',
  cooldown: 5,
  slashCommand: {
    enabled: true,
  },
  async interactionRun(interaction) {
    await interaction.followUp(`🏓 Pong! ${interaction.client.ws.ping}ms`)
  },
}
```

### After (TypeScript - Gradual)

```typescript
import { ApplicationCommandOptionType } from 'discord.js'
import type { CommandData } from '@structures/Command'

// Start with loose types
const command: CommandData = {
  name: 'ping',
  description: 'Check bot latency',
  category: 'UTILITY',
  cooldown: 5,
  slashCommand: {
    enabled: true,
  },
  async interactionRun(interaction) {
    // Type inferred from CommandData
    await interaction.followUp(`🏓 Pong! ${interaction.client.ws.ping}ms`)
  },
}

export default command
```

### After (TypeScript - Strict)

```typescript
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import type { CommandData } from '@structures/Command'

interface PingCommandData {
  settings: any // Will be properly typed later
}

const command: CommandData = {
  name: 'ping',
  description: 'Check bot latency',
  category: 'UTILITY',
  cooldown: 5,
  botPermissions: ['SendMessages'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
  },
  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: PingCommandData
  ): Promise<void> {
    const ping = interaction.client.ws.ping
    await interaction.followUp({
      content: `🏓 Pong! ${ping}ms`,
      ephemeral: true,
    })
  },
}

export default command
```

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Discord.js Guide](https://discordjs.guide/)
- [TypeScript Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)