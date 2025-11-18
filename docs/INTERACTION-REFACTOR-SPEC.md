# Amina Interaction Refactor Spec

**Goal:** Reduce subcommands while preserving functionality and improving UX with Discord components (menus, modals, buttons, context menus, autocomplete). This spec defines when to use each component, command-by-command migration plans, handler changes, naming conventions, and QA checks. Do not implement here; use as blueprint.

## Implementation Status

### ✅ Phase 1 Complete: Admin Hub & Server Settings

- **Structure:** Modularized into `/src/handlers/admin/` directory
- **Modules:**
  - `main-hub.ts` - Category menu + back button navigation
  - `settings/` - Server settings handlers & embeds
  - `ai/` - Mina AI configuration handlers
  - `logging/` - Logging configuration handlers
  - `shared/` - Reusable channel/role selectors
  - `index.ts` - Barrel export for clean imports
- **Types:** Admin handler types added to `/types/global.d.ts`
- **Commands Migrated:**
  - `/admin` → Main hub with 4 categories (Settings, Mina AI, Logging, Status)
  - Server Settings: Updates channel, staff roles (add/remove)
  - Mina AI: Toggle AI, free-will channel, mention-only mode, DM support
  - Logging: Log channel setup, toggle individual log types
  - Legacy `/settings` command disabled
- **Patterns Established:**
  - `deferUpdate()` → `editReply()` for all select menus
  - Back buttons on all terminal actions
  - Entity selects (Channel/Role) for guild resources
  - Proper state initialization with defaults

### ✅ Phase 2 Complete: Roles Hub

- **Structure:** Modularized into `/src/handlers/roles/` directory
- **Modules:**
  - `main-hub.ts` - Operation menu + back button navigation
  - `cleanup/method-select.ts` - Cleanup method selection
  - `cleanup/parameter-handlers.ts` - Modal inputs & role exclusion select
  - `cleanup/preview.ts` - Two-step confirmation preview
  - `cleanup/execute.ts` - Actual deletion with safety caps
  - `autorole/index.ts` - Autorole enable/disable with role validation
  - `create/index.ts` - Create role with basic/advanced setup
  - `add-to-user/index.ts` - Bulk role assignment to multiple users
  - `shared/placeholders.ts` - "Coming Soon" placeholders (no longer used)
  - `index.ts` - Barrel export for clean imports
- **Types:** Role handler types added to `/types/global.d.ts`
- **Commands Migrated:**
  - `/roles` → Main hub with 4 operations (Cleanup, Autorole, Create, Add to User)
  - **Cleanup:** All 4 methods (empty, prefix, below position, older than)
    - Parameter collection via modals (prefix, position, days)
    - Optional role exclusion via Role Select
    - Two-step preview → confirm flow with safety caps (250 roles max)
  - **Autorole:** Enable/disable automatic role assignment
    - Shows current status with role display
    - Enable: Role select with validation (hierarchy, managed, @everyone)
    - Disable: Confirmation flow before removing
    - Validates bot permissions and role hierarchy
  - **Create Role:** Basic & Advanced setup
    - Basic: Name + color via modal → instant creation
    - Advanced: Name + color + permission presets (Admin, Moderator, Support, None)
    - Permission modal → preset selection → creation with audit logging
  - **Add to User:** Bulk role assignment
    - User select (up to 25 users) → Role select → Preview with stats → Confirm → Execute
    - Shows assignment breakdown per user with skip detection (already has role)
    - Safety validation: role hierarchy, managed roles, bot permissions
  - Legacy `/autorole` command disabled (enabled: false)
- **Routing Added:**
  - String select: `roles:menu:operation`, `roles:menu:cleanup_method`, `roles:menu:perms|*`
  - Role select: `roles:role:keep`, `roles:role:autorole_select`, `roles:role:assign|*`
  - User select: `roles:user:select`
  - Modals: `roles:modal:prefix`, `roles:modal:position`, `roles:modal:older`, `roles:modal:create|basic`, `roles:modal:create|advanced`
  - Buttons: `roles:btn:back`, `roles:btn:back_cleanup`, `roles:btn:continue`, `roles:btn:confirm`, `roles:btn:cancel`, `roles:btn:autorole_enable`, `roles:btn:autorole_disable`, `roles:btn:autorole_disable_confirm`, `roles:btn:autorole_cancel`, `roles:btn:create_basic`, `roles:btn:create_advanced`, `roles:btn:assign_confirm|*`
- **Status:** ✅ All 4 operations fully implemented and production-ready

### ✅ Phase 3 Complete: Ticket System

- **Structure:** Modularized into `/src/handlers/ticket/` directory
- **Modules:**
  - `main-hub.ts` - Category menu (Setup, Manage) + back button navigation
  - `setup/menu.ts` - Setup operations menu
  - `setup/message.ts` - Ticket message creation with modal
  - `setup/log-channel.ts` - Log channel configuration
  - `setup/limit.ts` - Ticket limit setup with validation
  - `setup/topics.ts` - Topic management (list, add, remove with confirmation)
  - `manage/menu.ts` - Runtime operations menu with channel presence validation
  - `manage/close.ts` - Close single ticket with validation
  - `manage/close-all.ts` - Bulk close with two-step confirmation
  - `manage/add-user.ts` - Add users via User Select (up to 10)
  - `manage/remove-user.ts` - Remove users via User Select (up to 10)
  - `shared/utils.ts` - Utility functions (isTicketChannel, getTicketChannels, closeTicket, closeAllTickets, parseTicketDetails)
  - `shared/buttons.ts` - Button handlers (handleTicketOpen, handleTicketClose, handleTicketDelete)
  - `index.ts` - Barrel export for clean imports
- **Types:** Ticket handler types added to `/types/global.d.ts`
- **Commands Migrated:**
  - `/ticket` → Main hub with 2 categories (Setup, Manage)
  - **Setup Operations:**
    - Setup Message: Channel select → Modal (title, description, footer) → Create message with button
    - Log Channel: Channel select with permission validation
    - Ticket Limit: Modal input with validation (5-100)
    - Manage Topics: List, Add (modal + creates Discord category), Remove (select → confirmation → deletes category)
  - **Manage Operations:**
    - Close Ticket: Validates ticket channel, closes with handler (syncs perms, shows delete button)
    - Close All: Two-step confirmation → bulk close with results
    - Add User: User select (1-10) → Bulk add with permission overwrites
    - Remove User: User select (1-10) → Bulk remove with permission overwrites
  - Legacy subcommands removed (setup, log, limit, close, closeall, add, remove, topic/_, category/_)
  - **Legacy file removed:** `src/handlers/ticket.ts` → migrated to modular structure
