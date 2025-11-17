# Amina Discord Bot - TODO & Feature Roadmap

## 📊 Migration Progress Overview

**Overall Status: 229 / 374 files converted (61.2%)**

| Category          | Converted | Remaining | Total | Progress |
| ----------------- | --------- | --------- | ----- | -------- |
| **Core & Config** | 4         | 0         | 4     | ✅ 100%  |
| **Structures**    | 5         | 0         | 5     | ✅ 100%  |
| **Helpers**       | 19        | 0         | 19    | ✅ 100%  |
| **Database**      | 10        | 0         | 10    | ✅ 100%  |
| **Handlers**      | 19        | 0         | 19    | ✅ 100%  |
| **Events**        | 25        | 0         | 25    | ✅ 100%  |
| **Commands**      | 109       | 16        | 125   | 87%      |
| **Contexts**      | 1         | 0         | 1     | ✅ 100%  |
| **Services**      | 1         | 0         | 1     | ✅ 100%  |

**Current Phase:** Phase 4 - Commands (109/125 done - 87%)

---

## ✅ Phase Completion History

### Phase 1 ✅ COMPLETE - Core Infrastructure (58 files)

- ✅ Core & Config (4 files)
- ✅ Structures (5 files)
- ✅ Helpers (19 files)
- ✅ Database Schemas (10 files)
- ✅ Contexts (1 file)
- ✅ Services (1 file)

### Phase 2 ✅ COMPLETE - Handlers (19 files)

- ✅ All 19 handlers converted
- ✅ Small-medium handlers: command, index, giveaway, manager, reactionRoles, counter, presence, player, context, stats, greeting, invite, tod
- ✅ Large handlers: profile, guild, automod, ticket, report, suggestion

### Phase 3 ✅ COMPLETE - Events & Core Files (28 files)

- ✅ All 25 event files converted
- ✅ Entry point (index.js → index.ts)
- ✅ ModUtils refactored into 7 modular files
- ✅ webhook.js → webhook.ts
- ✅ Command structure enhanced

### Phase 4 🔄 IN PROGRESS - Commands (109/125 files - 87%)

**✅ Completed Categories:**

- ✅ Admin Commands (17/17 - 100%)
- ✅ Bot Commands (2/2 - 100%)
- ✅ Dev Commands (4/4 - 100%)
- ✅ Economy Commands (8/8 - 100%)
- ✅ Fun Commands (13/13 - 100%)
- ✅ Giveaways Commands (8/8 - 100%)
- ✅ Moderation Commands (17/17 - 100%)
- ✅ Info Commands (6/6 - 100%)
- ✅ Social Commands (2/2 - 100%)
- ✅ Stats Commands (4/4 - 100%)
- ✅ Suggestions Commands (2/2 - 100%)
- ✅ Utility Commands (10/10 - 100%)
- ✅ Other: meme.ts, help.ts (2 files)

**🔄 Remaining Categories (16 files):**

- Music (16 files) - Save for last, most complex

---

## 📁 Converted Files Detail

### Configuration & Types (4/4 - ✅ 100%)

- [x] `src/config.ts`
- [x] `src/index.ts`
- [x] `types/global.d.ts`
- [x] `types/schemas.d.ts`

### Structures (5/5 - ✅ 100%)

- [x] `src/structures/CommandCategory.ts`
- [x] `src/structures/index.ts`
- [x] `src/structures/BaseContext.ts`
- [x] `src/structures/Command.ts`
- [x] `src/structures/BotClient.ts`

### Helpers (19/19 - ✅ 100%)

- [x] `src/helpers/Logger.ts`
- [x] `src/helpers/Validator.ts`
- [x] `src/helpers/permissions.ts`
- [x] `src/helpers/channelTypes.ts`
- [x] `src/helpers/HttpUtils.ts`
- [x] `src/helpers/BotUtils.ts`
- [x] `src/helpers/Utils.ts`
- [x] `src/helpers/Honeybadger.ts`
- [x] `src/helpers/webhook.ts`
- [x] `src/helpers/extenders/Guild.ts`
- [x] `src/helpers/extenders/Message.ts`
- [x] `src/helpers/extenders/GuildChannel.ts`
- [x] `src/helpers/ModUtils/index.ts`
- [x] `src/helpers/ModUtils/core.ts`
- [x] `src/helpers/ModUtils/purge.ts`
- [x] `src/helpers/ModUtils/warnings.ts`
- [x] `src/helpers/ModUtils/timeout.ts`
- [x] `src/helpers/ModUtils/kick-ban.ts`
- [x] `src/helpers/ModUtils/voice.ts`

