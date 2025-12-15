# Dashboard Migration Plan: Reference to HonoX

**Status**: ✅ Phase 4 Complete - Ready for Phase 5  
**Target**: Clone discord-bot-dashboard-next reference frontend into `/dash/*` routes  
**Framework**: HonoX (Hono + Vite + React JSX)  
**Created**: 2025-12-15  
**Last Updated**: 2025-12-15

---

## ✅ Completed Phases

### Phase 1: Setup & Core Layout ✅

- ✅ Directory structure created
- ✅ Core layouts: `AppLayout.tsx`, `Sidebar.tsx`, `Navbar.tsx`
- ✅ UI components: `Card.tsx`, `Button.tsx`, `Badge.tsx`, `Skeleton.tsx`, `Separator.tsx`
- ✅ Type definitions: `types/dashboard.d.ts`, `types/features.d.ts`
- ✅ Middleware: Auth guard in `_middleware.ts`

### Phase 2: Feature System ✅

- ✅ Feature configuration: `app/config/features.tsx` (7 features)
- ✅ Components: `FeatureCard.tsx`, `FeatureGrid.tsx`
- ✅ Panels: `LoadingPanel.tsx`, `ErrorPanel.tsx`, `QueryPanel.tsx`
- ✅ React Query hooks: `app/lib/dashboard/hooks.ts`
- ✅ Routes implemented with TODO placeholders for API

### Phase 3: Form System ✅

- ✅ Form wrapper: `Form.tsx` with `FormCard`, `FormSection`, `FormActions`
- ✅ Basic inputs: `InputField.tsx`, `TextAreaField.tsx`, `SwitchField.tsx`, `SelectField.tsx`
- ✅ Discord pickers: `ChannelPicker.tsx`, `RolePicker.tsx`
- ✅ Advanced inputs: `ColorPicker.tsx`, `DatePicker.tsx`, `DateRangePicker`
- ✅ Barrel export: `app/components/dashboard/forms/index.ts`
- ✅ Guild layouts: `GuildLayout.tsx`, `GuildBanner.tsx`, `GuildHeaderCompact`

### Phase 4: User & Guild Pages ✅

- ✅ Enhanced user profile page with form components (preferences, notifications, connected accounts)
- ✅ Updated guild routes to use `GuildLayout`
- ✅ Added feature configuration forms for all 7 features:
  - Welcome: Channel/Role, Message, DM settings
  - Farewell: Channel, Message settings
  - Logging: Log channels (message, member, mod, server), settings
  - Automod: Ignored roles/channels, spam protection, content filters
  - Ticket: Setup, panel customization
  - Warnings: Actions, settings, muted role
  - Stats: Stats channels, display format
- ✅ Implemented empty/disabled states for features
- ✅ StatCard component for guild overview
- ✅ Danger zone sections with reset/delete actions

### Remaining: Phase 5 - Refinement & Polish ⏳

- [ ] Add save/submit functionality to forms (API integration)
- [ ] Loading states during form submissions
- [ ] Toast notifications for success/error feedback
- [ ] Animated transitions between pages
- [ ] Mobile responsive improvements for sidebar/forms
- [ ] Accessibility improvements (focus management, ARIA labels)
- [ ] Final design polish and consistency pass

