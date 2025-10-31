# Amina Discord Bot - TODO & Feature Roadmap

## 🔄 TypeScript Migration - Gradual Conversion Roadmap

> [!INFO] Amina is gradually migrating from JavaScript to TypeScript using Bun's
> native TS support.

### Phase 1.0.3 ✅ COMPLETED - Core Infrastructure

**Major Achievement: Core Bot & Utilities Converted!**

#### ✅ Converted Files (28 files)

**Configuration & Types:**

- [x] `src/config.ts` - Main configuration
- [x] `types/global.d.ts` - Global type definitions
- [x] `types/schemas.d.ts` - Schema type definitions

**Handlers:**

- [x] `src/handlers/command.ts` - Command handler ⭐ Fixed interaction handling
- [x] `src/handlers/index.ts` - Handler barrel exports
- [x] `src/handlers/giveaway.ts` - Giveaway system handler

**✨ Helpers (Foundation Complete!):**

- [x] `src/helpers/Logger.ts` - Logging utility (114 lines)
- [x] `src/helpers/Validator.ts` - Validation logic (253 lines)
- [x] `src/helpers/permissions.ts` - Permission name mapping (43 lines)
- [x] `src/helpers/channelTypes.ts` - Channel type mapping (31 lines)
- [x] `src/helpers/HttpUtils.ts` - HTTP utility class (121 lines)
- [x] `src/helpers/BotUtils.ts` - Bot utility functions (101 lines)
- [x] `src/helpers/Utils.ts` - General utilities (217 lines) ⭐ **NEW**
- [x] `src/helpers/Honeybadger.ts` - Error tracking (100 lines) ⭐ **NEW**

**✨ Structures (Foundation Complete!):**

- [x] `src/structures/CommandCategory.ts` - Command category enum
- [x] `src/structures/index.ts` - Barrel export file
- [x] `src/structures/BaseContext.ts` - Context menu base (42 lines)
- [x] `src/structures/Command.ts` - Command base structure (130 lines)
- [x] `src/structures/BotClient.ts` - Core bot client (410 lines) ⭐ **MAJOR**

**Database Schemas:**

- [x] `src/database/schemas/User.ts` - User schema
- [x] `src/database/schemas/Guild.ts` - Guild schema
- [x] `src/database/schemas/Member.ts` - Member schema

**Commands:**

- [x] `src/commands/fun/meme.ts` - Meme command ⭐ Fixed button handling
- [x] `src/commands/utility/help.ts` - Help command ⭐ Fixed interactions

**Services:**

- [x] `src/services/health.ts` - Health check service

#### 🐛 Bug Fixes in Phase 1.0.3

- ✅ Fixed deprecated `ephemeral: true` → `flags: MessageFlags.Ephemeral`
- ✅ Fixed "Interaction already acknowledged" errors
- ✅ Fixed button/component interaction handling pattern
- ✅ Silenced Honeybadger in development environment
- ✅ Fixed help command double-defer issue

### Phase 1.0.4 🎯 IN PROGRESS - Handlers & Remaining Infrastructure

### � Medium Priority - Next Phase (Layer 3: Handlers & Simple Utilities)

Convert handlers and remaining small utility files.

#### 1. Simple Handlers (~50-150 lines each)

- [ ] **`src/handlers/automod.js`** - Automod handler
- [ ] **`src/handlers/greeting.js`** - Welcome/leave messages
- [ ] **`src/handlers/counter.js`** - Counter handler
- [ ] **`src/handlers/reactionRoles.js`** - Reaction roles
- [ ] **`src/handlers/report.js`** - Report handler
- [ ] **`src/handlers/stats.js`** - Stats tracking
- [ ] **`src/handlers/suggestion.js`** - Suggestions
- [ ] **`src/handlers/ticket.js`** - Ticket system
- [ ] **`src/handlers/tod.js`** - Truth or Dare

#### 2. Remaining Small Helpers

- [ ] **`src/helpers/Honeybadger.js`** (42 lines) - Error tracking config

### 🟢 Lower Priority - Complex Files

Save these for later phases.

#### 4. Large Utility Files

- [ ] **`src/helpers/Utils.js`** (187 lines) - General utilities
  - Convert after permissions.js and channelTypes.js
- [ ] **`src/helpers/ModUtils.js`** (616 lines) - Moderation utilities
  - Complex, many dependencies

#### 5. Core Classes (Final Phase)

- [ ] **`src/structures/BotClient.js`** (390 lines) - Core client class
  - Most critical file, convert last
  - Depends on almost everything

#### 6. Remaining Handlers

- [ ] `src/handlers/` - All remaining .js handlers
  - Convert alongside related features

#### 7. Remaining Schemas

- [ ] `src/database/schemas/` - All remaining .js schemas
  - Convert as needed per feature

#### 8. Remaining commands

- [ ] `src/commands/` - All remaining .js commands
  - Convert as features are worked on

---

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

**✅ All plugins installed and running successfully!**

- ✅ **YouTube Plugin v1.15.0** - ✨ Active (WEB_REMIX, WEB clients)
- ✅ **LavaSrc v4.2.0** - ✨ Active - Commands not yet implemented
  - Spotify: ✅ Enabled (credentials passed via docker-compose from .env)
  - Apple Music: ⏸️ Disabled (add APPLE_MUSIC_TOKEN to .env to enable)
  - Deezer: ⏸️ Disabled (add DEEZER_KEY to .env to enable)
- ✅ **LavaSearch v1.0.0** - ✨ Active - Commands not yet implemented
- ✅ **SponsorBlock v3.0.1** - ✨ Active (7 categories) - Commands not yet
  implemented
- ✅ **LavaDSPX v0.0.5** - ✨ Active (high-pass, low-pass, normalization, echo)
  - Commands not yet implemented
- ✅ **LavaLyrics v1.1.0** - ✨ Active (Spotify/YouTube/Deezer/Yandex lyrics)
  - Commands not yet implemented
- ❌ **Java Timed Lyrics** - Incompatible (requires YouTube route planner)
- ❌ **Google Cloud TTS** - Not added (requires paid API key)

**Configuration Notes:**

- ✅ Lavalink now receives .env variables via docker-compose (`env_file`)
- ✅ All plugin repositories verified and working
- ✅ Optional ENV variables documented in `.env.example`
