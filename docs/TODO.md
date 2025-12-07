# TODO - Bot Stats Integration Features

## 🎯 High Priority

### 1. Bot Info User Card

**Description:** Create a user card component displaying real-time bot information
**Location:** TBD (likely `/dash/user` or landing page section)
**Data to Display:**

- Bot status (online/idle/dnd)
- Uptime duration (e.g., "Alive for 2d 14h 3m 24s")
- Response time/ping (e.g., "42ms")
- Guild count (e.g., "1 server")
- Member count (e.g., "22 members")
- Channels monitored (e.g., "51 channels")

**Technical Notes:**

- Data available from `getBotStats()` in `/src/lib/bot-stats.ts`
- Updates every 10 minutes from MongoDB
- Consider client-side countdown for uptime display

---

## 🎨 Feature Ideas

### 2. Uptime Easter Egg Counter

**Description:** Playful display showing how long Amina has been running
**Possible Locations:**

- Footer section (hidden/hoverable)
- Landing page easter egg
- Dashboard widget

**Display Format Options:**

- "Amina's been watching over Discord for 2d 14h 3m 24s 🛡️"
- "Bot uptime: 2d 14h 3m"
- "Alive for 2 days, 14 hours, 3 minutes"

**Implementation:**

- Client-side JavaScript countdown
- Calculate: `botStats.uptime + (Date.now() - botStats.lastUpdated)`
- Updates every second without API calls
- Show only when uptime > 0 (bot is alive)
- Smart formatting: hide days/hours when value is 0

**Tone:** Decide between playful ("Amina's been awake") or serious ("Bot uptime")

---

### 3. Ping Display

**Description:** Show bot ↔ Discord API latency
**Location:** "i know just the place" - TBD by user 👀
**Data:** `botStats.ping` (currently -1ms, needs bot restart to show real value)
**Different from:** Uptime Kuma ping (UK ↔ Bot server)

**Possible Uses:**

- Badge in header
- Tooltip on hover
- Status indicator with color coding:
  - 🟢 Green: < 100ms
  - 🟡 Yellow: 100-200ms
  - 🔴 Red: > 200ms

---

### 4. Channels Stat

**Description:** Number of channels bot is monitoring
**Priority:** Low (technical metric, less user-facing)
**Possible Use:** Admin dashboard "nerd stats" section
**Data:** `botStats.channels` (currently 51)

---

### 5. Status Page Enhancement

**Description:** Dedicated `/status` page combining UK + bot stats
**Features:**

- Uptime Kuma uptime percentage (e.g., "99.9% uptime")
- Bot uptime duration (e.g., "Alive for 2d 14h")
- Bot ping (e.g., "42ms response time")
- Service status (online/offline)
- Serving stats (guilds, members, channels)

---

## 📊 Data Available

From `getBotStats()` in `/src/lib/bot-stats.ts`:

```typescript
{
  guildCount: number;        // ✅ Currently used in BattleStats
  memberCount: number;       // ✅ Currently used in BattleStats (actual count!)
  cached: boolean;           // Internal use
  cacheAge?: number;         // Internal use
  lastUpdated?: Date;        // When bot last updated stats

  // Available but not exposed in interface yet:
  channels: number;          // From BOT_STATS.channels
  ping: number;              // From BOT_STATS.ping
  uptime: number;            // From BOT_STATS.uptime (seconds)
}
```

---

## 🔧 Technical Implementation Notes

### Extending BotStats Interface

To expose additional stats, update `/src/lib/bot-stats.ts`:

```typescript
export interface BotStats {
  guildCount: number;
  memberCount: number;
  channels?: number; // Add this
  ping?: number; // Add this
  uptime?: number; // Add this (in seconds)
  cached: boolean;
  cacheAge?: number;
  lastUpdated?: Date;
}
```

### Client-Side Uptime Countdown

```javascript
// Calculate live uptime without API calls
const uptimeInSeconds = botStats.uptime;
const lastUpdated = new Date(botStats.lastUpdated);
const now = Date.now();
const timeSinceUpdate = (now - lastUpdated.getTime()) / 1000;
const currentUptime = uptimeInSeconds + timeSinceUpdate;

// Format: "2d 14h 3m 24s"
// Update display every second
```

---

## 📝 Next Steps

1. **Decide on priorities:** Which feature to implement first?
2. **Design bot info card:** Mockup/wireframe for user card
3. **Choose ping location:** Where should ping be displayed?
4. **Uptime easter egg placement:** Footer, dashboard, or hidden section?
5. **Extend BotStats interface:** Add channels, ping, uptime fields
6. **Create components:** BotInfoCard, UptimeCounter, PingBadge, etc.

---

## 🎯 Current Status

- ✅ Bot stats data flowing from MongoDB
- ✅ Dashboard reads stats every 10 minutes
- ✅ Guild count and member count displayed on landing page
- ⏳ Uptime, ping, channels data available but not displayed
- ⏳ Bot info card component - not created yet
- ⏳ Easter egg features - not implemented yet

---

**Last Updated:** November 9, 2025
**Data Source:** MongoDB `dev-configs` collection → `BOT_STATS` field
**Update Frequency:** Every 10 minutes (bot's presence handler)
