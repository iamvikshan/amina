# Amina Conversational AI Integration Spec

## 1. Context

- **Amina** is a multi-purpose Discord bot (Bun + Discord.js v14) with extensive guild automation but no true conversational AI.
- **Mimo** implements a conversation-first experience with per-user API keys and OpenAI.
- **Goal:** Integrate conversational AI into Amina using a single owner-provided Google AI Studio key, while retaining Amina's command-driven architecture and guardrails.

---

## 2. Business Goals

1. **Let Amina answer users conversationally** when pinged in guild channels.
2. **Support "free will" channels** where Amina replies to every message without requiring mentions.
3. **Enable DMs with Amina** to behave like a private chat.
4. **Maintain tight owner control** – no per-user keys, no custom prompts by regular users.
5. **Keep latency low** via aggressive caching of guild settings and short-lived conversation state.

---

## 3. Technical Goals

1. **Clear permission hierarchy:** Bot Owner (global) > Guild Owner/Admin (channel-level)
2. **Single source of truth** for configuration (env → dev schema → guild schema with clear precedence)
3. **Structured logging only** – no noisy Honeybadger spam on conversational paths; errors logged to structured logs (pino)
4. **Deterministic error recovery** – failures don't auto-disable; only disable on repeated failures (5+ in 10 min)
5. **Low operational complexity** – simple ring buffer for conversations, no Pinecone/vector DB for MVP

---

## 4. Non-Goals / Later (Out of Scope for MVP)

- Per-user prompts or custom API keys
- ~~Persistent long-term memory (Pinecone/vector store)~~ **MOVED TO v1.1**
- Multiple free-will channels per guild
- Dynamic prompt editing by regular users
- Per-channel custom system prompts
- Streaming responses / partial typing updates

---

## 4.1. Memory System (v1.1 Feature)

### Goals

1. **Remember user context** across sessions (name, preferences, past topics)
2. **Recall guild-specific information** (inside jokes, recurring topics, server culture)
3. **Keep costs near-zero** using free-tier services or MongoDB
4. **Stay fast** (< 500ms memory lookup overhead)

### Memory Approaches (Free-Tier Friendly)

#### Option A: MongoDB-Only Memory (Recommended for Start)

**Pros:**

- Already have MongoDB; zero additional cost
- Simple to implement (just CRUD operations)
- No external dependencies
- Works with existing backup/restore

**Cons:**

- No semantic search (must use exact matches or basic text search)
- Can't easily find "similar" conversations
- Manual pruning needed to avoid bloat

**Implementation:**

```typescript
// New Collection: ai_memories
{
  _id: ObjectId,
  userId: String,           // Discord user ID
  guildId: String | null,   // null for DMs
  memoryType: 'user' | 'guild' | 'topic',
  key: String,              // e.g., 'user_name', 'favorite_game'
  value: String,            // e.g., 'Alex', 'Minecraft'
  context: String,          // Short snippet of when this was learned
  importance: Number,       // 1-10 score for pruning low-value memories
  createdAt: Date,
  lastAccessedAt: Date,
  accessCount: Number,
}

// Indexes:
// - { userId: 1, guildId: 1, memoryType: 1 }
// - { guildId: 1, importance: -1 }
// - { lastAccessedAt: 1 } for pruning
```

**Usage Pattern:**

1. After each conversation, extract key-value pairs (e.g., "user said they like cats" → `{key: 'likes', value: 'cats'}`)
2. On new message, fetch top 5-10 relevant memories for that user/guild
3. Inject into system prompt: "Remember: User's name is Alex, they like cats..."
4. Periodically prune memories with low `importance` and old `lastAccessedAt`

**Extraction:** Use Gemini itself to extract memories:

```
System: After this conversation, extract 0-3 key facts worth remembering.
Format: {"key": "...", "value": "...", "importance": 1-10}
```

---

#### Option B: MongoDB + Google AI Embeddings (Free Tier)

**Pros:**

- Semantic search via vector similarity
- Gemini API includes embedding endpoint (`embedding-001` model) - **FREE**
- Still stores in MongoDB (we just add a `vector` field)

**Cons:**

- Slightly more complex (need to compute embeddings)
- MongoDB vector search requires Atlas ($$$) OR we do client-side cosine similarity

**Implementation:**