We are migrating the reference dashboard UI from [discord-bot-dashboard-next](https://github.com/fuma-nama/discord-bot-dashboard-next) (Next.js + Chakra UI) to our HonoX-based Amina dashboard (`/dash/*` paths). This is a **frontend-first migration** — we will clone the UI/UX structure, layout patterns, and component hierarchy while preserving our existing Tailwind v4 color palette and fonts.

### Key Principles

1. **Reference-First UI** - Treat the reference repo as our UI/UX blueprint
2. **Preserve Amina's Identity** - Keep our colors, fonts, and branding
3. **Auth Flow** - Middleware-based protection (no standalone signin page)
4. **Frontend Only** - Backend API endpoints will be implemented separately
5. **Type Safety** - All types in `/types/*` with barrel exports via `@types`

---

## 📊 Migration Scope

### What We're Migrating (Frontend)

#### ✅ Layout Structure

- **AppLayout**: Sidebar + Navbar + Content area
- **GuildLayout**: Guild-specific sidebar with feature navigation
- **Responsive Patterns**: Drawer sidebar (mobile) + Fixed sidebar (desktop)

#### ✅ Page Components

- `/dash` - User home / Guild selector
- `/dash/user/[userId]` - User profile
- `/dash/guild/[guildId]` - Guild overview with features
- `/dash/guild/[guildId]/settings` - Guild settings
- `/dash/guild/[guildId]/features/[feature]` - Feature configuration pages

#### ✅ Shared Components

- **Forms**: Input, Select, TextArea, Switch, Channel/Role pickers, Color picker, Date picker
- **Panels**: Loading, Error, QueryStatus wrapper
- **Features**: FeatureItem cards, UpdateFeaturePanel
- **Charts**: StyledChart (data visualization)
- **Navigation**: Sidebar items, breadcrumbs, user menu
- **UI Primitives**: Card, Button, Avatar, Badge, Skeleton, etc.

#### ✅ Feature System

- Feature configuration architecture
- Enable/disable toggle system
- Feature rendering with react-hook-form + Zod validation
- Dynamic feature routing

### What We're NOT Migrating (Yet)

#### ⏸️ Backend/API (Separate Phase)

- Feature configuration endpoints
- Guild data fetching
- Discord API integration (roles, channels, etc.)
- Database operations

#### 🔄 Auth Flow (Adapting, Not Copying)

- We'll adapt the auth pattern to HonoX middleware
- No standalone `/auth/signin` page (middleware redirects)
- Session management via cookies (existing pattern)

---

## 🏗️ Architecture Mapping

### Reference Architecture (Next.js)

```
src/
├── pages/
│   ├── auth/signin.tsx               ❌ Skip (middleware handles)
│   ├── user/home.tsx                 ✅ Migrate
│   ├── user/profile.tsx              ✅ Migrate
│   └── guilds/[guild]/
│       ├── index.tsx                 ✅ Migrate
│       ├── settings.tsx              ✅ Migrate
│       └── features/[feature].tsx    ✅ Migrate
├── components/
│   ├── layout/
│   │   ├── app.tsx                   ✅ Migrate
│   │   ├── sidebar/                  ✅ Migrate
│   │   ├── navbar/                   ✅ Migrate
│   │   └── guild/                    ✅ Migrate
│   ├── feature/                      ✅ Migrate
│   ├── forms/                        ✅ Migrate
│   ├── panel/                        ✅ Migrate
│   └── chart/                        ✅ Migrate (optional)
├── config/
│   ├── features.tsx                  ✅ Adapt
│   ├── sidebar-items.tsx             ✅ Adapt
│   └── types/                        ✅ Move to /types
└── utils/
    ├── auth/                         🔄 Adapt to HonoX
    ├── fetch/                        ✅ Migrate
    └── i18n/                         ⏸️ Optional (later)
```

### Target Architecture (HonoX)

```
app/
├── routes/dash/
│   ├── _middleware.ts                🔄 Fine-tune existing auth
│   ├── index.tsx                     ✅ User home / Guild selector
│   ├── user/
│   │   └── [userId].tsx              ✅ User profile
│   └── guild/
│       └── [guildId].tsx             ✅ Guild overview
│       └── [guildId]/
│           ├── settings.tsx          ✅ Guild settings
│           └── features/
│               └── [feature].tsx     ✅ Feature config
├── components/dashboard/
│   ├── layouts/
│   │   ├── AppLayout.tsx             ✅ Main app layout
│   │   ├── GuildLayout.tsx           ✅ Guild-specific layout
│   │   ├── Sidebar.tsx               ✅ Sidebar navigation
│   │   └── Navbar.tsx                ✅ Top navbar
│   ├── features/
│   │   ├── FeatureCard.tsx           ✅ Feature item card
│   │   └── FeatureForm.tsx           ✅ Feature config form
│   ├── forms/
│   │   ├── InputField.tsx            ✅ Form inputs
│   │   ├── SelectField.tsx           ✅ Select dropdowns
│   │   ├── ChannelPicker.tsx         ✅ Discord channel picker
│   │   └── RolePicker.tsx            ✅ Discord role picker
│   ├── panels/
│   │   ├── LoadingPanel.tsx          ✅ Loading states
│   │   ├── ErrorPanel.tsx            ✅ Error handling
│   │   └── QueryPanel.tsx            ✅ React Query wrapper
│   └── ui/
│       ├── Card.tsx                  ✅ Card component
│       ├── Button.tsx                ✅ Button variants
│       ├── Avatar.tsx                ✅ User/Guild avatar
│       ├── Badge.tsx                 ✅ Badge component
│       └── Skeleton.tsx              ✅ Loading skeleton
├── config/
│   ├── features.tsx                  ✅ Feature definitions
│   └── dashboard.ts                  ✅ Dashboard config
└── lib/
    └── dashboard/
        ├── api.ts                    ⏸️ API client (later)
        ├── hooks.ts                  ✅ React Query hooks
        └── utils.ts                  ✅ Helper functions
types/
├── dashboard.d.ts                    ✅ Dashboard types
├── features.d.ts                     🔄 Extend existing
└── index.d.ts                        🔄 Barrel exports
```

---

## 🎨 Design Translation Strategy

### Color Mapping: Chakra UI → Tailwind v4

Our existing Tailwind v4 theme (from `app/assets/styles/global.css`) will replace all Chakra UI colors:

#### Reference Colors → Amina Colors

| Chakra UI (Reference)  | Amina Tailwind Token | CSS Variable       |
| ---------------------- | -------------------- | ------------------ |
| `bg` (background)      | `bg-night-black`     | `--night-black`    |
| `bg-secondary`         | `bg-night-shadow`    | `--night-shadow`   |
| `bg-card`              | `bg-night-steel`     | `--night-steel`    |
| `border`               | `border-night-slate` | `--night-slate`    |
| `text-primary`         | `text-pure-white`    | `--pure-white`     |
| `text-secondary`       | `text-gray-400`      | (Tailwind default) |
| `action` (primary btn) | `bg-amina-crimson`   | `--amina-crimson`  |
| `action-hover`         | `bg-amina-rose-red`  | `--amina-rose-red` |
| `accent`               | `bg-cyber-blue`      | `--cyber-blue`     |
| `success`              | `bg-discord-green`   | `--discord-green`  |
| `danger`               | `bg-discord-red`     | `--discord-red`    |
| `warning`              | `bg-imperial-gold`   | `--imperial-gold`  |

#### Shadow & Glow Effects

| Effect Type            | Amina Token    | CSS Variable     |
| ---------------------- | -------------- | ---------------- |
| Box shadow (subtle)    | `shadow-md`    | `--shadow-md`    |
| Box shadow (prominent) | `shadow-lg`    | `--shadow-lg`    |
| Crimson glow           | `glow-crimson` | `--glow-crimson` |
| Blue glow              | `glow-blue`    | `--glow-blue`    |
| Gold glow              | `glow-gold`    | `--glow-gold`    |

### Typography Mapping

| Chakra UI             | Amina Font     | CSS Variable     |
| --------------------- | -------------- | ---------------- |
| `fontWeight: 600-700` | `font-heading` | `--font-heading` |
| `fontWeight: 400-500` | `font-body`    | `--font-body`    |
| Code/monospace        | `font-mono`    | `--font-mono`    |

**Fonts to Use:**

- **Headings**: `Exo 2` (already imported)
- **Body**: `Nunito Sans` (already imported)
- **Dialogue/Speech**: `Comfortaa` (already imported)
- **Code**: `Fira Code` (already imported)

**Note**: Reference uses `DM Sans` + `Noto Color Emoji`, but we override with our existing fonts.

---

## 🔐 Authentication Flow

### Reference Pattern (Next.js)

```typescript
// pages/api/auth/login.ts
GET /api/auth/login?locale=en
→ Redirects to Discord OAuth

// pages/api/auth/callback.ts
GET /api/auth/callback?code=xxx
→ Exchange code for token
→ Set session cookie
→ Redirect to /user/home

// middleware (Next.js middleware)
Check cookie on protected routes
→ If not authenticated: redirect to /auth/signin
```

### Amina Pattern (HonoX) - **Already Implemented**

Our existing middleware (`app/middleware/auth.ts`) already handles this flow, but we'll fine-tune it:

```typescript
// app/middleware/auth.ts
Protected routes: /dash, /guild, /user, /api/guild, /api/user
→ Check cookies (accessToken, refreshToken)
→ If missing: redirect to Discord OAuth (authUrl)
→ If expired: attempt refresh
→ If refresh fails: clear cookies, redirect to /

// No standalone signin page needed!
// Accessing /dash while unauthenticated → auto-redirect to OAuth
```

**OAuth URL Construction** (from `@file:app/config/permalinks.ts`):

```typescript
export function getOAuthRedirect(): string {
  return getCanonical('auth/callback');
}
// Dynamically constructs redirect URL based on BASE_URL
// Dev: http://localhost:4321/auth/callback
// Prod: https://4mina.app/auth/callback
```

### Session Management

**Cookie Schema** (existing):

```typescript
{
  accessToken: string;      // Discord access token
  refreshToken: string;     // Discord refresh token
  userId: string;           // Discord user ID
  expiresAt?: number;       // Token expiry timestamp
}
```

**Token Validation Flow**:

1. Extract tokens from cookies
2. Validate access token (check expiry, verify with Discord)
3. If invalid → attempt refresh with refresh token
4. If refresh fails → clear cookies, redirect to OAuth
5. If refresh succeeds → update cookies, continue

---

## 📁 File Structure Plan

### Phase 1: Core Layout & Navigation

```
app/
├── routes/dash/
│   ├── _middleware.ts              🔄 Fine-tune (already exists)
│   ├── index.tsx                   ✅ CREATE: Guild selector
│   ├── user/
│   │   └── [userId].tsx            ✅ CREATE: User profile
│   └── guild/
│       └── [guildId].tsx           ✅ CREATE: Guild overview
│       └── [guildId]/
│           ├── settings.tsx        ✅ CREATE: Guild settings
│           └── features/
│               └── [feature].tsx   ✅ CREATE: Feature config
└── components/dashboard/
    ├── layouts/
    │   ├── AppLayout.tsx           ✅ CREATE
    │   ├── GuildLayout.tsx         ✅ CREATE
    │   ├── Sidebar.tsx             ✅ CREATE
    │   ├── SidebarItem.tsx         ✅ CREATE
    │   ├── Navbar.tsx              ✅ CREATE
    │   └── Breadcrumbs.tsx         ✅ CREATE
    └── ui/
        └── GuildBanner.tsx         ✅ CREATE
```

### Phase 2: Feature System

```
app/
├── components/dashboard/
│   ├── features/
│   │   ├── FeatureCard.tsx         ✅ CREATE
│   │   ├── FeatureGrid.tsx         ✅ CREATE
│   │   └── FeatureForm.tsx         ✅ CREATE
│   └── panels/
│       ├── LoadingPanel.tsx        ✅ CREATE
│       ├── ErrorPanel.tsx          ✅ CREATE
│       └── QueryPanel.tsx          ✅ CREATE
├── config/
│   ├── features.tsx                ✅ CREATE
│   └── sidebar-items.tsx           ✅ CREATE
└── lib/dashboard/
    └── hooks.ts                    ✅ CREATE: React Query hooks
```

### Phase 3: Form Components

```
app/components/dashboard/forms/
├── InputField.tsx                  ✅ CREATE
├── SelectField.tsx                 ✅ CREATE
├── TextAreaField.tsx               ✅ CREATE
├── SwitchField.tsx                 ✅ CREATE
├── ChannelPicker.tsx               ✅ CREATE
├── RolePicker.tsx                  ✅ CREATE
├── ColorPicker.tsx                 ✅ CREATE
├── DatePicker.tsx                  ✅ CREATE
├── FilePicker.tsx                  ✅ CREATE
└── Form.tsx                        ✅ CREATE: Form wrapper
```

### Phase 4: UI Primitives

```
app/components/dashboard/ui/
├── Card.tsx                        ✅ CREATE
├── Button.tsx                      ✅ CREATE
├── Avatar.tsx                      ✅ CREATE (or reuse existing)
├── Badge.tsx                       ✅ CREATE
├── Skeleton.tsx                    ✅ CREATE
├── Separator.tsx                   ✅ CREATE
├── Modal.tsx                       ✅ CREATE (if needed)
└── Tooltip.tsx                     ✅ CREATE (if needed)
```

---

## 🛠️ Technical Implementation Details

### 1. Component Translation: Chakra UI → Tailwind v4

**Example: Card Component**

**Reference (Chakra UI)**:

```tsx
<Card variant="primary" as={Link} href={`/guilds/${guild.id}`}>
  <CardHeader as={Flex} flexDirection="row" gap={3}>
    <Avatar src={iconUrl(guild)} name={guild.name} size="md" />
    <Text>{guild.name}</Text>
  </CardHeader>
</Card>
```

**Amina (Tailwind v4)**:

```tsx
<Link href={`/dash/guild/${guild.id}`}>
  <div className="card-amina hover:border-cyber-blue transition-all">
    <div className="flex flex-row gap-3 items-center">
      <Avatar src={iconUrl(guild)} name={guild.name} size="md" />
      <span className="text-pure-white font-heading">{guild.name}</span>
    </div>
  </div>
</Link>
```

**Key Changes**:

- `<Card variant="primary">` → `<div className="card-amina">`
- `<CardHeader>` → `<div className="flex flex-row gap-3">`
- `<Text>` → `<span className="text-pure-white">`
- Chakra props (`gap`, `flexDirection`) → Tailwind classes (`gap-3`, `flex-row`)

### 2. Layout Structure

**AppLayout** (Main Dashboard Layout):

```tsx
export default function AppLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-night-black">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-72 bg-night-shadow border-r border-night-slate">
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {/* Navbar */}
        <nav className="sticky top-0 z-10 bg-night-shadow/95 backdrop-blur-sm border-b border-night-slate">
          <Navbar />
        </nav>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto p-6 md:p-8">{children}</div>
      </main>

      {/* Sidebar - Mobile (Drawer) */}
      <MobileSidebarDrawer>{sidebar}</MobileSidebarDrawer>
    </div>
  );
}
```

**GuildLayout** (Guild-Specific Layout):

```tsx
export default function GuildLayout({
  guildId,
  children,
}: {
  guildId: string;
  children: React.ReactNode;
}) {
  const { data: guild } = useGuildQuery(guildId);

  return (
    <AppLayout
      sidebar={
        <GuildSidebar
          guildId={guildId}
          guildName={guild?.name}
          enabledFeatures={guild?.enabledFeatures}
        />
      }
    >
      {/* Guild Banner */}
      <GuildBanner guild={guild} />

      {/* Page Content */}
      {children}
    </AppLayout>
  );
}
```

### 3. Feature System Architecture

**Feature Configuration** (`app/config/features.tsx`):

```tsx
import type { FeatureConfig, CustomFeatures } from '@types';

export const features: Record<keyof CustomFeatures, FeatureConfig> = {
  'welcome-message': {
    id: 'welcome-message',
    name: 'Welcome Message',
    description: 'Send a message when users join your server',
    icon: 'MessageSquare', // Lucide icon name
    category: 'moderation',
    useRender: useWelcomeMessageFeature, // Custom hook
  },
  'auto-roles': {
    id: 'auto-roles',
    name: 'Auto Roles',
    description: 'Automatically assign roles to new members',
    icon: 'UserPlus',
    category: 'moderation',
    useRender: useAutoRolesFeature,
  },
  // ... more features
};
```

**Feature Types** (in `/types/features.d.ts`):

```typescript
// Feature configuration object
export interface FeatureConfig<K extends keyof CustomFeatures = any> {
  id: K;
  name: string;
  description?: string;
  icon?: string; // Lucide icon name
  category?: 'moderation' | 'fun' | 'utility' | 'leveling';
  useRender: UseFormRender<CustomFeatures[K]>;
}

// Feature render hook
export type UseFormRender<T> = (
  data: T,
  onSubmit: SubmitFn<T>
) => {
  component: React.ReactNode;
  onSubmit: () => void;
};

// Submit function type
export type SubmitFn<T> = (data: T) => Promise<void>;

// Custom features (extend in types/features.d.ts)
export interface CustomFeatures {
  'welcome-message': WelcomeMessageConfig;
  'auto-roles': AutoRolesConfig;
  // ... add more
}

export interface WelcomeMessageConfig {
  enabled: boolean;
  channelId: string;
  message: string;
}

export interface AutoRolesConfig {
  enabled: boolean;
  roleIds: string[];
}
```

**Feature Card Component** (`app/components/dashboard/features/FeatureCard.tsx`):

```tsx
export function FeatureCard({
  guildId,
  feature,
  enabled,
}: {
  guildId: string;
  feature: FeatureConfig;
  enabled: boolean;
}) {
  const toggleMutation = useToggleFeatureMutation(guildId, feature.id);

  return (
    <Link href={`/dash/guild/${guildId}/features/${feature.id}`}>
      <div
        className={cn(
          'card-amina p-6 cursor-pointer',
          enabled && 'card-active'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <LucideIcon
              name={feature.icon}
              className="w-6 h-6 text-cyber-blue"
            />
            <h3 className="font-heading text-lg">{feature.name}</h3>
          </div>
          <Switch
            checked={enabled}
            onChange={() => toggleMutation.mutate()}
            className="flex-shrink-0"
          />
        </div>
        <p className="text-sm text-gray-400">{feature.description}</p>
      </div>
    </Link>
  );
}
```

### 4. Form System with react-hook-form + Zod

**Example: Welcome Message Feature Form**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  enabled: z.boolean(),
  channelId: z.string().min(1, 'Channel is required'),
  message: z.string().min(1, 'Message is required').max(2000),
});