- **Routing Added:**
  - String select: `ticket:menu:category`, `ticket:menu:setup`, `ticket:menu:manage`, `ticket:menu:topics`, `ticket:menu:topic_remove`
  - Channel select: `ticket:channel:message`, `ticket:channel:log`
  - User select: `ticket:user:add`, `ticket:user:remove`
  - Modals: `ticket:modal:message|ch:*`, `ticket:modal:limit`, `ticket:modal:topic_add`
  - Buttons: `ticket:btn:back`, `ticket:btn:back_setup`, `ticket:btn:back_manage`, `ticket:btn:back_topics`, `ticket:btn:closeall_confirm`, `ticket:btn:closeall_cancel`, `ticket:btn:topic_remove_confirm|topic:*`, `ticket:btn:topic_remove_cancel`, `ticket:btn:delete|ch:*`
  - Legacy buttons: `TICKET_CREATE`, `TICKET_CLOSE` (handled by shared/buttons.ts)
- **Features Implemented:**
  - **Topics System:** Topics create Discord categories automatically. When removed, both topic (DB) and category (Discord) are deleted. Handles cases where category doesn't exist.
  - **Category Permissions:** Bot, admin who ran command, and staff roles are added to all ticket categories (default and topic-based).
  - **Ticket Channel Permissions:** Channels inherit category permissions first, then user permissions are added. Prevents permission issues.
  - **Ticket Creation Flow:**
    - User clicks button → selects topic (if available) → channel created → DM sent with link → success message with link button
    - Safe fallback if DM fails
  - **Runtime Operations:** Validates admin is in ticket channel before allowing operations (except close all). Provides link to example ticket if not in channel.
  - **Ticket Closure Flow:**
    - Transcript generated BEFORE removing users (handles empty channels gracefully)
    - User DM'd with transcript link
    - Channel permissions synced with category (removes non-admins)
    - Final embed with delete button (instead of immediate deletion)
    - Delete button properly routes and handles channel deletion
  - **Error Handling:** Specific error messages for permission issues, missing access, channel limits. Better user guidance.
- **Patterns Established:**
  - `deferUpdate()` → `editReply()` for all select menus
  - Back buttons on all terminal actions with proper navigation hierarchy
  - Entity selects (Channel/User) for guild resources
  - Two-step confirmation for destructive operations (close all, remove topic)
  - Validation before operations (ticket channel check, permissions, limits)
  - Bulk operations with success/failure breakdown
  - Shared utilities pattern matching admin/roles structure
  - Permission inheritance: categories → channels → user overrides
  - Safe error handling with graceful fallbacks
- **Status:** ✅ Fully implemented, migrated, and production-ready

### ✅ Phase 4 Complete: Purge Command

- **Structure:** Modularized into `/src/handlers/purge/` directory
- **Modules:**
  - `main-hub.ts` - Type selection menu + default flow with proceed buttons
  - `parameters/amount-select.ts` - Amount preset selection (10, 25, 50, 100, Custom)
  - `parameters/amount-modal.ts` - Custom amount input modal
  - `parameters/token-modal.ts` - Token/keyword input modal (case-insensitive)
  - `parameters/user-select.ts` - User selection for user-specific purge
  - `parameters/channel-select.ts` - Optional channel selection (defaults to current)
  - `preview.ts` - Preview embed with confirmation buttons
  - `execute.ts` - Purge execution and result reporting
  - `index.ts` - Barrel export for clean imports
- **Types:** Purge handler types added to `/types/global.d.ts`
- **Commands Migrated:**
  - `/purge` → Main hub with 6 purge types (All, Attachments, Bots, Links, Token, User)
  - **Default Flow (Seamless):**
    - Type menu with "All Messages" preselected + Proceed button
    - Amount menu with 100 preselected + Proceed button
    - Channel selection with current channel preselected + Proceed button
    - Final confirmation → Execute
  - **Manual Selection Flow:**
    - User selects type from dropdown → Amount selection → Channel selection → Preview → Confirm
    - Token purge: Modal for keyword input → Amount selection → Channel selection → Preview
    - User purge: User select → Amount selection → Channel selection → Preview
  - **Amount Presets:** 10, 25, 50, 100 (Discord max per operation), Custom (1-100)
  - **Safety Caps:** Maximum 500 messages per command execution (5 batches of 100)
  - **Token Search:** Case-insensitive keyword matching
  - Legacy subcommands removed (all, attachments, bots, links, token, user)
- **Routing Added:**
  - String select: `purge:menu:type`, `purge:menu:amount|*`
  - Channel select: `purge:channel:select|*`
  - User select: `purge:user:select`
  - Modals: `purge:modal:token`, `purge:modal:amount|*`
  - Buttons: `purge:btn:back`, `purge:btn:confirm|*`, `purge:btn:cancel`, `purge:btn:use_current|*`, `purge:btn:proceed_type|*`, `purge:btn:proceed_amount|*`, `purge:btn:proceed_channel|*`
- **Features Implemented:**
  - **Default Flow:** Seamless progression with preselected defaults and Proceed buttons
  - **Manual Selection:** Full flexibility when users choose custom options
  - **Two-Step Confirmation:** Preview embed with Confirm/Cancel for all deletions
  - **Non-Ephemeral:** Audit trail visible to all (moderation action)
  - **Error Handling:** Clear messages for permissions, invalid inputs, channel access
  - **14-Day Limit:** Automatically skips messages older than 14 days (Discord API restriction)
  - **Batching:** Handles up to 500 messages in batches of 100 (Discord API limit)
- **Patterns Established:**
  - `deferUpdate()` → `editReply()` for all select menus
  - Back buttons on all views with proper navigation hierarchy
  - Default flow with preselected options and Proceed buttons for quick actions
  - Manual selection flow maintains full flexibility
  - Two-step confirmation for all destructive operations
  - State management via custom_id with base64 encoding for complex data
  - Non-ephemeral responses for audit trail (moderation commands)
- **Status:** ✅ Fully implemented, migrated, and production-ready

### ✅ Phase 5 Complete: Mina AI Memory Management

- **Structure:** Modularized into `/src/handlers/minaai/` directory
- **Modules:**
  - `main-hub.ts` - Context-aware operation menu + back button navigation
  - `memories.ts` - Server/DM memory viewing with category detail views, pagination, and pastebin export
  - `forget-me.ts` - Two-step confirmation for memory deletion (also sets ignoreMe to true)
  - `settings.ts` - User preference management (ignoreMe, allowDMs, combineDmWithServer, globalServerMemories)
  - `index.ts` - Barrel export for clean imports
- **Types:** MinaAI handler types added to `/types/global.d.ts`
- **Command Registration:**
  - `/mina-ai` command has `dmCommand: true` flag - available in DMs
  - Also has `testGuildOnly: true` for testing (registered in test guild + DMs)
  - Command registration logic updated to support `dmCommand` flag independent of `GLOBAL` setting
- **User Schema Updates:**
  - Added `minaAi` preferences object to User schema:
    - `ignoreMe` (default: false) - Never respond to user
    - `allowDMs` (default: true) - User-level DM toggle
    - `combineDmWithServer` (default: false) - Combine DM and server memories
    - `globalServerMemories` (default: true) - Use memories from all servers
