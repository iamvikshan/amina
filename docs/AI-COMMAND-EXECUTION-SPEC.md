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
- **Modules:** See Phase Completion Archive for full details
- **Status:** ✅ Fully implemented, migrated, and production-ready

### ✅ Phase 4 Complete: Purge Command

- **Structure:** Modularized into `/src/handlers/purge/` directory
- **Modules:** See Phase Completion Archive for full details
- **Status:** ✅ Fully implemented, migrated, and production-ready

### ✅ Phase 5 Complete: Mina AI Memory Management

- **Structure:** Modularized into `/src/handlers/minaai/` directory
- **Modules:** See Phase Completion Archive for full details
- **Status:** ✅ Implemented with known bugs (see Known Issues below)

### ✅ Phase 6 Complete: Dev Hub

- **Structure:** Modularized into `/src/handlers/dev/` directory
- **Modules:** See Phase Completion Archive for full details
- **Status:** ✅ Implemented with known bugs (see Known Issues below)

---

## Known Issues Tracker (All Phases)

### 🔴 HIGH PRIORITY

1. **Phase 5 - Mina AI Settings:**
   - `UserModel is not defined` error in `settings.ts` line 203 when toggling settings in server context
   - DM interaction blocking after menu selection: "Command can only be executed in a discord server" error due to guild check in `interactionCreate.ts` (blocks select menus, buttons in DM context)
2. **Phase 6 - Dev Modal Display:**
   - **Location:** `handlers/dev/tod/menu.ts:68`, `handlers/dev/minaai/handlers.ts:118`, `handlers/dev/presence/handlers.ts`
   - **Issue:** `deferUpdate()` called before showing modals. Discord.js requires modals shown BEFORE deferring, or the interaction must not be deferred at all when showing modals.
   - **Error:** `Error: The reply to this interaction has already been sent or deferred.`
   - **Affected Operations:** ToD Add/Remove, Mina AI Set Model/Tokens/Prompt/Temperature, Presence Configure button
   - **Fix Required:** Remove `deferUpdate()` calls before modal display, or restructure to show modal first then handle deferral in modal submission handler.
3. **Phase 6 - Ephemeral Message Handling:**
   - **Location:** `commands/dev/sub/minaAi.ts` - `aiStatus()` and `memoryStats()`
   - **Issue:** Functions use `interaction.followUp()` which creates new messages instead of editing existing ephemeral reply.
   - **Expected Behavior:** Should use `interaction.editReply()` to edit the ephemeral message already deferred.
   - **Fix Required:** Change `followUp()` to `editReply()` in these functions, or pass interaction type information to determine correct method.

### 🟡 MEDIUM PRIORITY

1. **Phase 6 - Presence Flow Rigidity:**
   - **Location:** `handlers/dev/presence/handlers.ts`
   - **Issue:** Presence configuration requires all steps: message/URL → type → status → confirm. Users can't save partial configurations (e.g., change type only).
   - **Expected Behavior:** Allow saving at each step. Add "Save Type"/"Save Status" button, make message/URL optional.
   - **Fix Required:** Restructure flow to allow partial saves, add save buttons at each step, make message/URL optional.

---

## Command-by-Command Plans (Active Work)

### 8) `/help` — MAINTAIN EXISTING PATTERN

(Active work section)

### 9) `/profile` — MIGRATE & ENHANCE

(Active work section)

### 10) Moderation Basics — MINIMAL REFACTOR

(Active work section)

---

## Phase Completion Archive

### Phase 1 Complete: Admin Hub & Server Settings

- **Modules:**
  - `main-hub.ts`, `settings/`, `ai/`, `logging/`, `shared/`, `index.ts`
- **Commands Migrated:**
  - `/admin`, Server Settings, Mina AI, Logging
- **Details:**
  - Category menu + back button navigation.
  - Reusable selectors, modular TypeScript, proper state init.

---

### Phase 2 Complete: Roles Hub

- **Modules:** See above.
- **Commands Migrated:** `/roles` with Cleanup, Autorole, Create, Add to User flows
- **Details:** Two-step previews, safety caps, full validation logic.

---

### Phase 3 Complete: Ticket System

- **Modules:** `main-hub.ts`, `setup/menu.ts`, `setup/message.ts`, `setup/log-channel.ts`, `setup/limit.ts`, `setup/topics.ts`, `manage/menu.ts`, `manage/close.ts`, `manage/close-all.ts`, `manage/add-user.ts`, `manage/remove-user.ts`, `shared/utils.ts`, `shared/buttons.ts`, `index.ts`
- **Details:**
  - Topics system (Discord categories).
  - Category permission inheritance.
  - Ticket creation, bulk operations, error handling and validations.
  - Two-step confirmation and graceful error handling logic.

---

### Phase 4 Complete: Purge Command

- **Modules:** `main-hub.ts`, `parameters/amount-select.ts`, `parameters/amount-modal.ts`, `parameters/token-modal.ts`, `parameters/user-select.ts`, `parameters/channel-select.ts`, `preview.ts`, `execute.ts`, `index.ts`
- **Details:**
  - Guided bulk deletion, menu-based flows.
  - Batch handling (Discord limits), non-ephemeral for audit trail.
  - Error handlers, safety caps (up to 500 messages), preview confirmation logic.

---

### Phase 5 Complete: Mina AI Memory Management

- **Modules:** `main-hub.ts`, `memories.ts`, `forget-me.ts`, `settings.ts`, `index.ts`
- **Details:**
  - Context-aware memory management, user preferences, strict filtering.
  - Pastebin export, pagination, category navigation.
  - UserModel error, DM block bug detailed in Known Issues above.

---

### Phase 6 Complete: Dev Hub

- **Modules:** `main-hub.ts`, `presence/`, `tod/`, `reload.ts`, `trig-settings.ts`, `listservers.ts`, `minaai/`, `index.ts`
- **Details:**
  - Centralized autocomplete, category-based menus, modular flow.
  - Modal display/ephemeral message/partial flow bugs detailed in Known Issues above.

---