type FormData = z.infer<typeof schema>;

export function useWelcomeMessageFeature(
  data: WelcomeMessageConfig,
  onSubmit: SubmitFn<WelcomeMessageConfig>
) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  return {
    component: (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SwitchField
          label="Enable Welcome Messages"
          {...form.register('enabled')}
        />
        <ChannelPicker
          label="Welcome Channel"
          {...form.register('channelId')}
        />
        <TextAreaField
          label="Welcome Message"
          placeholder="Welcome {user} to {guild}!"
          {...form.register('message')}
        />
        <Button type="submit" loading={form.formState.isSubmitting}>
          Save Changes
        </Button>
      </form>
    ),
    onSubmit: form.handleSubmit(onSubmit),
  };
}
```

### 5. API Integration (Placeholder)

**React Query Hooks** (`app/lib/dashboard/hooks.ts`):

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Guild, CustomGuildInfo, CustomFeatures } from '@types';

// Query Keys
export const Keys = {
  guilds: ['guilds'] as const,
  guild: (id: string) => ['guild', id] as const,
  feature: (guildId: string, featureId: string) =>
    ['feature', guildId, featureId] as const,
};

// Fetch user's guilds
export function useGuildsQuery() {
  return useQuery({
    queryKey: Keys.guilds,
    queryFn: async () => {
      // TODO: Implement API call
      // const res = await fetch('/api/user/guilds');
      // return res.json() as Promise<Guild[]>;
      return [] as Guild[]; // Placeholder
    },
  });
}

// Fetch guild info
export function useGuildQuery(guildId: string) {
  return useQuery({
    queryKey: Keys.guild(guildId),
    queryFn: async () => {
      // TODO: Implement API call
      // const res = await fetch(`/api/guild/${guildId}`);
      // return res.json() as Promise<CustomGuildInfo>;
      return null; // Placeholder
    },
  });
}

// Toggle feature
export function useToggleFeatureMutation(guildId: string, featureId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      // TODO: Implement API call
      // const method = enabled ? 'POST' : 'DELETE';
      // await fetch(`/api/guild/${guildId}/features/${featureId}`, { method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(Keys.guild(guildId));
    },
  });
}

// Update feature config
export function useUpdateFeatureMutation<K extends keyof CustomFeatures>(
  guildId: string,
  featureId: K
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomFeatures[K]) => {
      // TODO: Implement API call
      // await fetch(`/api/guild/${guildId}/features/${featureId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(Keys.feature(guildId, featureId));
      queryClient.invalidateQueries(Keys.guild(guildId));
    },
  });
}
```

---

## 📋 Migration Checklist

### Phase 1: Setup & Core Layout (Week 1)

- [ ] **Create base directory structure**
  - [ ] `app/components/dashboard/layouts/`
  - [ ] `app/components/dashboard/ui/`
  - [ ] `app/lib/dashboard/`
  - [ ] `app/config/dashboard/`

- [ ] **Update type definitions**
  - [ ] Extend `types/dashboard.d.ts` with layout types
  - [ ] Extend `types/features.d.ts` with feature system types
  - [ ] Update `types/index.d.ts` with barrel exports

- [ ] **Implement core layouts**
  - [ ] `AppLayout.tsx` - Main dashboard layout
  - [ ] `Sidebar.tsx` - Navigation sidebar
  - [ ] `SidebarItem.tsx` - Sidebar navigation items
  - [ ] `Navbar.tsx` - Top navigation bar
  - [ ] `Breadcrumbs.tsx` - Breadcrumb navigation
  - [ ] `MobileSidebarDrawer.tsx` - Mobile sidebar drawer

- [ ] **Create basic UI components**
  - [ ] `Card.tsx` - Card wrapper
  - [ ] `Button.tsx` - Button variants
  - [ ] `Badge.tsx` - Status badges
  - [ ] `Skeleton.tsx` - Loading skeleton
  - [ ] `Separator.tsx` - Visual separator

- [ ] **Set up routing**
  - [ ] `app/routes/dash/index.tsx` - Dashboard home
  - [ ] Fine-tune `app/routes/dash/_middleware.ts`

- [ ] **Test & Verify**
  - [ ] Run `bun run check` (typecheck)
  - [ ] Test auth flow (redirect to OAuth)
  - [ ] Test layout responsiveness

### Phase 2: Feature System (Week 2)

- [ ] **Feature configuration**
  - [ ] Create `app/config/features.tsx`
  - [ ] Define feature types in `types/features.d.ts`
  - [ ] Create `app/config/sidebar-items.tsx`

- [ ] **Feature components**
  - [ ] `FeatureCard.tsx` - Feature item card
  - [ ] `FeatureGrid.tsx` - Feature grid layout
  - [ ] `FeatureForm.tsx` - Feature configuration form wrapper

- [ ] **Panel components**
  - [ ] `LoadingPanel.tsx` - Loading state
  - [ ] `ErrorPanel.tsx` - Error handling
  - [ ] `QueryPanel.tsx` - React Query wrapper

- [ ] **React Query setup**
  - [ ] Install `@tanstack/react-query`
  - [ ] Create query hooks in `app/lib/dashboard/hooks.ts`
  - [ ] Set up QueryClientProvider in app root

- [ ] **Guild routes**
  - [ ] `app/routes/dash/guild/[guildId].tsx` - Guild overview
  - [ ] `app/routes/dash/guild/[guildId]/settings.tsx` - Guild settings
  - [ ] `app/routes/dash/guild/[guildId]/features/[feature].tsx` - Feature config

- [ ] **Test & Verify**
  - [ ] Run `bun run check`
  - [ ] Test feature card rendering
  - [ ] Test routing between pages

### Phase 3: Form System (Week 3)

- [ ] **Install dependencies**
  - [ ] `react-hook-form`
  - [ ] `@hookform/resolvers`
  - [ ] `zod` (already installed)

- [ ] **Basic form components**
  - [ ] `Form.tsx` - Form wrapper with context
  - [ ] `InputField.tsx` - Text input
  - [ ] `SelectField.tsx` - Dropdown select
  - [ ] `TextAreaField.tsx` - Textarea input
  - [ ] `SwitchField.tsx` - Toggle switch

- [ ] **Advanced form components**
  - [ ] `ChannelPicker.tsx` - Discord channel selector
  - [ ] `RolePicker.tsx` - Discord role selector
  - [ ] `ColorPicker.tsx` - Color input
  - [ ] `DatePicker.tsx` - Date/time picker
  - [ ] `FilePicker.tsx` - File upload

- [ ] **Create example features**
  - [ ] Welcome Message feature form
  - [ ] Auto Roles feature form
  - [ ] Leveling System feature form

- [ ] **Test & Verify**
  - [ ] Run `bun run check`
  - [ ] Test form validation
  - [ ] Test form submission (with mock API)

### Phase 4: User & Guild Pages (Week 4)

- [ ] **User pages**
  - [ ] `app/routes/dash/user/[userId].tsx` - User profile
  - [ ] User profile form components
  - [ ] User settings UI

- [ ] **Guild components**
  - [ ] `GuildBanner.tsx` - Guild header banner
  - [ ] `GuildIcon.tsx` - Guild avatar/icon
  - [ ] `GuildLayout.tsx` - Guild-specific layout

- [ ] **Guild settings page**
  - [ ] General settings form
  - [ ] Notification preferences
  - [ ] Bot permissions display

- [ ] **Polish & refinement**
  - [ ] Add loading states to all pages
  - [ ] Add error boundaries
  - [ ] Add empty states ("No guilds found", etc.)
  - [ ] Accessibility improvements (ARIA labels, keyboard nav)

- [ ] **Test & Verify**
  - [ ] Run `bun run check`
  - [ ] Test all pages in isolation
  - [ ] Test navigation flow
  - [ ] Test responsive design (mobile, tablet, desktop)

### Phase 5: Refinement & Polish (Week 5)

- [ ] **UI/UX improvements**
  - [ ] Add transitions/animations
  - [ ] Improve hover states
  - [ ] Add tooltips where needed
  - [ ] Improve visual hierarchy

- [ ] **Component library cleanup**
  - [ ] Document all components (JSDoc)
  - [ ] Create Storybook stories (optional)
  - [ ] Ensure consistent naming conventions
  - [ ] Extract reusable patterns

- [ ] **Performance optimization**
  - [ ] Lazy load heavy components
  - [ ] Optimize re-renders (React.memo)
  - [ ] Implement virtualization for long lists
  - [ ] Optimize image loading

- [ ] **Final testing**
  - [ ] Cross-browser testing
  - [ ] Accessibility audit (WCAG 2.1)
  - [ ] Performance audit (Lighthouse)
  - [ ] Mobile usability testing

- [ ] **Documentation**
  - [ ] Update README with dashboard info
  - [ ] Create component usage guide
  - [ ] Document feature system architecture
  - [ ] Add inline code comments

---

## 🔧 Dependencies to Install

```bash
# Form handling
bun add react-hook-form @hookform/resolvers zod