- **Commands Migrated:**
  - `/mina-ai` → Context-aware hub (works in both DMs and servers)
    - **In Server:** Shows "Show Server Memories", "Forget Me", "Settings"
    - **In DM:** Shows "Show DM Memories", "Forget Me", "Settings"
    - Helpful messages guide users where to view what
  - **Show Server Memories:** View memories from current server only
    - Shows 2 memories per category (truncated preview)
    - Category buttons with short names (e.g., "User (18)", "Topic (8)")
    - "DM Me" button sends formatted pastebin link via DM
    - Stats display (total access count, average importance)
  - **Show DM Memories:** View memories from DMs only
    - Same structure as server memories
    - Separate query filtering by `guildId = null`
  - **Forget Me:** Two-step confirmation → bulk memory deletion
    - Preview embed with warning
    - Confirm/Cancel buttons
    - Shows deletion count and success message
    - **Also sets `ignoreMe: true`** after deletion
  - **Settings:** User preference management
    - Toggle Ignore Me (default: false)
    - Toggle Enable DM Chat (default: true, respects global config)
    - Toggle Combine DM/Server Memories (default: false)
    - Toggle Global Server Memories (default: true)
- **Category Detail View:**
  - Clicking category button shows all memories of that type
  - 5 memories per page, maximum 2 pages (10 memories total)
  - If >10 memories, shows "DM Me" button with pastebin link
  - Pagination buttons (Previous/Next) when applicable
  - Back button returns to main view
- **DM Me Functionality:**
  - Generates formatted pastebin with all memories
  - Formats memories by type (main view) or single type (category view)
  - Includes metadata: importance, location, created date, last accessed, access count
  - Sends DM with embed and link button
  - Falls back to ephemeral message if DMs disabled
  - Works for both main view and category detail view
- **Memory Service Updates:**
  - **Strict Filtering:** Fixed bug that allowed DM memories to leak into server contexts
  - **User Preferences Integration:** Memory recall respects user preferences:
    - `combineDmWithServer`: When enabled, allows DM and server memories to be used together
    - `globalServerMemories`: When enabled (default), uses memories from all servers; when disabled, only current server
  - **Context-Aware Queries:** Strict separation of DM vs Server memories unless explicitly combined
- **AI Responder Updates:**
  - **IgnoreMe Check:** Early check in `shouldRespond()` - if user has `ignoreMe: true`, Mina never responds
    - Sends helpful message if user tries to interact (DM or mention)
  - **User DM Preference:** Checks user-level `allowDMs` preference (respects global config)
  - **Memory Recall:** Passes user preferences to memory service for context-aware memory retrieval
- **Admin Handler Updates:**
  - Removed "Toggle DM Support" option from `/admin mina-ai` menu
  - DM support is now user-controlled (only developers can disable globally)
  - Added note explaining DM support is user-controlled
- **Command Handler Updates:**
  - Bot permission checks skip in DMs (no guild permissions in DMs)
  - Ephemeral responses disabled in DMs (not needed - just user and bot)
- **Routing Added:**
  - String select: `minaai:menu:operation`, `minaai:menu:settings`
  - Buttons: `minaai:btn:back`, `minaai:btn:category|type:*|mem_type:*|page:*`, `minaai:btn:category_page|type:*|mem_type:*|page:*`, `minaai:btn:back_memories|type:*|page:*`, `minaai:btn:dm_me|type:*|page:*`, `minaai:btn:dm_me_category|type:*|mem_type:*|page:*`, `minaai:btn:forget_confirm`, `minaai:btn:forget_cancel`
- **Features Implemented:**
  - **Context-Aware UI:** Different options shown in DMs vs Servers
  - **Separate Server/DM Views:** Server and DM memories are completely separated in the UI
  - **Truncated Previews:** Main view shows only 2 memories per category to keep embeds manageable
  - **Category Navigation:** Short-named buttons for each memory type category
  - **Pastebin Export:** Full memory export via pastebin for large datasets
  - **Pagination:** Category views support pagination (5 per page, max 2 pages)
  - **Memory Editing Reminder:** Clear note that memories cannot be manually edited, must ask Mina in chat
  - **State Preservation:** Memory type (server/dm) preserved through navigation
  - **User Preferences:** Full control over memory behavior and DM interactions
  - **IgnoreMe Functionality:** Users can prevent Mina from responding to them
  - **Global Server Memories:** Default enabled - Mina uses memories from all servers (better UX, saves storage)
- **Patterns Established:**
  - `deferUpdate()` → `editReply()` for all select menus
  - Back buttons on all views with proper navigation hierarchy
  - Short button labels for better UX (category names only)
  - Pastebin integration for large data exports (following ticket transcript pattern)
  - Two-step confirmation for destructive operations (forget me)
  - Pagination limits to prevent embed overflow (2 pages max in category view)
  - DM fallback handling for pastebin links
  - Context-aware command behavior (DM vs Server)
  - User preference management integrated into command flow

## Principles

- Some files are still in JavaScript; this is our golden chance to migrate them to TypeScript as we edit them. Refer to `./BRIEF.md` and `./TODO.md` for guidance.
- **GLOBAL CENTRALIZATION OF INTERACTION HANDLING** is key to maintainability as we scale component usage.
- If a file is getting too large, break it down into smaller modules.
- If modules can be shared, extract them to common files.
- types should be added to `../types/global.d.ts`, or if we must, create them in the folder `../types/*`
- **Use the barrel export `@types`** for clean imports: `import type { IGuildSettings, IUser } from 'types'` instead of full paths
- Keep actions discoverable: present a clear menu for top-level choices.
- Prefer entity selects over string options for guild entities (users, roles, channels).
- Use modals for free-form input, multi-field editing, long text, validation; use buttons for confirmation or navigation.
- Keep destructive actions two-step (preview → confirm).
- Default admin/config flows to ephemeral interactions.
- Enforce safety caps (e.g., bulk deletions) and role hierarchy constraints.
- Respect Discord limits (25 options per string select; one select per action row; 5 buttons per row).
- Maintain permissions/cooldowns exactly as today.
- for commands we will be working with, we will add the `testGuildOnly: true` flag to limit testing to guilds only. we will also retire replaced commands upon confirmation of successful implementation, and remove `testGuildOnly: true` flag after successful testing.

NOTE: ANY EXAMPLE CODE SNIPPETS ARE FOR ILLUSTRATION ONLY, during actual implementation please refer to the already existing codebase and best practices.

## Component Selection Guide

