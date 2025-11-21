# AI Profile Update System Spec

**Goal:** Enable the AI (mina) to detect when users mention profile information in conversation and offer to update their profiles automatically, with a confirmation flow. This enhances UX by allowing natural profile updates through conversation instead of requiring manual `/profile` commands.

**Status:** 📋 **PLANNED** - To be implemented after AI-COMMAND-EXECUTION-SPEC.md phases are complete.

---

## Overview

When users mention profile information in conversation (e.g., "i was born on 2/9/2002", "my pronouns are they/them"), the AI will:

1. Detect the information using function calling
2. Extract and validate the data
3. Show a confirmation embed with preview
4. Execute update on user confirmation
5. Provide feedback maintaining "mina" personality

This follows the established handler pattern from previous phases with modular structure, confirmation flows, and proper routing.

---

## Implementation Status

### 📋 Phase 7: AI Profile Update System

**Priority:** MEDIUM | **Estimated Effort:** 9-13 hours

**Status:** Not Started

---

## Structure: Modularized into `/src/handlers/ai-profile/` directory

**Modules:**

- `extraction.ts` - Extract profile updates from AI function calls
- `validation.ts` - Validate extracted data using existing validators
- `confirmation.ts` - Confirmation flow (embeds, buttons)
- `execution.ts` - Execute profile updates to database
- `shared/utils.ts` - Shared utilities (date parsing, field mapping, state management)
- `index.ts` - Barrel export for clean imports

**Types:** AI Profile handler types to be added to `/types/global.d.ts`

---

## Technical Architecture

### 1. Google AI Client Enhancement

**File:** `src/helpers/googleAiClient.ts`

**Changes:**

- Add function calling support via Gemini `tools` parameter
- Define function schemas for profile updates
- Return both text response and function calls
- Update `AiResponse` interface

**New Interface:**

```typescript
export interface FunctionCall {
  name: string
  arguments: Record<string, any>
}

export interface AiResponse {
  text: string
  tokensUsed: number
  latency: number
  functionCalls?: FunctionCall[] // NEW
}
```

**Function Schemas:**

```typescript
const profileUpdateFunctions = [
  {
    name: 'update_profile_birthdate',
    description:
      'Update user birthdate when they mention their birthday or birth date',
    parameters: {
      type: 'object',
      properties: {
        birthdate: {
          type: 'string',
          description:
            'Birthdate in DD/MM/YYYY or MM/YYYY format (e.g., "02/09/2002" or "09/2002")',
        },
      },
      required: ['birthdate'],
    },
  },
  {
    name: 'update_profile_basic',
    description:
      'Update basic profile fields (pronouns, region, languages, timezone)',
    parameters: {
      type: 'object',
      properties: {
        pronouns: {
          type: 'string',
          description: 'User pronouns (e.g., "they/them", "she/her", "he/him")',
        },
        region: {
          type: 'string',
          description:
            'User region/location (e.g., "Canada", "New York", "UK")',
        },
        languages: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of languages user speaks',
        },
        timezone: {
          type: 'string',
          description: 'User timezone (e.g., "UTC-5", "EST", "PST")',
        },
      },
      required: [],
    },
  },
  {
    name: 'update_profile_misc',
    description: 'Update miscellaneous profile fields (bio, interests, goals)',
    parameters: {
      type: 'object',
      properties: {
        bio: {
          type: 'string',
          description: 'User bio/about me text (max 1000 chars)',
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of user interests/hobbies',
        },
        goals: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of user goals',
        },
      },
      required: [],
    },
  },
]
```

**Implementation Notes:**

- Use Gemini's `tools` parameter in `getGenerativeModel()` config
- Parse function calls from response using `response.functionCalls()` or similar
- Handle both text-only and function-call responses
- Maintain backward compatibility (if no function calls, work as before)

---

### 2. Profile Update Extraction Service

**File:** `src/services/aiProfileService.ts` (new)

**Purpose:** Centralized service for extracting, validating, and processing profile updates from AI function calls.

**Interfaces:**