### Database (10/10 - ✅ 100%)

- [x] `src/database/mongoose.ts`
- [x] `src/database/schemas/User.ts`
- [x] `src/database/schemas/Guild.ts`
- [x] `src/database/schemas/Member.ts`
- [x] `src/database/schemas/ModLog.ts`
- [x] `src/database/schemas/AutomodLogs.ts`
- [x] `src/database/schemas/Giveaways.ts`
- [x] `src/database/schemas/Dev.ts`
- [x] `src/database/schemas/TruthOrDare.ts`
- [x] `src/database/schemas/ReactionRoles.ts`
- [x] `src/database/schemas/Suggestions.ts`
- [x] `src/database/schemas/MemberStats.ts`

### Handlers (19/19 - ✅ 100%)

- [x] `src/handlers/command.ts`
- [x] `src/handlers/index.ts`
- [x] `src/handlers/giveaway.ts`
- [x] `src/handlers/manager.ts`
- [x] `src/handlers/reactionRoles.ts`
- [x] `src/handlers/counter.ts`
- [x] `src/handlers/presence.ts`
- [x] `src/handlers/player.ts`
- [x] `src/handlers/context.ts`
- [x] `src/handlers/stats.ts`
- [x] `src/handlers/greeting.ts`
- [x] `src/handlers/invite.ts`
- [x] `src/handlers/tod.ts`
- [x] `src/handlers/profile.ts`
- [x] `src/handlers/guild.ts`
- [x] `src/handlers/automod.ts`
- [x] `src/handlers/ticket.ts`
- [x] `src/handlers/report.ts`
- [x] `src/handlers/suggestion.ts`

### Events (25/25 - ✅ 100%)

- [x] `src/events/clientReady.ts`
- [x] `src/events/error.ts`
- [x] `src/events/raw.ts`
- [x] `src/events/warn.ts`
- [x] `src/events/interactions/interactionCreate.ts`
- [x] `src/events/voice/voiceStateUpdate.ts`
- [x] `src/events/guild/guildCreate.ts`
- [x] `src/events/guild/guildDelete.ts`
- [x] `src/events/invite/inviteCreate.ts`
- [x] `src/events/invite/inviteDelete.ts`
- [x] `src/events/member/guildMemberAdd.ts`
- [x] `src/events/member/guildMemberRemove.ts`
- [x] `src/events/member/rolesChange.ts`
- [x] `src/events/message/messageCreate.ts`
- [x] `src/events/message/messageUpdate.ts`
- [x] `src/events/message/messageDelete.ts`
- [x] `src/events/reaction/messageReactionAdd.ts`
- [x] `src/events/reaction/messageReactionRemove.ts`
- [x] `src/events/player/trackStart.ts`
- [x] `src/events/player/trackEnd.ts`
- [x] `src/events/player/queueEnd.ts`
- [x] `src/events/player/playerDestroy.ts`
- [x] `src/events/player/playerDisconnect.ts`

### Contexts (1/1 - ✅ 100%)

- [x] `src/contexts/avatar.ts`

### Services (1/1 - ✅ 100%)

- [x] `src/services/health.ts`

### Commands (109/125 - 87%)

#### Admin (17/17 - ✅ 100%)

- [x] `src/commands/admin/autorole.ts`
- [x] `src/commands/admin/counter.ts`
- [x] `src/commands/admin/embed.ts`
- [x] `src/commands/admin/maxwarn.ts`
- [x] `src/commands/admin/reactionrole.ts`
- [x] `src/commands/admin/say.ts`
- [x] `src/commands/admin/logs.ts` + logs/ (3 sub-files)
- [x] `src/commands/admin/settings.ts` + settings/ (4 sub-files)
- [x] `src/commands/admin/ticket.ts` + ticket/ (4 sub-files)
- [x] `src/commands/admin/greeting/welcome.ts`
- [x] `src/commands/admin/greeting/farewell.ts`
- [x] `src/commands/admin/greeting/utils.ts`
- [x] `src/commands/admin/automod/anti.ts`
- [x] `src/commands/admin/automod/autodelete.ts`
- [x] `src/commands/admin/automod/automod.ts`