```typescript
// Collection: ai_memories
{
  ...existing fields from Option A,
  embedding: Array<Number>, // 768-dim vector from Gemini embedding-001
}

// On memory creation:
const embedding = await gemini.embedContent(memory.value)
memory.embedding = embedding

// On recall (client-side similarity):
const queryEmbedding = await gemini.embedContent(userMessage)
const memories = await fetchAllUserMemories(userId, guildId)
const ranked = memories
  .map(m => ({ ...m, score: cosineSimilarity(queryEmbedding, m.embedding) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
```

**Cost:** Gemini embeddings are **free** (no quota on embedding-001 model as of Nov 2024)

---

#### Option C: Upstash Vector (Free Tier: 10K vectors, 10K queries/day)

**Pros:**

- Purpose-built for vector search
- Free tier sufficient for small-medium bot
- REST API (no SDK bloat)
- Auto-scaling

**Cons:**

- External dependency
- Need to sync deletions between Mongo + Upstash
- Free tier limits (but reasonable for starting out)

**Implementation:**

- Store memory metadata in MongoDB
- Store vectors + search in Upstash
- Link via memory ID

---

#### Option D: Hybrid (Recommended for Scale)

**Phase 1 (Now):** MongoDB-only with keyword matching
**Phase 2 (When > 100 servers):** Add Gemini embeddings + client-side similarity
**Phase 3 (When > 500 servers):** Migrate to Upstash or Pinecone paid tier

---

### Recommended Approach: **Option A → Option B**

**Start with Option A** because:

1. Zero new dependencies
2. Fast to implement (~2-3 hours)
3. Works for 90% of use cases (user names, preferences, simple facts)
4. Can always add embeddings later without migration pain

**Upgrade to Option B when:**

- Users request "remember when we talked about..." queries
- Need semantic search ("I like dogs" should recall "user loves pets")
- Memory corpus grows > 1000 entries per guild

---

### Memory Lifecycle

**1. Extraction (Post-Response)**

```typescript
// After successful AI response
if (shouldExtractMemory(conversationLength)) {
  const memoryPrompt = `
    Based on this conversation, extract 0-3 facts worth remembering long-term.
    Only extract clearly stated facts (name, preferences, important events).
    Format as JSON: [{"key": "...", "value": "...", "importance": 1-10}]
  `
  const facts = await extractMemories(conversationHistory)
  await saveMemories(userId, guildId, facts)
}
```

**2. Recall (Pre-Response)**

```typescript
// Before generating response
const memories = await fetchRelevantMemories(userId, guildId, limit: 10)
const memoryContext = memories.map(m => `${m.key}: ${m.value}`).join('\n')
const enhancedPrompt = `${systemPrompt}\n\nRemembered facts:\n${memoryContext}`
```

**3. Pruning (Background Job)**

```typescript
// Every 24 hours
await pruneMemories({
  olderThan: 90 days,
  importance: < 3,
  accessCount: < 2,
})
```

---

### Schema Addition

```typescript
// MongoDB Collection: ai_memories
interface AiMemory {
  _id: ObjectId
  userId: string
  guildId: string | null
  memoryType: 'user' | 'guild' | 'topic'
  key: string
  value: string
  context: string // snippet of convo where learned
  importance: number // 1-10
  createdAt: Date
  lastAccessedAt: Date
  accessCount: number
  embedding?: number[] // Optional for Option B
}
```

### Commands Addition

```typescript
// /dev mina-ai memory-stats
// Shows: total memories, top users, avg importance

// /mina-ai forget-me
// User command: deletes all their memories in current guild

// /dev mina-ai prune-memories
// Owner command: force pruning run
```

---

### Performance Budget

- Memory lookup: < 100ms (MongoDB indexed query)
- Embedding generation (Option B): < 200ms (Gemini API)
- Total overhead: < 300ms per message (acceptable)

---

### Privacy & Compliance

1. **User Data:** Only store what users explicitly share in conversation
2. **Deletion:** `/forget-me` command wipes all memories
3. **Audit:** Log memory creation/deletion for GDPR compliance
4. **Transparency:** Add `/memories` command showing what bot remembers about user

---

## 4. Non-Goals / Later (Out of Scope for MVP)

- Per-user prompts or custom API keys
- Persistent long-term memory (Pinecone/vector store)
- Multiple free-will channels per guild
- Dynamic prompt editing by regular users
- Per-channel custom system prompts
- Streaming responses / partial typing updates

---

## 5. Functional Requirements

