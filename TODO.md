# 🎵 Amina Music System - Feature Implementation Roadmap

## 📋 Table of Contents

- [High Priority Features](#high-priority-features)
- [Medium Priority Features](#medium-priority-features)
- [Low Priority Features](#low-priority-features)
- [Lavalink Configuration Enhancements](#lavalink-configuration-enhancements)
- [Plugin Recommendations](#plugin-recommendations)

---

## 🔴 High Priority Features

**Implement these first - leverage existing Lavalink capabilities**

### 1. Filter Commands (Uses existing enabled filters)

- [ ] **`/nightcore`** - Speed up + pitch up effect
  - Uses `timescale` filter: `{ speed: 1.2, pitch: 1.2 }`
  - Popular effect, high user demand
- [ ] **`/vaporwave`** - Slow down + pitch down aesthetic effect
  - Uses `timescale` filter: `{ speed: 0.8, pitch: 0.8 }`
- [ ] **`/8d`** - 8D audio rotation effect
  - Uses `rotation` filter with `rotationHz: 0.2`
- [ ] **`/karaoke`** - Remove vocals for karaoke mode
  - Uses `karaoke` filter with configurable levels
- [ ] **`/tremolo`** - Trembling sound effect
  - Uses `tremolo` filter: `{ frequency: 2.0, depth: 0.5 }`
- [ ] **`/vibrato`** - Vibrating pitch effect
  - Uses `vibrato` filter: `{ frequency: 2.0, depth: 0.5 }`
- [ ] **`/distortion`** - Distorted sound effect
  - Uses `distortion` filter with multiple sin/cos offsets
- [ ] **`/pitch`** - Adjust pitch without changing speed
  - Uses `timescale` filter with pitch only
- [ ] **`/speed`** - Adjust playback speed without pitch
  - Uses `timescale` filter with speed only
- [ ] **`/filters`** - Show active filters & reset all
  - Display current filter status
  - Option to clear all filters at once

### 2. Platform-Specific Search Commands (Uses LavaSrc plugin)

- [ ] **`/spotify <query>`** - Search & play from Spotify
  - Uses `spsearch:` prefix
  - Already configured in application.yml
- [ ] **`/deezer <query>`** - Search & play from Deezer
  - Uses `dzsearch:` prefix
  - Already configured in application.yml
- [ ] **`/applemusic <query>`** - Search & play from Apple Music
  - Uses `amsearch:` prefix
  - Already configured in application.yml
- [ ] **`/soundcloud <query>`** - Explicit SoundCloud search
  - Uses `scsearch:` prefix
  - Currently default source

### 3. Enhanced Equalizer

- [ ] **`/equalizer`** - Full 15-band equalizer control
  - Interactive UI for band adjustment
  - Preset options: Flat, Bass, Treble, Vocal, Party, Soft
  - Save custom user presets

### 4. Advanced Queue Management

- [ ] **`/skipto <position>`** - Skip to specific queue position
- [ ] **`/remove <position>`** - Remove song from queue
- [ ] **`/move <from> <to>`** - Reorder queue songs
- [ ] **`/clearqueue`** - Clear queue but keep playing
- [ ] **`/previous`** - Play previous track from history
- [ ] **`/replay`** - Restart current song from beginning

---

## 🟡 Medium Priority Features

**Add after high priority features**

### 5. Favorites & Playlist System

- [ ] **`/favorite add`** - Add current song to favorites
- [ ] **`/favorite list`** - Show user's favorite songs
- [ ] **`/favorite play`** - Play all favorites
- [ ] **`/favorite remove`** - Remove from favorites
- [ ] **`/playlist create <name>`** - Create custom playlist
- [ ] **`/playlist add <name>`** - Add song to playlist
- [ ] **`/playlist play <name>`** - Play playlist
- [ ] **`/playlist list`** - Show all playlists
- [ ] **Database schema** for user playlists/favorites

### 6. Radio Station Support

- [ ] **`/radio <station>`** - Play internet radio
- [ ] **`/radio list`** - Show available stations
- [ ] Predefined station list (genre-based)
- [ ] Support for HTTP/HTTPS streams

### 7. Enhanced Lyrics

- [ ] **Improve `/lyrics`** command
- [ ] Add synced lyrics with timing
- [ ] Auto-scroll lyrics as song plays
- [ ] Lyrics from multiple sources (Genius, Musixmatch)

### 8. Filter Presets & Combinations

- [ ] **`/preset save <name>`** - Save current filter combo
- [ ] **`/preset load <name>`** - Load saved preset
- [ ] **`/preset list`** - Show available presets
- [ ] Pre-built presets: Cinema, Concert, Club, Studio

### 9. DJ Mode (Role-based Control)

- [ ] **`/dj enable`** - Enable DJ-only mode
- [ ] **`/dj role <role>`** - Set DJ role
- [ ] Only DJ role can control music when enabled
- [ ] Override for administrators

---

## 🟢 Low Priority Features

**Nice to have - implement when time permits**

### 10. SponsorBlock Integration

- [ ] Install `sponsorblock-plugin` for Lavalink
- [ ] Auto-skip sponsored segments
- [ ] Auto-skip intros/outros (configurable)
- [ ] User toggleable setting

### 11. Text-to-Speech

- [ ] **`/tts <text>`** - Text-to-speech in voice
- [ ] Multiple language support
- [ ] Voice selection options
- [ ] Requires `dunctebot-plugin` or `tts-plugin`

### 12. Music Statistics

- [ ] **`/stats user [@user]`** - User listening stats
- [ ] **`/stats server`** - Server music stats
- [ ] Track most played songs
- [ ] Listening time tracking
- [ ] Leaderboards

### 13. Custom Soundboard

- [ ] **`/soundboard add <name> <url>`** - Add sound
- [ ] **`/soundboard play <name>`** - Play sound effect
- [ ] **`/soundboard list`** - Show available sounds
- [ ] Per-server soundboard management

---

## ⚙️ Lavalink Configuration Enhancements

### A. Replace Deprecated YouTube Source

**URGENT - Current logs show deprecation warning**

```yaml
# Remove from application.yml:
sources:
  youtube: true # ❌ DEPRECATED

# Add to plugins section:
plugins:
  youtube:
    enabled: true
    allowSearch: true
    allowDirectVideoIds: true
    allowDirectPlaylistIds: true
    clients:
      - MUSIC
      - WEB
      - ANDROID_TESTSUITE
```

### B. Add Essential Plugins

#### 1. YouTube Source Plugin (REQUIRED)

```yaml
plugins:
  youtube:
    enabled: true
    allowSearch: true
    allowDirectVideoIds: true
    allowDirectPlaylistIds: true
```

**Download:** https://github.com/lavalink-devs/youtube-source/releases

#### 2. LavaSfy (Enhanced Spotify)

```yaml
plugins:
  lavasfy:
    clientId: '5812c519c17a4fe7b88b911ccebd7ada'
    clientSecret: '5c7654b5fb6e4baca7b45a51566fe17a'
    countryCode: 'US'
    audioPlayback: true
    autoResolve: true
```

**Download:** https://github.com/topi314/LavaSfy/releases

#### 3. DuncteBot Plugin (Extra Sources)

```yaml
plugins:
  dunctebot:
    ttsLanguage: 'en-US'
    sources:
      getyarn: true # Movie/TV quotes
      clypit: true # Clyp.it
      tts: true # Text-to-speech
      pornhub: false # Disabled
      reddit: true # Reddit videos
      ocremix: true # Game music
      tiktok: true # TikTok
      mixcloud: true # DJ mixes
```

**Download:** https://github.com/DuncteBot/skybot-lavalink-plugin/releases

#### 4. SponsorBlock Plugin

```yaml
plugins:
  sponsorblock:
    enabled: true
    categories:
      - 'sponsor'
      - 'selfpromo'
      - 'interaction'
      - 'intro'
      - 'outro'
```

**Download:** https://github.com/topi314/Sponsorblock-Plugin/releases

### C. Performance Optimizations

```yaml
lavalink:
  server:
    # Better YouTube handling
    youtubePlaylistLoadLimit: 10 # Increase from 6

    # Lower latency
    frameBufferDurationMs: 1000 # Reduce from 5000

    # Rate limit strategy
    ratelimit:
      strategy: 'RotateOnBan'
      searchTriggersFail: true

    # HTTP config for proxy (optional)
    httpConfig:
      proxyHost: ''
      proxyPort: 0
```

### D. Add Country Codes to Sources

```yaml
plugins:
  lavasrc:
    sources:
      spotify: true
      deezer: true
      yandexmusic: true
      applemusic: true
    applemusic:
      countryCode: 'US' # Add this
    spotify:
      countryCode: 'US' # Add this
```

---

## 📦 Plugin Download Links

### Essential (Download & Install First)

1. **YouTube Source** (REQUIRED):
   https://github.com/lavalink-devs/youtube-source/releases

   - Fixes deprecation warning in logs
   - Better YouTube support

2. **LavaSrc** (Already configured): Pre-installed
   - Spotify, Deezer, Apple Music, Yandex

### Recommended

3. **LavaSfy**: https://github.com/topi314/LavaSfy/releases

   - Enhanced Spotify with direct playback

4. **DuncteBot**: https://github.com/DuncteBot/skybot-lavalink-plugin/releases

   - TTS, TikTok, Reddit, more sources

5. **SponsorBlock**: https://github.com/topi314/Sponsorblock-Plugin/releases
   - Auto-skip sponsored segments

### Optional

6. **Lyrics Plugin**: https://github.com/topi314/LavaLyrics/releases
7. **Google Cloud TTS**: https://github.com/DRSchlaubi/google-cloud-tts-plugin

---

## 🎯 Config.js Enhancements Needed

```javascript
MUSIC: {
  ENABLED: true,
  IDLE_TIME: 60,
  DEFAULT_VOLUME: 60,
  MAX_SEARCH_RESULTS: 5,
  DEFAULT_SOURCE: 'scsearch',

  // Add these:
  SOURCES: {
    YOUTUBE: 'ytsearch',
    YOUTUBE_MUSIC: 'ytmsearch',
    SOUNDCLOUD: 'scsearch',
    SPOTIFY: 'spsearch',
    DEEZER: 'dzsearch',
    APPLE_MUSIC: 'amsearch',
    YANDEX: 'ymsearch',
  },

  FILTERS: {
    NIGHTCORE: { timescale: { speed: 1.2, pitch: 1.2 } },
    VAPORWAVE: { timescale: { speed: 0.8, pitch: 0.8 } },
    CHIPMUNK: { timescale: { pitch: 1.5 } },
    SLOW_MOTION: { timescale: { speed: 0.7 } },
    FAST_FORWARD: { timescale: { speed: 1.5 } },
  },

  EQ_PRESETS: {
    FLAT: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    BASS: [0.6, 0.4, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    TREBLE: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.4, 0.6, 0.8, 1.0],
    VOCAL: [0, 0, 0, 0, 0.15, 0.25, 0.25, 0.15, 0, 0, 0, 0, 0, 0, 0],
    PARTY: [0.2, 0.15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.15, 0.2, 0.25],
    SOFT: [-0.25, -0.15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.15, -0.25, -0.3],
  },

  FEATURES: {
    LYRICS: true,
    FILTERS: true,
    PLAYLISTS: true,
    RADIO: true,
    DJ_MODE: false,
  },

  // Existing LAVALINK_NODES...
}
```

---

## 📝 Implementation Notes

### Filter Command Template

All filter commands follow similar pattern:

```javascript
await player.filterManager.setFilters({
  timescale: { speed: 1.2, pitch: 1.2 }, // example
  // other filters...
})
```

### Platform Search Template

```javascript
const res = await player.search(
  {
    query: searchQuery,
    source: 'spsearch', // or dzsearch, amsearch
  },
  user
)
```

### Database Schema for Playlists

```javascript
{
  userId: String,
  playlists: [{
    name: String,
    tracks: [{
      title: String,
      uri: String,
      duration: Number,
    }]
  }],
  favorites: [{ title, uri, duration }]
}
```

---

## ⚡ Quick Start Priority Order

1. **Fix YouTube deprecation** (Update application.yml + install plugin)
2. **Add filter commands** (nightcore, vaporwave, 8d, karaoke)
3. **Add platform searches** (spotify, deezer, applemusic)
4. **Enhance queue management** (skipto, remove, move, clearqueue)
5. **Add equalizer presets**
6. **Everything else** (medium/low priority)

---

## 🔗 Useful Resources

- Lavalink Docs: https://lavalink.dev/
- Lavalink Plugins: https://lavalink.dev/plugins
- lavalink-client NPM: https://www.npmjs.com/package/lavalink-client
- Filter Examples: https://lavalink.dev/api/rest.html#filters

---

**Last Updated:** October 28, 2025 **Version:** 1.0 **Bot Version:** 5.6.0
