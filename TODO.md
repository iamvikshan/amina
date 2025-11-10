# Amina Discord Bot - TODO & Feature Roadmap

## 🔄 TypeScript Migration - Gradual Conversion Roadmap

> [!INFO] Amina is gradually migrating from JavaScript to TypeScript using Bun's
> native TS support.

### 📊 Migration Progress Overview

**Overall Status: 133 / 374 files converted (35.6%)**

| Category          | Converted | Remaining | Total | Progress |
| ----------------- | --------- | --------- | ----- | -------- |
| **Core & Config** | 4         | 0         | 4     | ✅ 100%  |
| **Structures**    | 5         | 0         | 5     | ✅ 100%  |
| **Helpers**       | 19        | 0         | 19    | ✅ 100%  |
| **Database**      | 10        | 0         | 10    | ✅ 100%  |
| **Handlers**      | 19        | 0         | 19    | ✅ 100%  |
| **Events**        | 25        | 0         | 25    | ✅ 100%  |
| **Commands**      | 4         | 210       | 214   | 2%       |
| **Contexts**      | 1         | 0         | 1     | ✅ 100%  |
| **Services**      | 1         | 0         | 1     | ✅ 100%  |

**Phase 3 Progress:** ✅ COMPLETE! (28/28 files done - 100%)
**Next Target:** Phase 4 - Commands (210 remaining files)

---

### Phase 1, 2 & 3 ✅ COMPLETE - Core Infrastructure, Database, Handlers & Events

**Major Achievements:**

- ✅ **Core Infrastructure Complete** - Structures, Helpers, Config, Services (100%)
- ✅ **Database Layer Complete** - All schemas + mongoose connection converted (100%)
- ✅ **All Handlers Complete** - 19/19 handlers converted (100%)
- ✅ **All Events Complete** - 25/25 event files converted (100%)
- ✅ **Context Menus Complete** - Avatar context converted (100%)
- ✅ **Entry Point Converted** - index.js → index.ts with Bun native path resolution
- ✅ **ModUtils Refactored** - Split into modular structure (7 files)

**Progress: 133 TypeScript files converted, 210 JavaScript files remaining**

#### ✅ Converted Files (133 files)

**Configuration & Types (4 files - ✅ 100% Complete!):**

- [x] `src/config.ts` - Main configuration
- [x] `src/index.ts` - Main entry point ⭐ **NEW**
- [x] `types/global.d.ts` - Global type definitions
- [x] `types/schemas.d.ts` - Schema type definitions

**Handlers (19 files - ✅ 100% Complete!):**

- [x] `src/handlers/command.ts` - Command handler
- [x] `src/handlers/index.ts` - Handler barrel exports
- [x] `src/handlers/giveaway.ts` - Giveaway system handler
- [x] `src/handlers/manager.ts` - Music manager (Lavalink)
- [x] `src/handlers/reactionRoles.ts` - Reaction roles
- [x] `src/handlers/counter.ts` - Counter system
- [x] `src/handlers/presence.ts` - Bot presence
- [x] `src/handlers/player.ts` - Music player
- [x] `src/handlers/context.ts` - Context menu handler
- [x] `src/handlers/stats.ts` - Stats tracking
- [x] `src/handlers/greeting.ts` - Welcome/leave messages
- [x] `src/handlers/invite.ts` - Invite tracking
- [x] `src/handlers/tod.ts` - Truth or Dare game
- [x] `src/handlers/profile.ts` - User profiles
- [x] `src/handlers/guild.ts` - Guild management
- [x] `src/handlers/automod.ts` - Automod system
- [x] `src/handlers/ticket.ts` - Ticket system
- [x] `src/handlers/report.ts` - Report system
- [x] `src/handlers/suggestion.ts` - Suggestion system

**Helpers (19 files - ✅ 100% Complete!):**

- [x] `src/helpers/Logger.ts` - Logging utility
- [x] `src/helpers/Validator.ts` - Validation logic
- [x] `src/helpers/permissions.ts` - Permission name mapping
- [x] `src/helpers/channelTypes.ts` - Channel type mapping
- [x] `src/helpers/HttpUtils.ts` - HTTP utility class
- [x] `src/helpers/BotUtils.ts` - Bot utility functions
- [x] `src/helpers/Utils.ts` - General utilities
- [x] `src/helpers/Honeybadger.ts` - Error tracking
- [x] `src/helpers/webhook.ts` - Dashboard notifications ⭐ **NEW**
- [x] `src/helpers/extenders/Guild.ts` - Guild extensions
- [x] `src/helpers/extenders/Message.ts` - Message extensions
- [x] `src/helpers/extenders/GuildChannel.ts` - Channel extensions
- [x] `src/helpers/ModUtils/index.ts` - Barrel export ⭐ **NEW**
- [x] `src/helpers/ModUtils/core.ts` - Core moderation utils ⭐ **NEW**
- [x] `src/helpers/ModUtils/purge.ts` - Message purging ⭐ **NEW**
- [x] `src/helpers/ModUtils/warnings.ts` - Warning system ⭐ **NEW**
- [x] `src/helpers/ModUtils/timeout.ts` - Timeout management ⭐ **NEW**
- [x] `src/helpers/ModUtils/kick-ban.ts` - Kick/ban operations ⭐ **NEW**
- [x] `src/helpers/ModUtils/voice.ts` - Voice controls ⭐ **NEW**