| ID  | Requirement                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| FR1 | When @mentioned in a guild channel, Amina replies with an AI-generated response (unless guild disabled feature).                             |
| FR2 | When free-will mode is enabled for a configured channel, Amina replies to every user message in that channel without requiring mentions.     |
| FR3 | In DMs, Amina replies to all user messages if `allowDMs=true` (no mention concept in DMs).                                                   |
| FR4 | Guild admins **cannot** change AI provider, model, or system prompt; only the bot owner (via `/dev` command) can.                            |
| FR5 | Provide a bot-owner-only slash command (`/dev ai-config`) to view/toggle global AI settings and edit system prompt, model, max tokens.       |
| FR6 | Provide a guild-admin-only slash command (`/mina-ai`) to enable/disable AI for their guild, set free-will channel, toggle mention-only mode. |
| FR7 | Respect Discord rate limits and apply per-user cooldowns (e.g., 3s) to avoid spam.                                                           |
| FR8 | Surface clear error fallbacks (e.g., config missing, API error) via ephemeral replies or channel messages—never raw stack traces.            |
| FR9 | Log AI activity to structured logs (pino) with debug level; reserve Honeybadger for genuine system failures only.                            |

---

## 6. High-Level Architecture

### 6.1 Intents & Client Setup

- Enable `GatewayIntentBits.DirectMessages` and `Partials.Channel` so DM events are received.
- Modify `messageCreate` listener to not early-return on `!message.guild` (allow DMs through).

### 6.2 Service Layers

**AI Responder Service** (`src/services/aiResponder.ts`)

- Orchestration layer: decides whether to reply based on eligibility (mention, free-will, DM).
- Manages rate limiting and cooldown checks.
- Builds conversation context from buffer.
- Coordinates with Google AI client and cache.

**Conversation Buffer** (`src/structures/conversationBuffer.ts`)

- Simple ring buffer (max 20 messages) with TTL per conversation ID.
- Key: `conversationId` (format: `guild:${guildId}:channel:${channelId}` or `dm:${userId}`).
- Provides `append()`, `getContext()`, `pruneExpired()`.
- Daemon cleanup every 5 minutes via `setInterval`.

**Google AI Client** (`src/helpers/googleAiClient.ts`)

- Wrapper around Gemini API (or Google Generative AI SDK).
- Loads `GEMINI_KEY` from env.
- Enforces timeout (20s) and token limits (1024).
- Normalizes errors (429 quota, timeout, malformed response).
- Returns structured response: `{ text, tokensUsed, latency }`.

**Config Manager** (`src/config/aiResponder.ts`)

- Single source of truth for all AI settings.
- Precedence: env vars > dev schema > defaults.
- Lazy-loads and caches; invalidates on dev command updates.

### 6.3 Data Access & Caching

- **Guild Settings Cache**: Extend existing `FixedSizeMap` to include new AI fields.
- **Dev Schema Cache**: Simple Map with TTL for global config (invalidated on `/dev` updates).
- **Conversation Cache**: `ConversationBuffer` class with daemon cleanup.

---

## 7. Data Model Changes

### 7.1 MongoDB `Guild` Collection

Add new sub-document to `Guild.ts`:

```typescript
aiResponder: {
  enabled: { type: Boolean, default: false },
  freeWillChannelId: { type: String, default: null },      // null = mention-only mode
  mentionOnly: { type: Boolean, default: true },           // true = require @mention; false = free-will
  allowDMs: { type: Boolean, default: true },              // per-guild DM toggle
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: null },              // user ID for audit
}
```

**Notes:**

- `enabled` can only be set to `true` if global AI is enabled (bot owner).
- `freeWillChannelId` and `mentionOnly` are toggles within this guild's scope.
- No `systemPrompt` or `temperature` stored here—only in dev schema (global).

### 7.2 Dev Schema (Global Bot Config)

Extend existing `BotConfig` / `DevConfig` collection:

```typescript
aiConfig: {
  globallyEnabled: { type: Boolean, default: false },
  model: { type: String, default: 'models/gemini-flash-latest' },
  maxTokens: { type: Number, default: 1024 },
  timeoutMs: { type: Number, default: 20000 },
  systemPrompt: { type: String, default: 'You are Amina, a helpful Discord bot...' },
  temperature: { type: Number, default: 0.7 },
  dmEnabledGlobally: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: null },
}
```

**Notes:**