| Component              | Use Case                                                         | Limits & Notes                                                          |
| ---------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **String Select**      | Enumerations, small lists, modes/filters, pagination selectors   | Max 25 options per menu                                                 |
| **User Select**        | Select one or more users from guild                              | Use `min_values`/`max_values` for multi-select                          |
| **Role Select**        | Select one or more roles from guild                              | Use `min_values`/`max_values` for multi-select; respects hierarchy      |
| **Channel Select**     | Select one or more channels (text, voice, announcement)          | Filter by channel type using `channel_types` parameter                  |
| **Mentionable Select** | Select users OR roles in a single menu                           | Use when picking either users or roles interchangeably                  |
| **Modals**             | Free-form input, multi-field editing, long text, validation      | Show via `showModal()`; no timeout enforcement (user-driven submission) |
| **Buttons**            | Confirm/cancel, next/prev, lightweight toggles, action execution | Max 5 per row; set `disabled: true` on timeout                          |
| **Context Menus**      | Message/user targeted quick actions (right-click menu)           | Optional future consolidation                                           |
| **Autocomplete**       | Large/filtered string choices (>25) or remote search             | Add via `interaction.isAutocomplete()` support; separate handler        |

## Naming Conventions (custom_id)

Use predictable, namespaced IDs to route interactions. Format: `<cmd>:<type>[:<subtype>][:state]`

- **Menus:** `<cmd>:menu[:sub]` → e.g., `roles:menu`, `ticket:menu:setup`
- **Buttons:** `<cmd>:btn:<action>[:<state>]` → e.g., `roles:btn:confirm`, `logs:btn:toggle:on`
- **Modals:** `<cmd>:modal:<form>` → e.g., `roles:modal:prefix`, `admin:modal:minaai`
- **Autocomplete:** `<cmd>:autocomplete:<option>` (internal routing, not a custom_id)

**State Packing:** For pagination or selections, embed state compactly in custom_id using pipe-delimited values. Keep under 100 chars total.

- Example: `roles:menu:cleanup|page:2|filter:prefix` or `purge:btn:confirm|amount:50|user:123456`
- **Important:** Never include sensitive data (tokens, passwords, cleartext PII) in custom_id; validate all state on receipt.

## Handler Changes Required

### `events/interactions/interactionCreate.ts`

**Routing changes:**

- Add routing for entity selects: `isUserSelectMenu()`, `isRoleSelectMenu()`, `isChannelSelectMenu()`, `isMentionableSelectMenu()` in addition to `isStringSelectMenu()`.
- Add `interaction.isAutocomplete()` dispatcher that routes to a shared `autocompleteProviders` registry.
- Centralize select/button/modal routing by `custom_id` prefix instead of per-case switches where practical.

**Example routing structure:**

```typescript
if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu() || ...) {
  const [cmd, type, ...rest] = interaction.customId.split(':');
  const handler = componentHandlers.get(`${cmd}:${type}`) || globalFallback;
  await handler(interaction);
}

if (interaction.isAutocomplete()) {
  const { commandName, options } = interaction;
  const optionName = options.getFocused(true).name;
  const provider = autocompleteProviders.get(`${commandName}:${optionName}`);
  if (provider) await provider(interaction);
}
```

### `handlers/command.ts`

- Retain existing deferral logic; commands that show modals should **NOT** call `deferReply()` (modals are shown via `showModal()` before deferral).
- For other commands, defer as today; defer choice depends on whether interaction returns a modal or immediate response.

### New: `handlers/componentHelper.ts`

Add utility for awaiting component interactions with timeout + disabling on timeout:

```typescript
export async function awaitComponentWithTimeout(
  message: Message,
  filter: (i: Interaction) => boolean,
  timeoutMs: number = 60_000
): Promise<Interaction | null> {
  try {
    return await message.awaitMessageComponent({ filter, time: timeoutMs })
  } catch (err) {
    // Edit message to disable all components
    await message.edit({ components: [] })
    return null
  }
}
```

#### Global Helpers: Button Creation Utilities

Reusable utilities for creating consistent buttons across all handlers:

```typescript
interface ButtonOptions {
  customId: string
  label: string
  emoji?: string
  disabled?: boolean
}

interface LinkButtonOptions {
  url: string
  label: string
  emoji?: string
  disabled?: boolean
}

// Primary button (Blue/Blurple) - General purpose actions
createPrimaryBtn(options: ButtonOptions): ActionRowBuilder<ButtonBuilder>

// Secondary button (Grey) - Neutral or lower priority actions
createSecondaryBtn(options: ButtonOptions): ActionRowBuilder<ButtonBuilder>

// Success button (Green) - Confirmations or positive actions
createSuccessBtn(options: ButtonOptions): ActionRowBuilder<ButtonBuilder>

// Danger button (Red) - Destructive or risky actions
createDangerBtn(options: ButtonOptions): ActionRowBuilder<ButtonBuilder>

// Link button (Grey with URL) - External URL links
createLinkBtn(options: LinkButtonOptions): ActionRowBuilder<ButtonBuilder>
```

**Button Style Guide:**
| Style | Color | Usage | Helper Function |
| --------- | -------------- | --------------------------------- | -------------------- |
| Primary | Blue (Blurple) | General purpose actions | `createPrimaryBtn` |
| Secondary | Grey | Neutral or lower priority actions | `createSecondaryBtn` |
| Success | Green | Confirmations or positive actions | `createSuccessBtn` |
| Danger | Red | Destructive or risky actions | `createDangerBtn` |
| Link | Grey | External URL links | `createLinkBtn` |

**Usage Examples:**

```typescript
// Back button
await interaction.editReply({
  embeds: [embed],
  components: [
    createSecondaryBtn({
      customId: 'admin:btn:back',
      label: 'Back to Admin Hub',
      emoji: '◀️',
    }),
  ],
})

// Confirmation flow
const confirmRow = createDangerBtn({
  customId: 'purge:btn:confirm',
  label: 'Confirm Delete',
  emoji: '⚠️',
})

// External link
const docsRow = createLinkBtn({
  url: 'https://docs.example.com',
  label: 'View Documentation',
  emoji: '📚',
})
```

**Status:** ✅ Implemented and deployed across all admin handlers

### New: `handlers/autocomplete.ts` (or inline in `interactionCreate.ts`)

Centralized registry for autocomplete providers:

```typescript
export const autocompleteProviders = new Map<
  string,
  (i: AutocompleteInteraction) => Promise<void>
>()

// Registration example:
autocompleteProviders.set('dev:reload', async i => {
  const focused = i.options.getFocused()
  const choices = registeredCommands
    .filter(c => c.startsWith(focused))
    .slice(0, 25)
  await i.respond(choices.map(c => ({ name: c, value: c })))
})
```

## Cross-Cutting Policies

### Permissions & Safety

- **Command-level checks:** Enforce at `/` command entry (existing behavior).
- **Execution-level checks:** Re-check permissions immediately before executing dangerous operations (e.g., before deleting roles, banning users).
- **Role hierarchy:** Cannot interact with roles equal to or above the bot's highest role; skip managed (@everyone, @Discord, etc.) roles.
- **Managed role exclusions:** Never delete, edit, or interact with roles where `role.managed === true`.
- **Deletion caps:** Enforce per-transaction limits (e.g., `MAX_ROLES_DELETE = 250` per single cleanup operation). Do not accumulate across sessions.

