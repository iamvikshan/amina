# Amina Discord Bot - TODO & Feature Roadmap

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

- ✅ YouTube Plugin v1.16.0
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