- `GEMINI_KEY` remains in env only (never stored in Mongo).
- Only bot owner can edit via `/dev mina-ai`.
- Changes are immediately reflected in config cache.

---

## 8. Environment Variables

Validated on startup:

```bash
# Secrets (env only)
GEMINI_KEY=<your-google-ai-studio-key>

# Defaults (can be overridden in dev schema)
GEMINI_MODEL=models/gemini-flash-latest
MAX_TOKENS=1024
TIMEOUT_MS=20000
RESPONSE_CACHE_TTL_MS=60000
DM_ENABLED_GLOBALLY=true
SYSTEM_PROMPT="You are Amina, a helpful Discord bot assistant. Keep responses concise."

```

---

## 9. Permission Model

### 9.1 Hierarchy

1. **Bot Owner** (the bot already checks this for DEV commands)
   - Can toggle global AI on/off
   - Can edit system prompt, model, max tokens, temperature
   - Can toggle global DM support
   - Command: `/dev mina-ai`

2. **Guild Owner / Admin** (bot checks this already)
   - Can enable/disable AI for their guild (if globally enabled)
   - Can set free-will channel
   - Can toggle mention-only mode
   - Command: `/mina-ai`

3. **Regular Users**
   - Can trigger AI responses by mentioning or in free-will channels / DMs
   - No configuration access

---

## 9. Message Flow

### 9.1 Capture Phase

In `events/messageCreate.ts`:

1. Filter out: bots, system messages, webhooks
2. Determine context: guild channel vs DM
3. Call `AiResponderService.shouldRespond(message)` → boolean

### 9.2 Eligibility Phase

`AiResponderService.shouldRespond()` logic:

```
if message is bot or system → false
if message.guild is null (DM):
  if globallyEnabled AND dmEnabledGlobally AND guild.aiResponder.allowDMs → "dm"
  else → false
else (guild channel):
  if NOT guild.aiResponder.enabled → false
  if guild.aiResponder.freeWillChannelId === message.channelId AND enabled → "freeWill"
  if guild.aiResponder.mentionOnly AND message mentions bot → "mention"
  if NOT guild.aiResponder.mentionOnly → "freeWill"
  else → false
```

Returns mode: `"dm" | "mention" | "freeWill" | false`

### 9.3 Rate Limiting Phase

- Key format: `${message.channelId}:${message.author.id}`
- Per-user cooldown: 3 seconds
- Per-channel free-will cooldown: 1 message per second (prevents bot spam)
- If cooldown active, silently drop (no error message)

### 9.4 Context Building Phase

1. Look up conversation from buffer (key: `guild:${guildId}:channel:${channelId}` or `dm:${userId}`)
2. If found and not expired, retrieve last N messages (default 9)
3. If not found, start fresh
4. Build system prompt from config
5. Compose payload for Google API

### 9.5 Response Handling Phase

1. Show typing indicator: `message.channel.sendTyping()`
2. Call Google AI client with composed payload
3. On success:
   - Send reply to channel/DM
   - Append user message + bot response to conversation buffer
   - Log to structured logs with latency + tokens
4. On error (timeout, API error, quota):
   - Send fallback message (ephemeral if slash, otherwise channel message)
   - Log error to structured logs (pino warn level)
   - Increment failure counter for this guild (sliding window)
   - If failures > 5 in 10 min, disable AI for guild and notify owner

---

## 10. Conversation Buffer & Caching Strategy

### 10.1 ConversationBuffer Class

```typescript
class ConversationBuffer {
  private cache: Map<string, ConversationEntry> = new Map()
  private readonly MAX_MESSAGES = 20
  private readonly TTL_MS = 10 * 60 * 1000 // 10 minutes

  append(conversationId: string, role: 'user' | 'assistant', content: string) {
    const entry = this.cache.get(conversationId) || {
      messages: [],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    }
    entry.messages.push({ role, content, timestamp: Date.now() })
    if (entry.messages.length > this.MAX_MESSAGES) {
      entry.messages.shift()
    }
    entry.lastActivityAt = Date.now()
    this.cache.set(conversationId, entry)
  }

  getContext(conversationId: string): string {
    const entry = this.cache.get(conversationId)
    if (!entry || Date.now() - entry.lastActivityAt > this.TTL_MS) {
      this.cache.delete(conversationId)
      return ''
    }
    return entry.messages.map(m => `${m.role}: ${m.content}`).join('\n')
  }

  pruneExpired() {
    const now = Date.now()
    for (const [id, entry] of this.cache.entries()) {
      if (now - entry.lastActivityAt > this.TTL_MS) {
        this.cache.delete(id)
      }
    }
  }
}

// Start daemon cleanup on bot startup
setInterval(() => conversationBuffer.pruneExpired(), 5 * 60 * 1000)
```