### Ephemeral Behavior

- **Admin/config maintenance actions** (settings, logs, ticket setup, admin toggles): reply ephemeral by default.
- **Initial response:** Always ephemeral for admin flows.
- **Follow-ups (modals, menus, buttons):** Follow initial response; if initial is ephemeral, follow-ups remain visible only to user.
- **Error states:** Keep errors ephemeral when responding to ephemeral initial interaction.
- **Non-admin actions** (purge, moderation, profile): Use non-ephemeral (visible to all) to provide audit trail.

### Timeout Handling

- **Default timeout:** 60 seconds for all component interactions (select menus, buttons, autocomplete).
- **Component timeout:** On timeout, edit message to disable all components and append a hint (e.g., "⏱️ Interaction expired. Please try the command again.").
- **Modal timeout:** Modals are user-driven (no forced timeout). If user does not submit within a session, dismiss gracefully if component expires or session ends.

### Confirm Step (Destructive Actions)

**Destructive operations require a two-step confirmation flow:**

Destructive = Any operation that irreversibly removes or restricts data/permissions:

- Deleting roles, users, messages, tickets.
- Banning, kicking, timing out users.
- Disabling features (autorole, mina-ai, logging).
- Bulk operations (purge >25 messages, cleanup multiple roles).

**Non-destructive** = Viewing status, adding/enabling features, editing configs (where old value can be retrieved).

**Confirm flow:**

1. Show a **preview embed** with a summary of what will happen.
2. Present two buttons: `Confirm` and `Cancel`.
3. On `Confirm`, execute and show results (succeeded/failed breakdown).

### Audit Trail

- Log who executed bulk operations with reason/context where available (e.g., "Deleted 5 roles by @user#0001").
- Include counts: matched, deletable, skipped, failed.

## Command-by-Command Plans

### 2) `/mina-ai` — MEMORY MANAGEMENT HUB ✅ COMPLETE

**Previous state:** Single `/mina-ai` command with subcommands (memories, forget-me).

**Current state:** Context-aware hub-based memory management with user preferences, DM support, and strict memory filtering.

#### Implementation Details

**Step 1 — Command Registration**

- Added `dmCommand: true` flag - command available in DMs
- Added `testGuildOnly: true` for testing (registered in test guild + DMs)
- Command registration logic supports `dmCommand` independent of `GLOBAL` setting

**Step 2 — Main Hub (String Select `minaai:menu:operation`)**

- **Context-Aware:** Different options shown based on DM vs Server context
  - **In Server:** Show Server Memories, Forget Me, Settings
  - **In DM:** Show DM Memories, Forget Me, Settings
- Helpful messages guide users where to view what
- Settings option for user preference management

**Step 3 — Memory Views**

| Operation                | Flow                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Show Server Memories** | Query `guildId = currentGuild` (or all servers if global enabled) → Show 2 memories per category → Category buttons + DM Me button |
| **Show DM Memories**     | Query `guildId = null` → Show 2 memories per category → Category buttons + DM Me button                                            |
| **Forget Me**            | Two-step confirmation → Bulk delete all memories → Set `ignoreMe: true` → Show deletion count                                      |
| **Settings**             | User preference management with toggles for all preferences                                                                        |

**Step 4 — Category Detail View**

- Clicking category button → Show all memories of that type
- 5 memories per page, max 2 pages (10 total)
- If >10 memories → Show "DM Me" button with pastebin link
- Pagination buttons when applicable
- Back button to main view

**Step 5 — DM Me Functionality**

- Generates formatted pastebin with all memories
- Sends DM with embed and link button
- Falls back to ephemeral message if DMs disabled
- Works for both main view and category detail view

**Step 6 — User Preferences (Settings)**

- **Ignore Me:** Toggle to prevent Mina from responding (default: false)
- **Enable DM Chat:** User-level DM toggle (default: true, respects global config)
- **Combine DM/Server Memories:** Allow DM memories in servers and vice versa (default: false)
- **Global Server Memories:** Use memories from all servers (default: true)

**Step 7 — Memory Service Strict Filtering**

- Fixed bug that allowed DM memories to leak into server contexts
- Respects user preferences for memory combination and global server memories
- Context-aware queries with strict separation unless explicitly combined

**Components used:** String Select, Buttons, Pastebin Integration

**Notes:**

- Server and DM memories completely separated (unless user enables combination)
- Truncated previews (2 per category) to keep embeds manageable
- Short button labels (category name only)
- Pastebin export for large datasets
- Memory editing reminder included in all views
- Context-aware UI adapts to DM vs Server context
- User preferences control memory behavior and DM interactions
- Forget Me also sets ignoreMe to true

**Fixes Applied:**

- ✅ **Fixed:** `UserModel is not defined` error - Created `updateUserMinaAiPreferences()` helper function in `User.ts` schema
- ✅ **Fixed:** DM interaction blocking - Removed global DM blocking logic from `interactionCreate.ts`, allowing all DM-registered commands and their component interactions to work in DMs
- ✅ **Fixed:** Stats tracking in DMs - Added guild check before `getSettings()` call to prevent errors in DM context
- ✅ **Fixed:** Duplicate options - Removed "Back to Main Menu" from settings select menu (kept button only), removed "Forget Me" from main hub (moved to settings only)

**DM/Global Command Handling Improvements:**

- Commands with `dmCommand: true` are registered globally with `dm_permission: true` (independent of GLOBAL setting)
- No global DM blocking - if an interaction exists in DMs, it's allowed (only DM-enabled commands are registered there)
- Component interactions (buttons/menus/modals) from DM commands work automatically
- Individual commands can still validate guild requirements (defensive programming)

**Status:** ✅ Fully implemented, tested, and production-ready

---

### 3) `/ticket` — SPLIT INTO TWO LOGICAL SCOPES

**Current state:** Single `/ticket` command with mixed setup/management subcommands.

**New state:** Two commands:

- `/ticket setup` — Admin-only maintenance (configure system)
- `/ticket manage` — Runtime operations (close, add, remove — usable in ticket channels)

#### 3a) `/ticket setup` (Admin only)

**Step 1 — Setup Menu (String Select `ticket:menu:setup`)**

- Setup Ticket Message
- Configure Log Channel
- Set Ticket Limit
- Manage Topics

**Step 2 — Subflows**

