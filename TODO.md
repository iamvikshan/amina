# Amina Discord Bot - TODO & Feature Roadmap

## 🔄 TypeScript Migration - Gradual Conversion Roadmap

> [!INFO] Amina is gradually migrating from JavaScript to TypeScript using Bun's
> native TS support.

### 📊 Migration Progress Overview

**Overall Status: 94 / 374 files converted (25.1%)**

| Category          | Converted | Remaining | Total | Progress |
| ----------------- | --------- | --------- | ----- | -------- |
| **Core & Config** | 3         | 1         | 4     | 75%      |
| **Structures**    | 5         | 0         | 5     | ✅ 100%  |
| **Helpers**       | 11        | 1         | 12    | ✅ 92%   |
| **Database**      | 10        | 0         | 10    | ✅ 100%  |
| **Handlers**      | 10        | 9         | 19    | 53%      |
| **Events**        | 5         | 20        | 25    | 20%      |
| **Commands**      | 2         | 274       | 276   | 1%       |
| **Contexts**      | 1         | 0         | 1     | ✅ 100%  |
| **Services**      | 1         | 0         | 1     | ✅ 100%  |

**Phase 2 Progress:** 20/25 files done (80% complete!) 🎉
**Next Target:** Remaining 9 handlers + Phase 3 (Events & Commands)

---

### Phase 1 & 2 ✅ MOSTLY COMPLETED - Core Infrastructure & Database

**Major Achievements:**

- ✅ **Core Infrastructure Complete** - Structures, Helpers, Config, Services
- ✅ **Database Layer Complete** - All schemas + mongoose connection converted!
- ✅ **Half of Handlers Done** - 10/19 handlers converted (53%)
- ✅ **Context Menus Complete** - Avatar context converted

**Progress: 94 TypeScript files converted, 280 JavaScript files remaining**

#### ✅ Converted Files (94 files)

**Configuration & Types (3 files):**

- [x] `src/config.ts` - Main configuration
- [x] `types/global.d.ts` - Global type definitions
- [x] `types/schemas.d.ts` - Schema type definitions

**Handlers (10 files - 53%):**

- [x] `src/handlers/command.ts` - Command handler ⭐
- [x] `src/handlers/index.ts` - Handler barrel exports
- [x] `src/handlers/giveaway.ts` - Giveaway system handler
- [x] `src/handlers/manager.ts` - Music manager (Lavalink) ⭐ **NEW**
- [x] `src/handlers/reactionRoles.ts` - Reaction roles ⭐ **NEW**
- [x] `src/handlers/counter.ts` - Counter system ⭐ **NEW**
- [x] `src/handlers/presence.ts` - Bot presence ⭐ **NEW**
- [x] `src/handlers/player.ts` - Music player ⭐ **NEW**
- [x] `src/handlers/context.ts` - Context menu handler ⭐ **NEW**

**✨ Helpers (11 files - 92% Complete!):**

- [x] `src/helpers/Logger.ts` - Logging utility
- [x] `src/helpers/Validator.ts` - Validation logic
- [x] `src/helpers/permissions.ts` - Permission name mapping
- [x] `src/helpers/channelTypes.ts` - Channel type mapping
- [x] `src/helpers/HttpUtils.ts` - HTTP utility class
- [x] `src/helpers/BotUtils.ts` - Bot utility functions
- [x] `src/helpers/Utils.ts` - General utilities
- [x] `src/helpers/Honeybadger.ts` - Error tracking
- [x] `src/helpers/extenders/Guild.ts` - Guild extensions ⭐ **NEW**
- [x] `src/helpers/extenders/Message.ts` - Message extensions ⭐ **NEW**
- [x] `src/helpers/extenders/GuildChannel.ts` - Channel extensions ⭐ **NEW**

**✨ Structures (5 files - Foundation Complete!):**

- [x] `src/structures/CommandCategory.ts` - Command category enum
- [x] `src/structures/index.ts` - Barrel export file
- [x] `src/structures/BaseContext.ts` - Context menu base
- [x] `src/structures/Command.ts` - Command base structure
- [x] `src/structures/BotClient.ts` - Core bot client ⭐ **MAJOR**