### 10.2 Guild Settings Cache

Extend existing `FixedSizeMap`:

```typescript
// In settings lookup:
const guildSettings = getSettingsCache.get(guildId)
// Now includes: aiResponder: { enabled, freeWillChannelId, ... }
```

### 10.3 Config Cache

```typescript
class ConfigCache {
  private cache: any = null
  private lastFetch: number = 0
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  async getConfig() {
    if (this.cache && Date.now() - this.lastFetch < this.TTL) {
      return this.cache
    }
    this.cache = await DevConfig.findOne({ type: 'aiConfig' })
    this.lastFetch = Date.now()
    return this.cache
  }

  invalidate() {
    this.cache = null
    this.lastFetch = 0
  }
}
```

---

## 11. Google AI Client Abstraction

### 11.1 GoogleAiClient Class

```typescript
class GoogleAiClient {
  private apiKey: string
  private model: string
  private timeout: number

  constructor(apiKey: string, model: string, timeout: number) {
    this.apiKey = apiKey
    this.model = model
    this.timeout = timeout
  }

  async generateResponse(
    systemPrompt: string,
    conversationContext: string,
    userMessage: string,
    maxTokens: number,
    temperature: number
  ): Promise<{ text: string; tokensUsed: number; latency: number }> {
    const startTime = Date.now()

    try {
      const payload = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.parseContext(conversationContext),
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
      }

      const response = await this.callAPI(payload)
      const latency = Date.now() - startTime

      return {
        text: response.content,
        tokensUsed: response.usage?.total_tokens || 0,
        latency,
      }
    } catch (error) {
      this.normalizeError(error)
      throw error
    }
  }

  private parseContext(context: string): Message[] {
    // Parse conversation buffer format into message objects
    // e.g., "user: hello\nassistant: hi\n..." → [{ role, content }, ...]
  }

  private async callAPI(payload: any) {
    // Implementation using Google Generative AI SDK or direct REST call
    // Handle 429 (quota), timeouts, malformed responses
  }

  private normalizeError(error: any) {
    if (error.status === 429) {
      throw new Error('API quota exceeded')
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error('API timeout')
    }
    throw error
  }
}
```

---

## 12. Command Surface

### 12.1 `/dev mina-ai` (Bot Owner Only)

**Subcommands:**

| Subcommand        | Input      | Effect                                                                    |
| ----------------- | ---------- | ------------------------------------------------------------------------- |
| `status`          | —          | Display global AI status (enabled, model, max tokens, system prompt hash) |
| `toggle-global`   | on/off     | Enable/disable AI for entire bot                                          |
| `set-model`       | model name | Update `GEMINI_MODEL` in dev schema                                       |
| `set-tokens`      | number     | Update `MAX_TOKENS` in dev schema                                         |
| `set-prompt`      | text       | Update `SYSTEM_PROMPT` in dev schema                                      |
| `set-temperature` | 0.0-1.0    | Update temperature in dev schema                                          |
| `toggle-dm`       | on/off     | Toggle global DM support                                                  |

**Response:** Ephemeral message confirming change + new config state.

### 12.2 `/mina-ai` (Guild Admin Only)

**Subcommands:**

| Subcommand             | Input              | Effect                                                             |
| ---------------------- | ------------------ | ------------------------------------------------------------------ |
| `status`               | —                  | Display guild AI status (enabled, free-will channel, mention-only) |
| `enable`               | —                  | Set `guild.aiResponder.enabled = true` (requires global enabled)   |
| `disable`              | —                  | Set `guild.aiResponder.enabled = false`                            |
| `set-freewill-channel` | channel:<#channel> | Set `freeWillChannelId` and auto-set `mentionOnly=false`           |
| `mention-only`         | true/false         | Toggle between mention-only and free-will mode                     |
| `toggle-dms`           | on/off             | Toggle DM support for this guild                                   |

**Response:** Ephemeral message confirming change + new guild AI config state.

---

## 14. Error Handling & Observability

### 14.1 Logging Strategy