#### Bot (2/2 - ✅ 100%)

- [x] `src/commands/bot/bot.ts`
- [x] `src/commands/bot/sub/botstats.ts`

#### Dev (4/4 - ✅ 100%)

- [x] `src/commands/dev/dev.ts`
- [x] `src/commands/dev/premium.ts`
- [x] `src/commands/dev/presence.ts`
- [x] `src/commands/dev/zzz.ts`
- [x] `src/commands/dev/sub/` (6 sub-files)

#### Moderation (17/17 - ✅ 100%)

- [x] `src/commands/moderation/ban.ts`
- [x] `src/commands/moderation/kick.ts`
- [x] `src/commands/moderation/nick.ts`
- [x] `src/commands/moderation/purge.ts`
- [x] `src/commands/moderation/softban.ts`
- [x] `src/commands/moderation/timeout.ts`
- [x] `src/commands/moderation/unban.ts`
- [x] `src/commands/moderation/untimeout.ts`
- [x] `src/commands/moderation/voice.ts`
- [x] `src/commands/moderation/warn.ts`
- [x] `src/commands/moderation/warnings.ts`
- [x] `src/commands/moderation/message/` (6 sub-files: disconnect, vmute, vunmute, undeafen, move, deafen)

#### Economy (8/8 - ✅ 100%)

- [x] `src/commands/economy/bank.ts` + sub/ (4 files)
- [x] `src/commands/economy/beg.ts`
- [x] `src/commands/economy/daily.ts`
- [x] `src/commands/economy/gamble.ts`

#### Fun (13/13 - ✅ 100%)

- [x] `src/commands/fun/meme.ts`
- [x] `src/commands/fun/facts.ts`
- [x] `src/commands/fun/filters.ts`
- [x] `src/commands/fun/flip.ts`
- [x] `src/commands/fun/generators.ts`
- [x] `src/commands/fun/hack.ts`
- [x] `src/commands/fun/hangman.ts`
- [x] `src/commands/fun/image.ts`
- [x] `src/commands/fun/love.ts`
- [x] `src/commands/fun/overlay.ts`
- [x] `src/commands/fun/react.ts`
- [x] `src/commands/fun/tictactoe.ts`
- [x] `src/commands/fun/tod.ts`
- [x] `src/commands/fun/together.ts`

#### Giveaways (8/8 - ✅ 100%)

- [x] `src/commands/giveaways/giveaway.ts` + sub/ (7 files)

#### Info (6/6 - ✅ 100%)

- [x] `src/commands/info/info.ts`
- [x] `src/commands/info/leaderboard.ts`
- [x] `src/commands/info/shared/user.ts`
- [x] `src/commands/info/shared/channel.ts`
- [x] `src/commands/info/shared/guild.ts`
- [x] `src/commands/info/shared/avatar.ts`
- [x] `src/commands/info/shared/emoji.ts`

#### Social (2/2 - ✅ 100%)

- [x] `src/commands/social/invites.ts`
- [x] `src/commands/social/reputation.ts`

#### Stats (4/4 - ✅ 100%)

- [x] `src/commands/stats/rank.ts`
- [x] `src/commands/stats/stats.ts`
- [x] `src/commands/stats/statstracking.ts`
- [x] `src/commands/stats/xp.ts`

#### Suggestions (2/2 - ✅ 100%)

- [x] `src/commands/suggestions/suggest.ts`
- [x] `src/commands/suggestions/suggestion.ts`

#### Utility (10/10 - ✅ 100%)

- [x] `src/commands/utility/afk.ts`
- [x] `src/commands/utility/paste.ts`
- [x] `src/commands/utility/profile.ts`
- [x] `src/commands/utility/qrcode.ts`
- [x] `src/commands/utility/redflag.ts`
- [x] `src/commands/utility/report.ts`
- [x] `src/commands/utility/urban.ts`
- [x] `src/commands/utility/weather.ts`
- [x] `src/commands/utility/help.ts`
- [x] `src/commands/utility/minaAi.ts`

#### Other (1 file)

- [x] `src/commands/fun/meme.ts`

---

## 📋 Remaining Files (16 JavaScript files)

### Commands by Category

**Music (16 files) - Save for last, most complex:**