| Operation                | Flow                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Setup Ticket Message** | Modal `ticket:modal:setup`: title, description, button label → create message in target channel (Channel Select first if needed) |
| **Log Channel**          | Channel Select (text) + Confirm button                                                                                           |
| **Ticket Limit**         | Modal `ticket:modal:limit`: integer (per-user open tickets) → Confirm                                                            |
| **Topics**               | Submenu `ticket:menu:topics`: List / Add / Remove                                                                                |
| — **Topics: List**       | Display embed with current topics                                                                                                |
| — **Topics: Add**        | Modal `ticket:modal:topic_add`: name, description → Confirm                                                                      |
| — **Topics: Remove**     | String Select (existing topics) → Confirm button                                                                                 |

#### 3b) `/ticket manage` (Runtime, in ticket channel)

**Step 1 — Manage Menu (String Select `ticket:menu:manage`)**

- Close Ticket
- Close All (bulk)
- Add User
- Remove User

**Step 2 — Subflows**

| Operation        | Flow                                                   |
| ---------------- | ------------------------------------------------------ |
| **Close Ticket** | Confirm button + archive channel (or set overwrites)   |
| **Close All**    | Confirm button + bulk close (limit to 50 at once)      |
| **Add User**     | User Select (multi) + Confirm → add to overwrites      |
| **Remove User**  | User Select (multi) + Confirm → remove from overwrites |

**Components used:** String Select, Channel Select, User Select, Modal, Buttons

**Notes:**

- Clear separation: setup (admin) vs. runtime (in-channel).
- Avoids command scope confusion.
- Topics managed hierarchically under setup.

---

### 4) `/purge` (moderation/purge.ts) — STREAMLINED BULK MESSAGE DELETION ✅ COMPLETE

**Previous state:** Subcommands for `all`, `attachments`, `bots`, `links`, `token`, `user` with channel/amount options.

**Current state:** Single command with guided flow using menus and modals, optimized with default flow for seamless experience.

**Implemented flow:**

**Step 1 — Purge Type (String Select `purge:menu:type`)**

- All messages (preselected in default flow)
- Messages with attachments
- Bot messages
- Messages with links
- Messages with token
- Messages from user

**Step 2 — Parameters**

| Type                             | Parameter Input                                                            |
| -------------------------------- | -------------------------------------------------------------------------- |
| All / Attachments / Bots / Links | Amount (String Select: 10, 25, 50, 100, Custom) + modal for custom (1-100) |
| Token                            | Modal `purge:modal:token`: text field for token/keyword (case-insensitive) |
| User                             | User Select (single)                                                       |
| Any type                         | Channel Select (text, optional — defaults to current)                      |

**Step 3 — Preview**

- Embed: "Will delete ~N messages of type X from #channel"
- Buttons: `purge:btn:confirm|{base64_state}` / `purge:btn:cancel`

**Step 4 — Execute & Report**

- Show final embed: deleted count, errors, timeout messages
- Handles batching (up to 500 messages in batches of 100)

**Default Flow Optimization:**

- **Type Selection:** "All Messages" preselected + Proceed button
- **Amount Selection:** 100 messages preselected + Proceed button
- **Channel Selection:** Current channel preselected + Proceed button (replaces "Use Current Channel")
- **Final Confirmation:** Preview → Confirm

**Manual Selection Flow:**

- User selects different options from dropdowns → Normal flow continues without Proceed buttons
- Full flexibility maintained for custom selections

**Components used:** String Select, Channel Select, User Select, Modal, Buttons

**Implementation details:**

- Non-ephemeral (audit trail visible)
- Two-step confirmation for all deletions
- Amount presets: 10, 25, 50, 100 (Discord max), Custom (1-100)
- Safety cap: Maximum 500 messages per execution
- Token search: Case-insensitive matching
- 14-day limit: Automatically skips messages older than 14 days
- Error handling: Clear messages for permissions, invalid inputs, channel access

---

### ✅ Phase 6 Complete: Dev Hub

- **Structure:** Modularized into `/src/handlers/dev/` directory
- **Modules:**
  - `main-hub.ts` - Category menu + back button navigation
  - `presence/` - Presence management handlers (migrated from `handlers/presence.ts`)
    - `handlers.ts` - Presence configuration flow
    - `update.ts` - Presence update logic (migrated from `handlers/presence.ts`)
    - `init.ts` - Presence initialization handler (migrated from `handlers/presence.ts`)
  - `tod/` - Truth or Dare question management
    - `menu.ts` - ToD operations menu
    - `add.ts` - Add question modal handler
    - `remove.ts` - Remove question modal handler
  - `reload.ts` - Command reload with autocomplete
  - `trig-settings.ts` - Trigger settings handler
  - `listservers.ts` - List servers with pagination
  - `minaai/` - Mina AI configuration submenu
    - `handlers.ts` - Mina AI operations handlers
  - `index.ts` - Barrel export for clean imports
- **Types:** Dev handler types added to `/types/global.d.ts`
- **Autocomplete System:**
  - Created `handlers/autocomplete.ts` - Centralized autocomplete registry
  - Registered reload autocomplete (commands + contexts)
  - Autocomplete routing added to `interactionCreate.ts`
- **Commands Migrated:**
  - `/dev` → Main hub with 6 categories (Presence Management, Truth or Dare, Command Reload, Trigger Settings, List Servers, Mina AI)
  - **Presence Management:** Modal (message, URL) → Type Select → Status Select → Confirm
    - Shows current configuration
    - Updates bot presence immediately after confirmation
  - **Truth or Dare:** Add/Remove operations
    - Add: Modal (category, question, rating) → Confirm
    - Remove: Modal (question ID) → Confirm
  - **Command Reload:** Type Select (Commands, Events, Contexts, All) → Execute
    - Autocomplete support for command names (registered but not yet used in UI)
  - **Trigger Settings:** Channel Select (optional) → Confirm (triggers onboarding)
    - Can trigger for specific server or all servers
  - **List Servers:** Direct display with pagination (10 per page)
    - Shows server name and ID
    - Pagination buttons (Previous/Next)
  - **Mina AI:** Submenu with 8 operations
    - Status: View current AI configuration
    - Toggle Global: Boolean select (Enable/Disable)
    - Set Model: Modal input
    - Set Tokens: Modal input (100-4096)
    - Set Prompt: Modal input (long text)
    - Set Temperature: Modal input (0-2)
    - Toggle DM: Boolean select (Enable/Disable)
    - Memory Stats: View memory system statistics
  - **Leaveserver:** Moved to separate command `/dev-leaveserver` (Discord.js limitation: commands with subcommands cannot be invoked directly)
  - Legacy `/presence` command removed (replaced by hub)
  - Legacy `exec` subcommand removed completely
- **Routing Added:**
  - String select: `dev:menu:category`, `dev:menu:tod`, `dev:menu:reload_type`, `dev:menu:presence_type`, `dev:menu:presence_status`, `dev:menu:minaai`, `dev:menu:minaai_*`
  - Channel select: `dev:channel:trig_settings`
  - Modals: `dev:modal:presence`, `dev:modal:tod_add`, `dev:modal:tod_remove`, `dev:modal:minaai_*`
  - Buttons: `dev:btn:back`, `dev:btn:back_*`, `dev:btn:presence_start`, `dev:btn:presence_confirm`, `dev:btn:trig_confirm`, `dev:btn:listservers_prev`, `dev:btn:listservers_next`
  - Autocomplete: `dev:autocomplete:reload` (internal routing)