**Structures (5 files - ✅ 100% Complete!):**

- [x] `src/structures/CommandCategory.ts` - Command category enum
- [x] `src/structures/index.ts` - Barrel export file
- [x] `src/structures/BaseContext.ts` - Context menu base
- [x] `src/structures/Command.ts` - Command base structure (enhanced ⭐ **NEW**)
- [x] `src/structures/BotClient.ts` - Core bot client

**Database (10 files - ✅ 100% Complete!):**

- [x] `src/database/mongoose.ts` - Database connection
- [x] `src/database/schemas/User.ts` - User schema
- [x] `src/database/schemas/Guild.ts` - Guild schema
- [x] `src/database/schemas/Member.ts` - Member schema
- [x] `src/database/schemas/ModLog.ts` - Moderation logs
- [x] `src/database/schemas/AutomodLogs.ts` - Automod logs
- [x] `src/database/schemas/Giveaways.ts` - Giveaways
- [x] `src/database/schemas/Dev.ts` - Developer data
- [x] `src/database/schemas/TruthOrDare.ts` - Truth or Dare
- [x] `src/database/schemas/ReactionRoles.ts` - Reaction roles
- [x] `src/database/schemas/Suggestions.ts` - Suggestions
- [x] `src/database/schemas/MemberStats.ts` - Member stats

**Commands (4 files):**

- [x] `src/commands/fun/meme.ts` - Meme command
- [x] `src/commands/utility/help.ts` - Help command
- [x] `src/commands/bot/bot.ts` - Bot info commands ⭐ **NEW**
- [x] `src/commands/bot/sub/botstats.ts` - Bot statistics ⭐ **NEW**

**Events (25 files - ✅ 100% Complete!):**

- [x] `src/events/clientReady.ts` - Client ready event
- [x] `src/events/error.ts` - Error handler
- [x] `src/events/raw.ts` - Raw event handler
- [x] `src/events/warn.ts` - Warning handler
- [x] `src/events/interactions/interactionCreate.ts` - Interaction handler
- [x] `src/events/voice/voiceStateUpdate.ts` - Voice state handler
- [x] `src/events/guild/guildCreate.ts` - Guild join handler ⭐ **NEW**
- [x] `src/events/guild/guildDelete.ts` - Guild leave handler ⭐ **NEW**
- [x] `src/events/invite/inviteCreate.ts` - Invite creation tracker ⭐ **NEW**
- [x] `src/events/invite/inviteDelete.ts` - Invite deletion tracker ⭐ **NEW**
- [x] `src/events/member/guildMemberAdd.ts` - Member join handler ⭐ **NEW**
- [x] `src/events/member/guildMemberRemove.ts` - Member leave handler ⭐ **NEW**
- [x] `src/events/member/rolesChange.ts` - Role change tracker ⭐ **NEW**
- [x] `src/events/message/messageCreate.ts` - Message handler ⭐ **NEW**
- [x] `src/events/message/messageUpdate.ts` - Message edit handler ⭐ **NEW**
- [x] `src/events/message/messageDelete.ts` - Message deletion handler ⭐ **NEW**
- [x] `src/events/reaction/messageReactionAdd.ts` - Reaction add handler ⭐ **NEW**
- [x] `src/events/reaction/messageReactionRemove.ts` - Reaction remove handler ⭐ **NEW**
- [x] `src/events/player/trackStart.ts` - Track start handler ⭐ **NEW**
- [x] `src/events/player/trackEnd.ts` - Track end handler ⭐ **NEW**
- [x] `src/events/player/queueEnd.ts` - Queue end handler ⭐ **NEW**
- [x] `src/events/player/playerDestroy.ts` - Player destroy handler ⭐ **NEW**
- [x] `src/events/player/playerDisconnect.ts` - Player disconnect handler ⭐ **NEW**

**Contexts (1 file - ✅ 100% Complete!):**

- [x] `src/contexts/avatar.ts` - Avatar context menu

**Services (1 file - ✅ 100% Complete!):**

- [x] `src/services/health.ts` - Health check service

#### ⏳ Remaining Files to Convert (210 JavaScript files)

**Core:** ✅ All Complete! (4/4 converted)

**Helpers:** ✅ All Complete! (19/19 converted)