- [ ] `src/commands/music/autoplay.js` (16 files remaining)
- [ ] `src/commands/music/bassboost.js`
- [ ] `src/commands/music/leave.js`
- [ ] `src/commands/music/loop.js`
- [ ] `src/commands/music/lyric.js`
- [ ] `src/commands/music/np.js`
- [ ] `src/commands/music/pause.js`
- [ ] `src/commands/music/play.js`
- [ ] `src/commands/music/queue.js`
- [ ] `src/commands/music/resume.js`
- [ ] `src/commands/music/search.js`
- [ ] `src/commands/music/seek.js`
- [ ] `src/commands/music/shuffle.js`
- [ ] `src/commands/music/skip.js`
- [ ] `src/commands/music/stop.js`
- [ ] `src/commands/music/volume.js`

**Note:** All other command categories have been fully converted. Only Music commands remain.

---

## 🎵 Music System - Feature Roadmap

### 🔴 High Priority Features

#### 1. Filter Commands

- [ ] `/nightcore` - Speed up + pitch up
- [ ] `/vaporwave` - Slow down + pitch down
- [ ] `/8d` - 8D audio rotation
- [ ] `/karaoke` - Remove vocals
- [ ] `/tremolo` - Trembling effect
- [ ] `/vibrato` - Vibrating pitch
- [ ] `/distortion` - Distorted sound
- [ ] `/pitch` - Adjust pitch
- [ ] `/speed` - Adjust speed
- [ ] `/filters` - Show/reset filters

#### 2. Platform-Specific Search

- [ ] `/spotify <query>` - Spotify search
- [ ] `/deezer <query>` - Deezer search
- [ ] `/applemusic <query>` - Apple Music search
- [ ] `/soundcloud <query>` - SoundCloud search

#### 3. Enhanced Equalizer

- [ ] `/equalizer` - 15-band EQ control
- [ ] Add presets: Flat, Bass, Treble, Vocal, Party, Soft
- [ ] Save custom user presets

#### 4. Advanced Queue Management

- [ ] `/skipto <position>` - Skip to position
- [ ] `/remove <position>` - Remove from queue
- [ ] `/move <from> <to>` - Reorder queue
- [ ] `/clearqueue` - Clear queue
- [ ] `/previous` - Play previous track
- [ ] `/replay` - Restart current song

### 🟡 Medium Priority Features

#### 5. Favorites & Playlists

- [ ] `/favorite add/list/play/remove`
- [ ] `/playlist create/add/play/list`
- [ ] Database schema for playlists

#### 6. Radio Station Support

- [ ] `/radio <station>` - Play radio
- [ ] `/radio list` - Show stations
- [ ] HTTP/HTTPS stream support

#### 7. Enhanced Lyrics

- [ ] Synced lyrics with timing
- [ ] Auto-scroll lyrics
- [ ] Multiple sources (Genius, Musixmatch)

#### 8. Filter Presets & Combinations

- [ ] `/preset save/load/list`
- [ ] Pre-built presets: Cinema, Concert, Club, Studio

#### 9. DJ Mode

- [ ] `/dj enable` - Enable DJ-only mode
- [ ] `/dj role <role>` - Set DJ role
- [ ] Role-based music control

### 🟢 Low Priority Features

#### 10. SponsorBlock Integration

- [ ] Auto-skip sponsored segments
- [ ] Auto-skip intros/outros
- [ ] User toggleable settings

#### 11. Music Statistics

- [ ] `/stats user/server` - Listening stats
- [ ] Most played songs tracking
- [ ] Listening time tracking
- [ ] Leaderboards

#### 12. Custom Soundboard

- [ ] `/soundboard add/play/list`
- [ ] Per-server soundboard management

---

## 🔧 Lavalink Configuration Status

### ✅ Active Plugins

- ✅ YouTube Plugin v1.15.0
- ✅ LavaSrc v4.2.0 (Spotify enabled, Apple Music/Deezer pending credentials)
- ✅ LavaSearch v1.0.0
- ✅ SponsorBlock v3.0.1
- ✅ LavaDSPX v0.0.5
- ✅ LavaLyrics v1.1.0

### ⚠️ Action Items

- ⚠️ Replace deprecated YouTube source with `youtube-source` or `youtubemusicsearch`
- 🔧 Add APPLE_MUSIC_TOKEN to .env to enable Apple Music
- 🔧 Add DEEZER_KEY to .env to enable Deezer

### ❌ Not Installed

- Java Timed Lyrics (incompatible)
- Google Cloud TTS (requires paid API key)
