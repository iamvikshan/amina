# Multi-User Conversation Support Roadmap

## Goal: Achieve 10/10 Multi-User Conversation Quality

### Current State: 6/10

- ✅ Basic multi-user awareness (sees all messages)
- ✅ Conversation flow maintained
- ❌ No speaker attribution
- ❌ Single-user memory context only
- ❌ Ambiguous pronoun/reference handling
- ❌ No profile data integration

---

## Phase 1: Speaker Attribution Foundation

**Priority: CRITICAL | Estimated Effort: Medium**

### 1.1 Update ConversationBuffer Message Interface

**File:** `src/structures/conversationBuffer.ts`

**Changes:**

```typescript
export interface Message {
  role: 'user' | 'model'
  content: string
  timestamp: number
  // NEW FIELDS:
  userId?: string // Discord user ID
  username?: string // Display name for context
  displayName?: string // Guild nickname or username
}
```

**Rationale:** Store speaker identity with each message for attribution.

### 1.2 Update ConversationBuffer.append()

**Changes:**

- Accept `userId`, `username`, `displayName` as optional parameters
- Store these fields when appending user messages
- Keep backward compatibility (existing messages won't have these fields)

**Migration Strategy:**

- New messages get attribution
- Old messages in buffer will lack attribution (acceptable, they'll expire)

### 1.3 Update aiResponder.handleMessage()

**Changes:**

- Pass user info when appending to buffer:
  ```typescript
  conversationBuffer.append(
    conversationId,
    'user',
    message.content,
    message.author.id,
    message.author.username,
    message.member?.displayName || message.author.username
  )
  ```

---

## Phase 2: Enhanced History Formatting

**Priority: HIGH | Estimated Effort: Medium**

### 2.1 Create History Formatter

**File:** `src/services/aiResponder.ts` (new method)

**Function:** `formatHistoryForAI(history: Message[]): ConversationMessage[]`

**Logic:**

```typescript
private formatHistoryForAI(history: Message[]): ConversationMessage[] {
  return history.map(msg => {
    if (msg.role === 'model') {
      return { role: 'model', parts: [{ text: msg.content }] }
    }

    // User message with attribution
    if (msg.userId && msg.displayName) {
      // Format: "Alice: I like pizza"
      const attributedContent = `${msg.displayName}: ${msg.content}`
      return { role: 'user', parts: [{ text: attributedContent }] }
    }

    // Fallback for old messages without attribution
    return { role: 'user', parts: [{ text: msg.content }] }
  })
}
```

### 2.2 Update GoogleAiClient Integration

**File:** `src/services/aiResponder.ts` (handleMessage method)

**Changes:**

- Use `formatHistoryForAI()` before sending to AI
- This gives AI: `"Alice: I like pizza"` instead of just `"I like pizza"`

**Benefits:**

- AI can track who said what
- Resolves pronoun ambiguity
- Enables user-specific responses

---

## Phase 3: Multi-User Profile Context

**Priority: HIGH | Estimated Effort: High**

### 3.1 Track Active Participants

**File:** `src/services/aiResponder.ts` (new method)

**Function:** `getActiveParticipants(history: Message[], currentUserId: string): Set<string>`

**Logic:**

- Scan last N messages (e.g., 10-15)
- Collect unique `userId`s from user messages
- Include current message author
- Return Set of active participant IDs

### 3.2 Fetch Participant Profiles

**File:** `src/services/aiResponder.ts` (new method)

**Function:** `getParticipantProfiles(userIds: string[]): Promise<Map<string, any>>`

**Logic:**

- Batch fetch user data for all participants
- Extract relevant profile fields:
  - `pronouns` (for correct pronoun usage)
  - `bio` (for context)
  - `interests` (for topic awareness)
  - `region` (for location context)
  - `languages` (for language preferences)
  - `favorites` (for preferences)
- Respect privacy settings (`profile.privacy.*`)
- Cache results for conversation duration

### 3.3 Build Multi-User Context Prompt

**File:** `src/services/aiResponder.ts` (update handleMessage)

**Changes:**

```typescript
// Get active participants
const participants = this.getActiveParticipants(history, message.author.id)
const participantIds = Array.from(participants)

// Fetch profiles for all participants
const participantProfiles = await this.getParticipantProfiles(participantIds)

// Build context section
let participantContext = '\n\n**Conversation Participants:**\n'
for (const [userId, profile] of participantProfiles.entries()) {
  const user = await message.client.users.fetch(userId).catch(() => null)
  if (!user) continue

  const name =
    message.guild?.members.cache.get(userId)?.displayName || user.username
  participantContext += `\n**${name}** (${user.username}):\n`

  if (profile.pronouns) {
    participantContext += `- Pronouns: ${profile.pronouns}\n`
  }
  if (profile.bio) {
    participantContext += `- Bio: ${profile.bio.substring(0, 200)}\n`
  }
  if (profile.interests?.length > 0) {
    participantContext += `- Interests: ${profile.interests.join(', ')}\n`
  }
  if (profile.region) {
    participantContext += `- Region: ${profile.region}\n`
  }
}

enhancedPrompt += participantContext
```

**Benefits:**

- AI knows who's in the conversation
- Correct pronoun usage (he/she/they)
- Context-aware responses
- Respects user preferences

---

## Phase 4: Multi-User Memory Context

**Priority: MEDIUM | Estimated Effort: High**

### 4.1 Recall Memories for All Participants

**File:** `src/services/aiResponder.ts` (update handleMessage)

**Current:** Only recalls memories for current message author

**New Approach:**

```typescript
// Recall memories for all active participants
const allMemories = new Map<string, RecalledMemory[]>()

for (const userId of participantIds) {
  const userMemories = await memoryService.recallMemories(
    message.content, // Use current message for relevance
    userId,
    guildId,
    3, // Fewer per user to avoid token bloat
    {
      combineDmWithServer: userData.minaAi?.combineDmWithServer || false,
      globalServerMemories: userData.minaAi?.globalServerMemories !== false,
    }
  )
  allMemories.set(userId, userMemories)
}

// Build memory context grouped by user
let memoryContext = '\n\n**Relevant Memories by Participant:**\n'
for (const [userId, memories] of allMemories.entries()) {
  if (memories.length === 0) continue

  const user = await message.client.users.fetch(userId).catch(() => null)
  if (!user) continue

  const name =
    message.guild?.members.cache.get(userId)?.displayName || user.username
  memoryContext += `\n**${name}:**\n`
  memories.forEach(m => {
    memoryContext += `- ${m.key}: ${m.value}\n`
  })
}

enhancedPrompt += memoryContext
```

**Optimization:**

- Limit to top 3 memories per user
- Only include if relevance score > threshold
- Cache memory lookups

### 4.2 Update Memory Extraction

**File:** `src/services/memoryService.ts` (extractMemories)

**Enhancement:**

- When extracting memories from multi-user conversation
- Include speaker attribution in extraction prompt:
  ```
  Conversation:
  Alice: I'm allergic to peanuts
  Bot: Noted!
  Bob: I love peanut butter
  ```
- AI can extract: "Alice is allergic to peanuts" (attributed correctly)

---

## Phase 5: Advanced Context Awareness

**Priority: LOW | Estimated Effort: Medium**

### 5.1 Conversation Threading

**Enhancement:** Track conversation topics/threads within a channel

**Use Case:**

- Multiple simultaneous conversations in one channel
- Bot can identify which conversation thread a message belongs to
- Maintain separate context per thread

**Implementation:**

- Analyze message references (replies)
- Group messages by reply chains
- Maintain separate conversation IDs per thread

### 5.2 User Relationship Context

**Enhancement:** Track relationships between users in conversation

**Use Case:**

- "Tell Alice about my project" - bot knows who Alice is
- "What did Bob say earlier?" - bot can reference Bob's messages

**Implementation:**

- Build participant graph from conversation history
- Include in context: "Alice and Bob are in this conversation"

### 5.3 Temporal Context

**Enhancement:** Include timezone-aware context

**Use Case:**

- "When can we meet?" - bot knows participants' timezones
- "What time is it for you?" - bot can calculate

**Implementation:**

- Use `profile.timezone` from participants
- Include in context: "Alice (UTC-5), Bob (UTC+2)"

---

## Phase 6: Performance & Optimization

**Priority: MEDIUM | Estimated Effort: Medium**

### 6.1 Caching Strategy

- Cache participant profiles for conversation duration
- Cache memory lookups (with TTL)
- Batch user fetches

### 6.2 Token Management

- Limit participant context size
- Prioritize most relevant memories
- Truncate long bios/profiles
- Use summaries for large context

### 6.3 Rate Limiting

- Consider multi-user conversations in rate limiting
- Per-participant cooldowns vs per-channel

---

## Implementation Order

### Sprint 1: Foundation (Phases 1-2)

**Goal:** Basic speaker attribution

- Update Message interface
- Update ConversationBuffer
- Format history with names
- **Result:** AI can distinguish speakers

### Sprint 2: Profile Integration (Phase 3)

**Goal:** Use existing profile data

- Track active participants
- Fetch profiles
- Build participant context
- **Result:** Pronouns, bio, interests available

### Sprint 3: Memory Context (Phase 4)

**Goal:** Multi-user memory recall

- Recall memories for all participants
- Group by user
- **Result:** Full context for all users

### Sprint 4: Polish (Phases 5-6)

**Goal:** Advanced features & optimization

- Threading, relationships, timezones
- Performance optimization
- **Result:** 10/10 multi-user support

---

## Success Metrics

### Before (Current: 6/10)

- ❌ "What did Alice say?" → Bot doesn't know who Alice is
- ❌ "Tell her about X" → Ambiguous pronoun
- ❌ Only current user's memories used
- ❌ No profile context

### After (Target: 10/10)

- ✅ "What did Alice say?" → Bot references Alice's messages
- ✅ "Tell her about X" → Bot knows "her" = Alice (from pronouns)
- ✅ All participants' memories included
- ✅ Full profile context (pronouns, bio, interests)
- ✅ User-specific preferences respected
- ✅ Natural multi-user conversations

---

## Technical Considerations

### Backward Compatibility

- Old messages in buffer won't have attribution (acceptable)
- Graceful fallback when profile data missing
- Privacy settings respected

### Privacy

- Only include profile data if `profile.privacy.*` allows
- Don't expose private information
- Respect user preferences

### Performance

- Batch operations where possible
- Cache aggressively
- Limit context size to avoid token limits

### Testing Scenarios

1. Two users discussing preferences
2. Three users planning event
3. User asking about another user's statement
4. Pronoun resolution in multi-user context
5. Memory recall for multiple users
6. Profile data integration

---

## Estimated Timeline

- **Sprint 1:** 1-2 weeks (Foundation)
- **Sprint 2:** 1-2 weeks (Profiles)
- **Sprint 3:** 1-2 weeks (Memory)
- **Sprint 4:** 1 week (Polish)

**Total:** 4-7 weeks for full 10/10 implementation

---

## Quick Wins (Can implement immediately)

1. **Add userId to Message interface** - 30 min
2. **Pass userId when appending** - 15 min
3. **Format history with usernames** - 1 hour
4. **Fetch pronouns for participants** - 2 hours

**Total:** ~4 hours for basic speaker attribution improvement