**✨ Database (10 files - 100% Complete!):**

- [x] `src/database/mongoose.ts` - Database connection ⭐ **NEW**
- [x] `src/database/schemas/User.ts` - User schema
- [x] `src/database/schemas/Guild.ts` - Guild schema
- [x] `src/database/schemas/Member.ts` - Member schema
- [x] `src/database/schemas/ModLog.ts` - Moderation logs ⭐ **NEW**
- [x] `src/database/schemas/AutomodLogs.ts` - Automod logs ⭐ **NEW**
- [x] `src/database/schemas/Giveaways.ts` - Giveaways ⭐ **NEW**
- [x] `src/database/schemas/Dev.ts` - Developer data ⭐ **NEW**
- [x] `src/database/schemas/TruthOrDare.ts` - Truth or Dare ⭐ **NEW**
- [x] `src/database/schemas/ReactionRoles.ts` - Reaction roles ⭐ **NEW**
- [x] `src/database/schemas/Suggestions.ts` - Suggestions ⭐ **NEW**
- [x] `src/database/schemas/MemberStats.ts` - Member stats ⭐ **NEW**

**Commands (2 files):**

- [x] `src/commands/fun/meme.ts` - Meme command ⭐ Fixed button handling
- [x] `src/commands/utility/help.ts` - Help command ⭐ Fixed interactions

**Events (5 files):**

- [x] `src/events/interactions/interactionCreate.ts` - Interaction handler
- [x] `src/events/clientReady.ts` - Client ready event ⭐ **NEW**
- [x] `src/events/error.ts` - Error handler ⭐ **NEW**
- [x] `src/events/raw.ts` - Raw event handler ⭐ **NEW**
- [x] `src/events/warn.ts` - Warning handler ⭐ **NEW**

**Contexts (1 file - 100% Complete!):**

- [x] `src/contexts/avatar.ts` - Avatar context menu ⭐ **NEW**

**Services (1 file):**

- [x] `src/services/health.ts` - Health check service

#### ⏳ Remaining Files to Convert (280 JavaScript files)

**Core (1 file):**

- [ ] `src/index.js` - Main entry point

**Helpers (1 file):**

- [ ] `src/helpers/ModUtils.js` - 616 lines, complex moderation utilities

**Handlers (9 files remaining):**

- [ ] `src/handlers/stats.js` (124 lines)
- [ ] `src/handlers/greeting.js` (135 lines)
- [ ] `src/handlers/invite.js` (172 lines)
- [ ] `src/handlers/tod.js` (179 lines)
- [ ] `src/handlers/profile.js` (234 lines)
- [ ] `src/handlers/guild.js` (239 lines)
- [ ] `src/handlers/automod.js` (245 lines)
- [ ] `src/handlers/ticket.js` (380 lines)
- [ ] `src/handlers/report.js` (424 lines)
- [ ] `src/handlers/suggestion.js` (426 lines)

**Events (20 files remaining):**

- [ ] `src/events/guild/guildCreate.js`
- [ ] `src/events/guild/guildDelete.js`
- [ ] `src/events/invite/inviteCreate.js`
- [ ] `src/events/invite/inviteDelete.js`
- [ ] `src/events/member/guildMemberAdd.js`
- [ ] `src/events/member/guildMemberRemove.js`
- [ ] `src/events/member/rolesChange.js`
- [ ] `src/events/message/messageCreate.js`
- [ ] `src/events/message/messageUpdate.js`
- [ ] `src/events/message/messageDelete.js`
- [ ] `src/events/player/trackStart.js`
- [ ] `src/events/player/trackEnd.js`
- [ ] `src/events/player/playerDisconnect.js`
- [ ] `src/events/player/playerDestroy.js`
- [ ] `src/events/player/queueEnd.js`
- [ ] `src/events/reaction/messageReactionAdd.js`
- [ ] `src/events/reaction/messageReactionRemove.js`
- [ ] `src/events/voice/voiceStateUpdate.js`

**Commands (274 files):**