```typescript
interface ProfileUpdate {
  type: 'birthdate' | 'basic' | 'misc'
  fields: Record<string, any>
  userId: string
  timestamp: number
}

interface ValidationResult {
  isValid: boolean
  errors?: string[]
  validatedData?: any
}

interface UpdatePayload {
  userId: string
  basicUpdates?: {
    pronouns?: string
    region?: string
    languages?: string[]
    timezone?: string
    birthdate?: Date
    age?: number
  }
  miscUpdates?: {
    bio?: string
    interests?: string[]
    goals?: string[]
  }
}
```

**Methods:**

```typescript
class AiProfileService {
  /**
   * Extract profile updates from AI function calls
   */
  extractProfileUpdates(
    functionCalls: FunctionCall[],
    userId: string
  ): ProfileUpdate[]

  /**
   * Validate extracted profile update data
   */
  validateProfileUpdate(update: ProfileUpdate): ValidationResult

  /**
   * Build update payload for database
   */
  buildUpdatePayload(updates: ProfileUpdate[]): UpdatePayload

  /**
   * Generate unique hash for update (for state management)
   */
  generateUpdateHash(update: ProfileUpdate): string
}
```

**Validation Logic:**

- Reuse existing `validateBirthdate()` from `src/handlers/profile/shared/utils.ts`
- Validate pronouns format (basic check: contains "/")
- Validate languages (non-empty strings)
- Validate timezone (basic format check)
- Validate bio length (max 1000 chars)
- Validate interests/goals (arrays of non-empty strings)

---

### 3. Confirmation Flow Handler

**File:** `src/handlers/ai-profile/confirmation.ts`

**Pattern:** Follow Phase 2 (Roles Hub) confirmation pattern with two-step preview → confirm flow.

**Flow:**

1. AI detects profile update opportunity → calls function
2. Extract and validate data
3. Show confirmation embed with:
   - What will be updated
   - Current value vs new value (if exists)
   - "Confirm" and "Cancel" buttons
4. On confirm → execute update → success message
5. On cancel → dismiss with casual message

**Components:**

**Confirmation Embed:**

```typescript
function buildConfirmationEmbed(
  update: ProfileUpdate,
  currentProfile: any
): EmbedBuilder {
  // Show field-by-field comparison
  // Highlight what's changing
  // Maintain "mina" personality in description
}
```

**Button Handlers:**

- `ai-profile:btn:confirm|{userId}|{updateHash}` - Confirm and execute
- `ai-profile:btn:cancel|{userId}` - Cancel update

**State Management:**

- Store pending updates in memory cache (Map)
- Key format: `ai-profile:pending:{userId}:{updateHash}`
- TTL: 5 minutes (auto-expire)
- Include full update payload in cache

**Success/Error Messages:**

- Success: "updated your profile. check it with `/profile view`"
- Cancel: "k, not updating then"
- Error: "something went wrong. try `/profile` command instead"

---

### 4. Execution Handler

**File:** `src/handlers/ai-profile/execution.ts`

**Purpose:** Execute validated profile updates to database.

**Methods:**

```typescript
async function executeProfileUpdate(
  updateHash: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  // 1. Retrieve pending update from cache
  // 2. Verify userId matches (security check)
  // 3. Check if update still valid (not expired)
  // 4. Execute update using existing functions:
  //    - updateBasicProfile() for basic fields
  //    - updateMiscProfile() for misc fields
  // 5. Clear cache entry
  // 6. Return success/error
}
```

**Database Functions Used:**

- `updateBasicProfile(userId, basicData)` - For pronouns, region, languages, timezone, birthdate
- `updateMiscProfile(userId, miscData)` - For bio, interests, goals
- `getUser(user)` - To fetch current profile for comparison

**Error Handling:**

- Database errors → Log and return user-friendly message
- Validation errors → Should not reach here (caught earlier)
- Cache miss → "update expired, try again"
- User mismatch → Security error, log and reject

---

### 5. Integration with AI Responder

**File:** `src/services/aiResponder.ts`

**Changes:**