**Handlers:** ✅ All Complete! (19/19 converted)

**Events:** ✅ All Complete! (25/25 converted)

**Commands (210 files remaining):**

- Admin (17 files): autorole, counter, embed, logs, maxwarn, reactionrole, say, settings, ticket, automod/\* (3), greeting/\* (2)
- Bot: ✅ All Complete! (2/2 converted)
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

### 📦 Phase 2 - ✅ COMPLETE! (25/25 files - 100%)

**Target: Core system files that affect bot functionality**

#### ✅ All Files Completed:

- All database schemas (10/10) ✅
- All handlers (19/19) ✅
  - Small-medium handlers: command, index, giveaway, manager, reactionRoles, counter, presence, player, context, stats, greeting, invite, tod
  - Large handlers: profile, guild, automod, ticket, report, suggestion

**Phase 2 Complete! Moving to Phase 3: Events** 🎉

---

### 📦 Phase 3 - ✅ COMPLETE! (28/28 files - 100%)

**Target: Event handlers and remaining core files**

#### ✅ All Files Completed:

- All event files (25/25) ✅
  - Core events: clientReady, error, raw, warn
  - Interaction events: interactionCreate
  - Voice events: voiceStateUpdate
  - Guild events: guildCreate, guildDelete
  - Invite events: inviteCreate, inviteDelete
  - Member events: guildMemberAdd, guildMemberRemove, rolesChange
  - Message events: messageCreate, messageUpdate, messageDelete
  - Reaction events: messageReactionAdd, messageReactionRemove
  - Player events: trackStart, trackEnd, queueEnd, playerDestroy, playerDisconnect
- Entry point converted (1/1) ✅
  - index.js → index.ts with Bun native path resolution
- ModUtils refactored (7/7 files) ✅
  - Split into modular structure: core, purge, warnings, timeout, kick-ban, voice, index
- webhook.js → webhook.ts ✅
- Command structure enhanced ✅
  - Added `Command` type export for better TypeScript support
  - Made properties optional for flexibility
  - Added 'INFO' category

**Phase 3 Complete! Moving to Phase 4: Commands** 🎉

---

### 📦 Phase 4 - Commands Conversion (4/214 done - 2%)

**Target: Convert all command files to TypeScript**

#### ✅ Completed (4 files):

- [x] `src/commands/fun/meme.ts`
- [x] `src/commands/utility/help.ts`
- [x] `src/commands/bot/bot.ts`
- [x] `src/commands/bot/sub/botstats.ts`

#### 🔄 In Progress (210 files remaining):

**Recommended conversion order by category:**

1. **Dev Commands (4 files)** - Small, isolated commands
   - [ ] dev.js, premium.js, presence.js, zzz.js

2. **Info Commands (6 files)** - Information display commands
   - [ ] info.js, leaderboard.js, shared/\* (4 files)

3. **Social Commands (2 files)** - Social interaction features
   - [ ] invites.js, reputation.js

4. **Stats Commands (4 files)** - Statistics and ranking
   - [ ] rank.js, stats.js, statstracking.js, xp.js

5. **Suggestions Commands (2 files)** - Suggestion system
   - [ ] suggest.js, suggestion.js

6. **Economy Commands (8 files)** - Economy system
   - [ ] bank.js, beg.js, daily.js, gamble.js, sub/\* (4 files)

7. **Fun Commands (14 files)** - Entertainment features
   - [ ] facts.js, filters.js, flip.js, generators.js, hack.js, hangman.js
   - [ ] image.js, love.js, overlay.js, react.js, tictactoe.js, tod.js, together.js

8. **Utility Commands (12 files)** - Utility tools
   - [ ] afk.js, epicgames.js, github.js, paste.js, pokedex.js, profile.js
   - [ ] proxies.js, qrcode.js, redflag.js, report.js, urban.js, weather.js

9. **Giveaways Commands (8 files)** - Giveaway system
   - [ ] giveaway.js, sub/\* (7 files)

10. **Music Commands (17 files)** - Music player features
    - [ ] autoplay.js, bassboost.js, leave.js, loop.js, lyric.js, np.js
    - [ ] pause.js, play.js, queue.js, resume.js, search.js, seek.js
    - [ ] shuffle.js, skip.js, stop.js, volume.js

11. **Moderation Commands (16 files)** - Moderation tools
    - [ ] ban.js, kick.js, nick.js, purge.js, softban.js, timeout.js
    - [ ] unban.js, untimeout.js, voice.js, warn.js, warnings.js, message/\* (6 files)

12. **Admin Commands (17 files)** - Administrative features
    - [ ] autorole.js, counter.js, embed.js, logs.js, maxwarn.js, reactionrole.js
    - [ ] say.js, settings.js, ticket.js, automod/\* (3 files), greeting/\* (2 files)

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