- **Debug level (pino):** Conversation flow, context retrieved, latency
- **Info level:** Commands executed, config changed
- **Warn level:** API errors, rate limits, failures
- **Error level:** Crash-level issues, missing secrets
- **Honeybadger:** Reserved for system failures only (uncaught exceptions, critical config issues) I already have a well defined logger, if we can just log there it will be better than spamming Honeybadger with non-critical issues.

```typescript
logger.debug('AI response generated', {
  guildId,
  channelId,
  tokensUsed,
  latencyMs,
})
logger.warn('AI API error', { guildId, error: err.message, retryCount })
// NOT Honeybadger for conversational failures
```

### 14.2 Error Recovery

1. **Transient errors** (API timeout, rate limit):
   - Send fallback message: "I'm having trouble thinking right now. Try again in a moment."
   - Log as warn, don't disable

2. **Repeated failures** (5+ in 10 minutes, sliding window):
   - Auto-disable AI for affected guild
   - Send DM to guild owner: "AI has been disabled due to repeated failures. Check logs."
   - Log as error

3. **Config errors** (missing GEMINI_KEY, invalid model):
   - Error on startup, exit with clear message
   - Never silently fall back

### 14.3 Metrics / Observability Hooks (for future dashboard)

```typescript
metrics.increment('ai.response.success', { guildId })
metrics.increment('ai.response.error', { error: err.type, guildId })
metrics.histogram('ai.response.latency_ms', latency)
metrics.histogram('ai.response.tokens_used', tokens)
```

---

## 15. Testing Plan

### 15.1 Unit Tests

- **ConversationBuffer**: TTL expiry, ring buffer wraparound, context formatting
- **AiResponderService**: Eligibility logic (mention, free-will, DM), permission checks
- **GoogleAiClient**: Error normalization (429, timeout), payload building
- **Config**: env override precedence, cache invalidation

### 15.2 Integration Tests

- **Message flow**: Mock Google API, assert reply sent for mention + free-will
- **DM flow**: Ensure no guild reference needed
- **Permission checks**: Assert non-owner cannot run `/dev` command
- **Cache behavior**: Restart bot, assert settings persist

### 15.3 Manual Smoke Tests

1. Create test guild with mention-only mode; ping bot and verify reply
2. Set free-will channel; send regular message and verify reply
3. Send DM to bot; verify reply (if DM enabled)
4. Run `/dev mina-ai toggle-global off`; verify bot stops responding
5. Verify guild admin cannot run `/dev` command
6. Verify `/mina-ai` denies non-admin users

---

## 16. Rollout Strategy

### Phase -1: Pre-Deploy Verification

- Deploy code with feature flag `AI.ENABLED=false` in config.
- Verify bot starts without crashes.
- No runtime changes to guild settings.

### Phase 0: Schema Deploy

- Deploy MongoDB schema changes (add `aiResponder`, `aiConfig`).
- Defaults ensure no active features.

### Phase 1: Bot Owner Testing

- Enable global AI via `/dev mina-ai toggle-global on`
- Enable for bot owner's personal guild
- Test mention-only mode, free-will channel, DMs
- Monitor structured logs; verify no Honeybadger spam
- Duration: 24-48 hours

### Phase 2: Staged Guild Rollout

- Select 2-3 trusted guilds
- Enable via `/mina-ai enable`
- Test with real conversations
- Gather feedback on response quality / latency
- Duration: 1 week

### Phase 3: General Availability

- Document feature in README
- Add help text to slash commands
- Enable for all guilds that opt-in via `/mina-ai`
- Monitor metrics and error rates

### Phase 4: Optimization (Post-MVP)

- Analyze response latency and token usage
- Consider batching or caching common questions
- Plan long-term memory (Pinecone) if demand warrants

### Quick Rollback

Set env var `AI.ENABLED=false` and restart bot. All AI features immediately disabled.

---

## 17. Future Enhancements / Open Questions

- **Multi-channel free-will**: Store array of channel IDs per guild
- **Per-channel custom prompts**: Owner-managed variants of system prompt per channel
- **Persistent memory**: Vector store (Pinecone) for long-term context
- **Streaming responses**: Partial updates as bot thinks
- **Analytics dashboard**: Show response counts, average latency, most common topics
- **User-reported feedback**: Thumbs up/down on responses for quality tracking

---

**This spec is ready for implementation. Clear boundaries, no ambiguity, minimal operational overhead for MVP.**