- After AI response, check for function calls
- If profile update function calls detected:
  - Extract and validate
  - Show confirmation (don't auto-update)
  - Continue with normal text response
- Handle confirmation button interactions separately

**Flow:**

```
User: "i was born on 2/9/2002"
  ↓
AI generates response + function call: update_profile_birthdate("2/9/2002")
  ↓
aiResponder detects function call
  ↓
Extract & validate → Show confirmation embed
  ↓
AI sends normal text response: "got it, updating your profile rq"
  ↓
User clicks "Confirm" → Execute update → Success message
```

**Implementation:**

```typescript
// In handleMessage(), after generating response:
if (result.functionCalls && result.functionCalls.length > 0) {
  const profileUpdates = aiProfileService.extractProfileUpdates(
    result.functionCalls,
    message.author.id
  )

  if (profileUpdates.length > 0) {
    // Show confirmation for each update
    for (const update of profileUpdates) {
      await showProfileUpdateConfirmation(message, update)
    }
  }
}
```

**Button Interaction Handler:**

```typescript
// In interactionCreate.ts or separate handler
if (interaction.isButton() && interaction.customId.startsWith('ai-profile:')) {
  await handleAiProfileButton(interaction)
}
```

---

### 6. System Prompt Enhancement

**File:** `src/data/prompt.md` (add new section)

**New Section to Add:**

```markdown
## 6. Profile Updates (When to Use Functions)

You can help users update their profiles when they explicitly mention:

- **Birthdate:** "i was born on...", "my birthday is...", "born 2/9/2002", "i'm 22 years old" (calculate birthdate)
- **Pronouns:** "my pronouns are...", "i use they/them", "call me she/her"
- **Region:** "i'm from...", "i live in...", "i'm in canada"
- **Languages:** "i speak...", "i know...", "i'm learning..."
- **Interests:** "i like...", "i'm into...", "i enjoy..."
- **Bio:** "about me: ...", "i'm a...", when they describe themselves
- **Timezone:** "i'm in EST", "my timezone is...", "it's 3pm here" (infer timezone)

**Rules:**

- Only update if user **explicitly states** it (not inferred or assumed)
- Always use function calls - never update directly
- Be casual about it: "got it, updating your profile rq" or "noted, saving that"
- Don't be pushy - if they don't confirm, drop it
- If they already have that info set, mention it: "you already have that set, want to change it?"
- For birthdate, prefer DD/MM/YYYY format, but accept MM/YYYY if day not mentioned
- For age mentions, calculate approximate birthdate (current year - age, use January 1st)
- Only call ONE function per message (don't spam function calls)
```

---

## Routing (Following Spec Pattern)

### Buttons

- `ai-profile:btn:confirm|{userId}|{updateHash}` - Confirm profile update
- `ai-profile:btn:cancel|{userId}` - Cancel update

### State Management

- In-memory cache (Map) for pending updates
- Key format: `ai-profile:pending:{userId}:{updateHash}`
- TTL: 5 minutes (auto-cleanup)
- Store: `{ update: ProfileUpdate, timestamp: number }`

### Interaction Handler

- Add to `src/events/interactions/interactionCreate.ts` or create `src/handlers/ai-profile/index.ts`
- Route button interactions to confirmation handler

---

## Privacy & Safety Considerations

### Security

- ✅ Only update user's own profile (verify `userId` matches message author)
- ✅ Validate all inputs using existing validators
- ✅ Age validation (13+ requirement from existing validator)
- ✅ Date validation (not future, reasonable range)
- ✅ Cache expiration (5 min TTL prevents stale updates)

### Privacy

- ✅ Respect privacy settings (don't update if user has disabled profile features)
- ⚠️ **Question:** If user has `profile.privacy.showBirthdate: false`, should AI still offer to update birthdate (just hidden), or not offer at all?
- ✅ Only update fields user explicitly mentions
- ✅ Don't infer or assume information

### User Experience

- ✅ Confirmation required (no auto-updates)
- ✅ Clear preview of what's changing
- ✅ Success/error feedback
- ✅ Maintain "mina" personality in all messages
- ✅ Non-blocking (AI still responds normally, confirmation is separate)

---

## Error Handling

### Validation Errors

- Invalid date formats → Show error in confirmation embed, disable confirm button
- Age < 13 → Show error: "sorry! you must be at least 13 years old"
- Future dates → Show error: "time traveler detected! date can't be in the future"
- Invalid pronouns format → Show warning but allow (let user decide)
- Bio too long → Truncate and show preview, ask for confirmation

### Database Errors

- Connection errors → Log and show: "something went wrong. try `/profile` command instead"
- Update conflicts → Log and retry once, then show error
- Missing user → Create user record first, then update

### Function Call Errors

- Parsing errors → Fallback to text-only response (don't break conversation)
- Invalid function name → Log and ignore
- Missing required parameters → Show error in confirmation

---

## Testing Scenarios

### 1. Birthdate Update

- **Input:** "i was born on 2/9/2002"
- **Expected:** AI calls function → Confirmation shows → User confirms → Profile updated
- **Verify:** Database has correct birthdate and calculated age

### 2. Multiple Fields

- **Input:** "my pronouns are they/them and i'm from canada"
- **Expected:** AI calls function with both fields → Confirmation shows both → User confirms → Both updated
- **Verify:** Both pronouns and region updated in database

### 3. Invalid Date

- **Input:** "i was born on 99/99/9999"
- **Expected:** AI calls function → Validation fails → Error shown in confirmation → Confirm button disabled
- **Verify:** No database update, error message displayed

### 4. Cancel Flow

- **Input:** User mentions birthdate → Confirmation shown → User clicks "Cancel"
- **Expected:** Confirmation dismissed, no update, casual message: "k, not updating then"
- **Verify:** No database update, cache entry cleared

### 5. Privacy Settings

- **Input:** User with disabled profile → Mentions birthdate
- **Expected:** AI doesn't offer update OR offers but explains it won't be visible
- **Verify:** Behavior matches privacy settings

### 6. Already Set Field

- **Input:** User already has birthdate set → Mentions new birthdate
- **Expected:** AI offers update, confirmation shows old vs new value
- **Verify:** Update replaces old value

### 7. Age Calculation

- **Input:** "i'm 22 years old"
- **Expected:** AI calculates birthdate (current year - 22) → Calls function → Confirmation shows calculated date
- **Verify:** Birthdate set to approximate date (January 1st of calculated year)

### 8. Cache Expiration

- **Input:** User gets confirmation → Waits 6 minutes → Clicks confirm
- **Expected:** Error: "update expired, try again"
- **Verify:** Cache entry removed, no update executed

### 9. Multi-User Context

- **Input:** In group chat, user mentions their birthdate
- **Expected:** Only that user's profile update offered (not other participants)
- **Verify:** Update hash includes userId, only that user can confirm

### 10. Function Call Parsing Failure

- **Input:** AI response has malformed function call
- **Expected:** Fallback to text-only response, no confirmation shown, conversation continues normally
- **Verify:** No errors thrown, AI still responds with text

---

## Dependencies

### Existing (Reuse)

- ✅ `updateBasicProfile()` - `src/database/schemas/User.ts`
- ✅ `updateMiscProfile()` - `src/database/schemas/User.ts`
- ✅ `updateProfile()` - `src/database/schemas/User.ts`
- ✅ `validateBirthdate()` - `src/handlers/profile/shared/utils.ts`
- ✅ `calculateAge()` - `src/handlers/profile/shared/utils.ts`
- ✅ `getUser()` - `src/database/schemas/User.ts`

### New

- ❌ None (all functionality exists, just needs integration)

### Modifications Required

- `src/helpers/googleAiClient.ts` - Add function calling support
- `src/services/aiResponder.ts` - Handle function calls and show confirmations
- `src/data/prompt.md` - Add profile update instructions
- `src/events/interactions/interactionCreate.ts` - Route button interactions (or create handler)

---

## Estimated Timeline

- **Google AI Function Calling:** 2-3 hours
- **Profile Extraction Service:** 2-3 hours
- **Confirmation Flow Handler:** 3-4 hours
- **Integration & Testing:** 2-3 hours

**Total:** 9-13 hours

---

## Success Metrics

### Before (Current State)

- ❌ User says "i was born on 2/9/2002" → AI remembers but doesn't update profile
- ❌ User must manually use `/profile` command to update
- ❌ Profile updates require navigating modals and forms

### After (Target State)

- ✅ User says "i was born on 2/9/2002" → AI offers to update → User confirms → Profile updated
- ✅ Natural conversation flow for profile updates
- ✅ Maintains "mina" personality throughout
- ✅ Confirmation prevents accidental updates
- ✅ Works in both DMs and guild channels

---

## Open Questions (To Be Decided)

### 1. Confirmation Requirement

**Question:** Always require confirmation, or allow auto-updates for non-sensitive fields (e.g., interests)?

**Recommendation:** Always require confirmation for safety and user control. Even "non-sensitive" fields should be confirmed.

### 2. Multi-Field Updates

**Question:** If user says "i'm from canada and my pronouns are they/them", update both in one confirmation or separate?

**Recommendation:** One confirmation showing all fields being updated. More efficient UX.

### 3. Privacy Respect

**Question:** If user has `profile.privacy.showBirthdate: false`, should AI still offer to update birthdate (just hidden), or not offer at all?

**Recommendation:** Still offer to update (data is stored, just not visible). User might want to set it for internal use.

### 4. Function Calling Approach

**Question:** Use Gemini's native function calling, or parse JSON from AI response (like memory extraction)?

**Recommendation:** Use Gemini's native function calling for better reliability and structure. Falls back to text-only if unavailable.

### 5. Age Mentions

**Question:** When user says "i'm 22 years old", should AI calculate birthdate automatically or ask for exact date?

**Recommendation:** Calculate approximate birthdate (current year - age, use January 1st). Mention it's approximate in confirmation.

### 6. Already Set Fields

**Question:** If user already has a field set and mentions it again, should AI offer to update or just acknowledge?

**Recommendation:** Offer to update, showing old vs new value in confirmation. User might want to change it.

---

## Implementation Checklist

### Phase 7.1: Foundation

- [ ] Add function calling support to `GoogleAiClient`
- [ ] Define function schemas for profile updates
- [ ] Update `AiResponse` interface
- [ ] Test function calling with Gemini API

### Phase 7.2: Extraction Service

- [ ] Create `AiProfileService` class
- [ ] Implement `extractProfileUpdates()`
- [ ] Implement `validateProfileUpdate()`
- [ ] Implement `buildUpdatePayload()`
- [ ] Add validation logic (reuse existing validators)

### Phase 7.3: Confirmation Flow

- [ ] Create confirmation embed builder
- [ ] Implement button handlers
- [ ] Add state management (cache)
- [ ] Create confirmation UI components
- [ ] Add success/error message handlers

### Phase 7.4: Execution

- [ ] Create execution handler
- [ ] Integrate with database update functions
- [ ] Add error handling
- [ ] Add security checks (userId verification)

### Phase 7.5: Integration

- [ ] Update `aiResponder.handleMessage()` to detect function calls
- [ ] Add confirmation flow trigger
- [ ] Route button interactions
- [ ] Update system prompt
- [ ] Test end-to-end flow

### Phase 7.6: Testing & Polish

- [ ] Test all scenarios from Testing Scenarios section
- [ ] Fix edge cases
- [ ] Add logging for debugging
- [ ] Update documentation
- [ ] Performance testing (cache, database)

---

## Notes

- This feature enhances UX but is not critical path - can be implemented after core AI features
- Follows established patterns from previous phases for consistency
- Maintains "mina" personality in all interactions
- Privacy and security are top priorities
- Confirmation flow prevents accidental updates
- Works seamlessly with existing profile system

---

**Last Updated:** [Date when implemented]
**Status:** 📋 Planned