- **Features Implemented:**
  - **Main Hub:** Category-based navigation with 6 operations
  - **Presence Management:** Full configuration flow with immediate application
  - **ToD Management:** Add/remove questions with validation
  - **Command Reload:** Reload commands, events, contexts, or all
  - **Trigger Settings:** Server onboarding trigger (single or all servers)
  - **List Servers:** Paginated server list with navigation
  - **Mina AI:** Complete AI configuration interface (8 operations)
  - **Autocomplete System:** Centralized registry for future use
- **Patterns Established:**
  - `deferUpdate()` → `editReply()` for all select menus
  - Back buttons on all views with proper navigation hierarchy
  - Entity selects (Channel) for guild resources
  - Modals for free-form input (ToD, Presence, Mina AI)
  - Boolean selects for toggle operations (Mina AI)
  - Pagination for large datasets (List Servers)
  - Autocomplete registration pattern for large lists
- **Status:** ✅ Fully implemented, tested, and production-ready

---

### 8) `/help` (utility/help.ts) — MAINTAIN EXISTING PATTERN

**Current implementation:** Category String Select + pagination buttons.

**Status:** No changes needed. Update descriptions in `/help` to reflect new command structures and flows.

---

### 9) `/profile` (utility/profile.js → profile.ts) — MIGRATE & ENHANCE

**Current state:** Modals and string select confirmation already in use.

**Enhancements:**

| Action           | Current                    | Proposed                                                                |
| ---------------- | -------------------------- | ----------------------------------------------------------------------- |
| **View Profile** | Command → Embed            | Keep as-is                                                              |
| **Set Field**    | Modal input                | Keep; maybe add multiline text modal fields                             |
| **Clear Field**  | String Select confirmation | **Change to button pair: [Yes/Confirm Clear] [No/Cancel]**              |
| **Edit Profile** | not implemented yet        | Modal `profile:modal:edit`: name, bio, status, avatar — validate fields |

**Components used:** Modal, Buttons

**Notes:**

- Full migration to TypeScript.
- Clarify "edit profile" scope (which fields are editable?).
- Simplify clear confirmation from select to buttons.

---

### 10) Moderation Basics (`ban`, `kick`, `timeout`, `voice`, `warnings`) — MINIMAL REFACTOR

**Current state:** Direct slash commands with user/duration/reason options.

**Proposed:** Keep slash options for speed; add optional confirmation for destructive actions.

| Command                               | Target Selection           | Confirmation                | Notes                                       |
| ------------------------------------- | -------------------------- | --------------------------- | ------------------------------------------- |
| `/ban <user> [reason]`                | User option or User Select | Two-step for permanent ban  | Show preview: user, reason, hierarchy check |
| `/kick <user> [reason]`               | User option                | Optional one-button confirm | Non-ephemeral (audit)                       |
| `/timeout <user> <duration> [reason]` | User option                | Optional button confirm     | Preview shows current timeout status        |
| `/voice <user> [action]`              | User option                | No confirm needed           | Move, mute, deafen (non-destructive)        |
| `/warnings <user>`                    | User option                | No confirm                  | View/manage warnings (non-destructive)      |

**Enhancement:** If `User` option is used, consider defaulting to User Select dropdown in Discord for consistency.

**Components used:** Button (confirm only), optional User Select

**Notes:**

- No modal needed (duration/reason kept as slash options).
- Permissions re-checked before execution.
- Non-ephemeral for audit trail visibility.

---

## Autocomplete (Optional, Nice-to-have)

Introduce centralized handler for `interaction.isAutocomplete()` to support large choice sets and dynamic/remote searches.

**Use cases:**

| Command           | Option           | Why Autocomplete         |
| ----------------- | ---------------- | ------------------------ |
| `/dev reload`     | command          | >25 registered commands  |
| `/ticket manage`  | topics remove    | >25 topics (if exists)   |
| `/roles cleanup`  | role IDs to keep | Dynamic list of role IDs |
| Search operations | name/ID          | Remote API lookup        |

**Registration pattern:**

```typescript
autocompleteProviders.set('dev:reload', async i => {
  const focused = i.options.getFocused()
  const matches = registeredCommands
    .filter(cmd => cmd.startsWith(focused))
    .slice(0, 25)
  await i.respond(matches.map(m => ({ name: m, value: m })))
})
```

**Registry location:** `handlers/autocomplete.ts` or inline in `interactionCreate.ts`.

---

## Error Handling & Edge Cases

### General Error Flow

1. **Validation fail (user input):** Reply (ephemeral if admin flow) with error message + hint for retry.
2. **Permission denied (late check):** Reply with "Permission denied" + reason (hierarchy, role managed, etc.).
3. **API error (Discord):** Reply with "Operation failed. Please try again or contact support."
4. **Timeout (component not interacted):** Edit original message to disable components + append hint.

### Specific Scenarios (refer to existing implications, if any)

| Scenario                                                              | Handling                                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| User tries to delete role above bot's highest role                    | Err: "Cannot delete roles above my highest role."                                                      |
| User tries to interact with managed role                              | Err: "Cannot modify managed roles."                                                                    |
| Confirm button clicked but permissions revoked                        | Err: "Permission check failed. Re-run command."                                                        |
| Modal submitted with invalid data (e.g., non-integer in amount field) | Err: "Invalid input. Please enter a valid number." + reshow modal (or inline validation before submit) |
| Channel Select filters to 0 results                                   | Show message: "No channels match your filter." + reshow select                                         |
| User leaves guild during interaction flow                             | Graceful: timeout → disable components (already handled)                                               |

---

## Remaining Migration & Rollout Plan

### Phase 3 (Complex Flows — Week 3)

- ✅ `/ticket` → split into setup/manage (COMPLETE)
- ✅ `/purge` → guided flow with default flow optimization (COMPLETE)
- Autocomplete framework (optional)

### Phase 5 (Cleanup — Week 5)

- ✅ `/mina-ai` → Memory management hub (COMPLETE - with known bugs)
- ✅ `/dev` → Normalized dev hub (COMPLETE - with known bugs)
- Moderation basics → optional confirm buttons
- Final testing & QA

### Backward Compatibility

**Decision:** Remove old subcommands immediately upon rollout of new structure.

- **Rationale:** New flows are more discoverable; old subcommands are unused once users adapt.
- **Fallback:** If urgent revert needed, quickly restore old branch.

---

## QA Checklist