# Data fetching
bun add @tanstack/react-query

# UI utilities
bun add clsx tailwind-merge  # For className merging
bun add @radix-ui/react-switch @radix-ui/react-select  # Headless UI primitives
bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Icons (if not already installed)
bun add lucide-react

# Date handling (for date picker)
bun add date-fns

# Optional: Color picker
bun add react-colorful
```

---

## 🚫 What NOT to Do

1. **Don't copy Chakra UI components directly** - Translate to Tailwind classes
2. **Don't create a `/auth/signin` page** - Middleware handles auth
3. **Don't implement backend API yet** - Use mock data/hooks
4. **Don't change our color palette** - Keep Amina's identity
5. **Don't import from individual type files** - Always use `@types` barrel exports
6. **Don't skip type checking** - Run `bun run check` before and after changes
7. **Don't hardcode API URLs** - Use config/permalinks helpers

---

## 📝 Notes & Considerations

### Alpine.js Compatibility

Some existing Amina components use Alpine.js. For dashboard pages, **prefer React state management** (useState, React Query) over Alpine directives. If you must use Alpine in JSX:

```tsx
<div
  dangerouslySetInnerHTML={{
    __html: `<div x-data="{ open: false }">...</div>`,
  }}
/>
```

### i18n (Internationalization)

The reference repo has i18n support. For now, **skip i18n** — implement in English only. We can add i18n later as a separate phase.

### Chart Components

The reference includes chart components (likely using Chart.js or Recharts). For Phase 1-4, **skip charts** unless specifically needed for a feature. We can add data visualization later.

### Mobile Responsiveness

**Prioritize mobile-first design**. The reference uses Chakra's responsive syntax (`base`, `md`, `lg`). In Tailwind:

```tsx
// Chakra: display={{ base: 'none', lg: 'block' }}
// Tailwind: className="hidden lg:block"
```

### API Rate Limiting

The reference doesn't show rate limiting. Our existing middleware has rate limiting for Discord API. **Do not remove or bypass this** — it's critical for staying within Discord's limits.

---

## 🎉 Success Criteria

By the end of this migration, we should have:

✅ **Complete dashboard UI** matching the reference layout and UX  
✅ **All routes functional** (`/dash`, `/dash/user/*`, `/dash/guild/*`)  
✅ **Feature system architecture** in place (config, cards, forms)  
✅ **Form system** with validation (react-hook-form + Zod)  
✅ **Responsive design** (mobile, tablet, desktop)  
✅ **Auth flow** working (middleware-based, no signin page)  
✅ **Type safety** (all types in `/types/*`, barrel exports)  
✅ **Zero TypeScript errors** (`bun run check` passes)  
✅ **Amina's visual identity** preserved (colors, fonts, branding)  
✅ **Mock API ready** (hooks in place, ready for backend implementation)

---

## 🔗 References

- **Reference Dashboard**: [discord-bot-dashboard-next](https://github.com/fuma-nama/discord-bot-dashboard-next)
- **HonoX Docs**: [honojs.dev](https://hono.dev/)
- **Tailwind v4 Docs**: [tailwindcss.com](https://tailwindcss.com/)
- **React Hook Form**: [react-hook-form.com](https://react-hook-form.com/)
- **TanStack Query**: [tanstack.com/query](https://tanstack.com/query/latest)
- **Zod**: [zod.dev](https://zod.dev/)

---

**Last Updated**: 2025-12-15  
**Status**: 📋 Ready for Implementation  
**Next Step**: Phase 1 - Setup & Core Layout