- Admin (17 files): autorole, counter, embed, logs, maxwarn, reactionrole, say, settings, ticket, automod/_ (3), greeting/_ (2)
- Bot (2 files): bot.js, sub/botstats.js
- Dev (4 files): dev, premium, presence, zzz
- Economy (8 files): bank, beg, daily, gamble, sub/\* (4)
- Fun (14 files): facts, filters, flip, generators, hack, hangman, image, love, overlay, react, tictactoe, tod, together
- Giveaways (8 files): giveaway, sub/\* (7)
- Info (6 files): info, leaderboard, shared/\* (4)
- Moderation (16 files): ban, kick, nick, purge, softban, timeout, unban, untimeout, voice, warn, warnings, message/\* (6)
- Music (17 files): autoplay, bassboost, leave, loop, lyric, np, pause, play, queue, resume, search, seek, shuffle, skip, stop, volume
- Social (2 files): invites, reputation
- Stats (4 files): rank, stats, statstracking, xp
- Suggestions (2 files): suggest, suggestion
- Utility (12 files): afk, epicgames, github, paste, pokedex, profile, proxies, qrcode, redflag, report, urban, weather

### 🟡 Phase 2 - In Progress (80% Complete!) 🎉

**Target: Core system files that affect bot functionality**

#### ✅ Completed (20/25 files):

- All database schemas (10/10) ✅
- Small-medium handlers (10/16) ✅

#### 🔄 Remaining (5/25 files):

**Medium-Large Handlers (9 files):**

- [ ] `src/handlers/stats.js` (124 lines)
- [ ] `src/handlers/greeting.js` (135 lines)
- [ ] `src/handlers/invite.js` (172 lines)
- [ ] `src/handlers/tod.js` (179 lines)
- [ ] `src/handlers/profile.js` (234 lines)
- [ ] `src/handlers/guild.js` (239 lines)
- [ ] `src/handlers/automod.js` (245 lines)
- [ ] `src/handlers/ticket.js` (380 lines)
- [ ] `src/handlers/report.js` (424 lines)
- [ ] `src/handlers/suggestion.js` (426 lines)

### 🟢 Phase 3 - Events & Helpers

**Target: Event handlers and utility files**

#### Priority 1: Core Events (~24 files)

- [ ] `src/events/clientReady.js`
- [ ] `src/events/error.js`
- [ ] `src/events/raw.js`
- [ ] `src/events/warn.js`
- [ ] Guild events (2): guildCreate, guildDelete
- [ ] Invite events (2): inviteCreate, inviteDelete
- [ ] Member events (3): guildMemberAdd, guildMemberRemove, rolesChange
- [ ] Message events (3): messageCreate, messageUpdate, messageDelete
- [ ] Player events (5): trackStart, trackEnd, playerDisconnect, playerDestroy, queueEnd
- [ ] Reaction events (2): messageReactionAdd, messageReactionRemove
- [ ] Voice events (1): voiceStateUpdate

#### Priority 2: Helpers & Extensions (~4 files)

- [ ] `src/helpers/ModUtils.js` - 616 lines, complex moderation utilities
- [ ] `src/helpers/extenders/Guild.js`
- [ ] `src/helpers/extenders/GuildChannel.js`
- [ ] `src/helpers/extenders/Message.js`

### 🔵 Phase 4 - Commands (274 files)

**Target: Convert command files by category**

**Recommended Order:**

1. **Dev commands** (4 files) - Admin/testing commands
2. **Bot commands** (2 files) - Bot info commands
3. **Stats commands** (4 files) - Stats tracking
4. **Social commands** (2 files) - Social features
5. **Suggestions** (2 files) - Suggestion system
6. **Economy** (8 files) - Economy system
7. **Giveaways** (8 files) - Giveaway system
8. **Info** (6 files) - Information commands
9. **Fun** (13 files) - Fun/entertainment commands (1 already done: meme.ts)
10. **Utility** (11 files) - Utility commands (1 already done: help.ts)
11. **Admin** (17 files) - Server administration
12. **Moderation** (16 files) - Moderation commands
13. **Music** (17 files) - Music player commands

### 🟣 Phase 5 - Final Files

**Target: Entry point and context menus**

- [ ] `src/index.js` - Main entry point (convert last)
- [ ] `src/contexts/avatar.js` - Avatar context menu

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