- [ ] **Permissions:** Enforced at command entry; re-checked before execution of dangerous operations.
- [ ] **Ephemeral behavior:** Admin/config flows are ephemeral; moderation/utility are visible.
- [ ] **Timeout handling:** All component interactions timeout at 60s; components disabled + hint shown.
- [ ] **Confirm step:** All destructive actions have two-step preview + confirm.
- [ ] **Role hierarchy:** Cannot interact with roles >= bot's highest role; skipped in results.
- [ ] **Managed roles:** Safely excluded from deletion/modification.
- [ ] **Select limits:** String Selects ≤25 options; use autocomplete or pagination for larger sets.
- [ ] **Error handling:** Invalid input/permission denied/API errors all handled gracefully.
- [ ] **Audit trail:** Non-admin operations (purge, ban, etc.) non-ephemeral; log counts/actors.
- [ ] **Modal validation:** Fields validated on submit; errors shown inline with retry option.
- [ ] **State validation:** Custom_id state unpacked and validated on receipt; no sensitive data in IDs.
- [ ] **Component cleanup:** Components disabled on timeout or after action; no orphaned interactions.
- [ ] **TypeScript migration:** All JS files (that we touched) converted to TS during refactor.
- [ ] **Help documentation:** Updated to describe new menu-based flows and component usage.

---

## Implementation Notes

### File Structure Changes (suggestion, refer to existing structure first)

```
handlers/
  ├── command.ts (existing — no major changes)
  ├── componentHelper.ts (NEW — timeout/disable utilities)
  ├── autocomplete.ts (NEW — provider registry)
  └── componentHandlers/ (NEW directory)
      ├── roles.ts
      ├── admin.ts
      ├── ticket.ts
      ├── purge.ts
      ├── dev.ts
      └── moderation.ts

events/interactions/
  └── interactionCreate.ts (refactored — centralized routing)

commands/admin/
  ├── roles.ts (refactored — consolidated)
  ├── admin.ts (refactored — hub)
  ├── ticket.ts (split → setup + manage subcommands OR two handler branches)
  └── (settings.ts, logs.ts — removed)

commands/moderation/
  └── purge.ts (refactored — hub with default flow optimization)

commands/utility/
  └── profile.ts (migrated from JS, enhanced)

commands/dev/
  └── dev.ts (refactored — hub)
```

### Custom ID Reference Map

Create a reference document or constant map for all custom_ids used:

```typescript
const CUSTOM_IDS = {
  ROLES: {
    MENU_OPERATION: 'roles:menu:operation',
    MENU_CLEANUP: 'roles:menu:cleanup_method',
    MENU_TOPICS: 'roles:menu:topics',
    MODAL_PREFIX: 'roles:modal:prefix',
    MODAL_POSITION: 'roles:modal:position',
    MODAL_OLDER: 'roles:modal:older',
    MODAL_CREATE: 'roles:modal:create',
    BTN_CONFIRM: 'roles:btn:confirm',
    BTN_CANCEL: 'roles:btn:cancel',
  },
  ADMIN: {
    MENU_CATEGORY: 'admin:menu:category',
    MENU_MINAAI: 'admin:menu:minaai',
    MENU_SETTINGS: 'admin:menu:settings',
    // ... etc.
  },
  MINAAI: {
    MENU_OPERATION: 'minaai:menu:operation',
    BTN_BACK: 'minaai:btn:back',
    BTN_CATEGORY: 'minaai:btn:category',
    BTN_CATEGORY_PAGE: 'minaai:btn:category_page',
    BTN_BACK_MEMORIES: 'minaai:btn:back_memories',
    BTN_DM_ME: 'minaai:btn:dm_me',
    BTN_DM_ME_CATEGORY: 'minaai:btn:dm_me_category',
    BTN_FORGET_CONFIRM: 'minaai:btn:forget_confirm',
    BTN_FORGET_CANCEL: 'minaai:btn:forget_cancel',
  },
  PURGE: {
    MENU_TYPE: 'purge:menu:type',
    MENU_AMOUNT: 'purge:menu:amount|*',
    CHANNEL_SELECT: 'purge:channel:select|*',
    USER_SELECT: 'purge:user:select',
    MODAL_TOKEN: 'purge:modal:token',
    MODAL_AMOUNT: 'purge:modal:amount|*',
    BTN_BACK: 'purge:btn:back',
    BTN_CONFIRM: 'purge:btn:confirm|*',
    BTN_CANCEL: 'purge:btn:cancel',
    BTN_USE_CURRENT: 'purge:btn:use_current|*',
    BTN_PROCEED_TYPE: 'purge:btn:proceed_type|*',
    BTN_PROCEED_AMOUNT: 'purge:btn:proceed_amount|*',
    BTN_PROCEED_CHANNEL: 'purge:btn:proceed_channel|*',
  },
  // ... other commands
}
```

---

## Risks & Mitigations

| Risk                             | Mitigation                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| **Custom ID collisions**         | Enforce strict namespacing; use reference map above; validate on receipt                   |
| **Large datasets (>25)**         | Use entity selects (no limit) or autocomplete for string options                           |
| **State packing complexity**     | Keep custom_id state compact (pipe-delimited, validated); document format                  |
| **Modal validation failures**    | Show user-friendly error message inline; allow re-submission without full flow restart     |
| **Permission changes mid-flow**  | Re-check permissions before execution step; show clear denial reason                       |
| **Component timeout edge cases** | Test timeout with slow networks; ensure disabled state prevents resubmission               |
| **TypeScript migration bugs**    | Incremental migration; test each converted file; keep old version in branch until verified |

---

## References & Resources

- **Discord Components Reference (2025):** Entity selects, labels in modals, components v2 flag.
- **discord.js v14 Guides:** [Modals](https://discordjs.guide/interactions/modals.html), [Select Menus](https://discordjs.guide/interactions/select-menus/), [Autocomplete](https://discordjs.guide/interactions/autocomplete.html).
- **Discord API Docs:** [Interaction Data Structure](https://discord.com/developers/docs/interactions/receiving-and-responding).
- **Internal:** `./BRIEF.md`, `./TODO.md` for TypeScript migration guidance.

---

## Appendix: Glossary

- **Ephemeral:** Visible only to the user who triggered the interaction; auto-deletes, check existing command handlers for usage.
- **Destructive:** An operation that irreversibly removes or restricts data/permissions.
- **Two-step confirmation:** Preview step (read-only) + confirm step (action).
- **Custom ID:** Unique string identifying a button, select menu, or modal; routed by handler.
- **Entity Select:** Discord select menu for users, roles, channels, or mentionables (built-in Discord component, not a string list).
- **Autocomplete:** Dynamic suggestion list for slash command options; user types to filter.
- **Timeout:** Interaction expires after 60s of inactivity; components become disabled.
- **Managed Role:** Role automatically managed by Discord (bots, integrations, etc.); cannot be modified by other bots.
- **Role Hierarchy:** Roles ranked by position; bots cannot interact with roles at or above their highest role.
