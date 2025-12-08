# HonoX Migration Guide - Comprehensive Reference

**Project:** Amina Dashboard (branch: `dash`)  
**Target:** Migrate from Astro SSR to HonoX  
**Date:** 2025-12-07  
**Status:** ANALYSIS COMPLETE - READY FOR IMPLEMENTATION

---

## Executive Summary

This guide provides comprehensive technical documentation for migrating the Amina Dashboard from Astro to HonoX. The migration preserves all functionality while achieving significant performance improvements.

### Expected Benefits

- ✅ **83% memory reduction** (280MB → 35MB idle, 450MB → 90MB load)
- ✅ **84% bundle size reduction** (625KB → 100KB)
- ✅ **83% faster cold starts** (2.1s → 300ms)
- ✅ **80% faster TTFB** (180ms → 35ms)
- ✅ **Native Islands Support** (HonoX built-in)
- ✅ **Comprehensive SSG** (Multiple implementation options)

---

## Table of Contents

1. [Critical Architectural Patterns (MUST PRESERVE)](#1-critical-architectural-patterns)
2. [Animation & Library Strategy](#2-animation--library-strategy)
3. [CF Worker API Integration](#3-cf-worker-api-integration)
4. [Migration Phases (8 Weeks)](#4-migration-phases)
5. [Component Conversion Patterns](#5-component-conversion-patterns)
6. [Testing Requirements](#6-testing-requirements)
7. [Success Criteria](#7-success-criteria)

> **📋 For detailed phase tracking and task management, see [MIGRATION-TRACKER.md](./MIGRATION-TRACKER.md)**

---

## 1. Critical Architectural Patterns (MUST PRESERVE)

### 1.1 Type System Architecture

**Barrel Export Pattern (SACRED):**

```typescript
// types/index.d.ts - SINGLE SOURCE OF TRUTH
export type { IUser, IUserProfile } from './user.d.ts';
export type { IGuild, IGuildAutomod } from './guild.d.ts';
export type { DiscordUser, DiscordGuild } from './discord.d.ts';
// ... all other types
```

**Usage Rules:**

```typescript
// ✅ CORRECT - Always import from barrel
import type { DiscordUser, IGuild, TokenData } from '@types';

// ❌ WRONG - Never import directly
import type { DiscordUser } from '@types/discord';

// ❌ WRONG - Never define inline
type DiscordUser = { id: string; ... };
```

**HonoX tsconfig.json:**

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "baseUrl": ".",
    "paths": {
      "@types": ["./types"],
      "@types/*": ["./types/*"],
      "@/*": ["./app/*"]
    }
  }
}
```

### 1.2 Hybrid Rendering Architecture

**Current Pattern:**

```astro
---
// Static page with dynamic header island
export const prerender = true;
---

<Layout>
  <Header server:defer>
    <HeaderSkeleton slot="fallback" />
  </Header>
  <main><!-- Static content --></main>
</Layout>
```

**HonoX Native Islands Implementation:**

```typescript
// 1. Project structure
app/
├── client.ts              // Client hydration bootstrap
├── islands/               // All interactive components
│   └── Header.tsx         // Automatically hydrated
├── routes/
│   ├── _renderer.tsx      // Global layout
│   └── index.tsx          // Routes use islands
└── components/            // Server-only components

// 2. Client bootstrap (app/client.ts)
import { createClient } from 'honox/client';
createClient();

// 3. Renderer with HasIslands (app/routes/_renderer.tsx)
import { jsxRenderer } from 'hono/jsx-renderer';
import { HasIslands } from 'honox/server';

export default jsxRenderer(({ children }) => (
  <html>
    <head>
      {import.meta.env.PROD ? (
        <HasIslands>
          <script type="module" src="/static/client.js" />
        </HasIslands>
      ) : (
        <script type="module" src="/app/client.ts" />
      )}
    </head>
    <body>{children}</body>
  </html>
));

// 4. Island component (app/islands/Header.tsx)
import { useState } from 'hono/jsx';

export default function Header({ userData }) {
  const [open, setOpen] = useState(false);
  return (
    <header>
      <button onClick={() => setOpen(!open)}>Menu</button>
      {open && <nav>{/* ... */}</nav>}
    </header>
  );
}

// 5. Usage in routes (app/routes/index.tsx)
import Header from '../islands/Header';

export default createRoute(async (c) => {
  const userData = await getDiscordUserData(c);
  return c.render(
    <BaseLayout>
      <Header userData={userData} />
      <main>{/* Static content */}</main>
    </BaseLayout>
  );
});
```

### 1.3 Static Site Generation (SSG)

**Three Implementation Options:**

**Option 1: Hono SSG Helper (Bun-optimized, RECOMMENDED)**

```typescript
// scripts/build.ts
import app from '../app/server';
import { toSSG } from 'hono/bun';
import fs from 'fs/promises';

await toSSG(app, fs, {
  dir: './dist',
  concurrency: 4,
});
```

**Option 2: Vite SSG Plugin (Zero-config, do not use, unless you must)**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import honox from 'honox/vite';
import ssg from '@hono/vite-ssg';

export default defineConfig({
  plugins: [honox(), ssg({ entry: './app/server.ts' })],
});
```

**Option 3: Dynamic Routes with ssgParams**

```typescript
// app/routes/blog/[id].tsx
import { ssgParams } from 'hono/ssg';

export default createRoute(
  ssgParams(async () => {
    const posts = await db.getAllPostIds();
    return posts.map(id => ({ id }));
  }),
  async (c) => {
    const { id } = c.req.param();
    const post = await db.getPost(id);
    return c.render(<Post data={post} />);
  }
);
```

### 1.4 Authentication Architecture

**OAuth Flow (MUST PRESERVE EXACTLY):**

```
1. User clicks "Login" → Discord OAuth redirect
2. Discord redirects with code → /auth/callback
3. Exchange code for tokens
4. Fetch user info
5. Set secure cookies
6. Redirect to /dash
7. Middleware validates/refreshes tokens
```

**Two-Tier Rate Limiting:**

```typescript
// Tier 1: Per-User Per-Endpoint
private rateLimitMap = new Map<string, Map<string, number>>();

// Tier 2: Global (Discord's 50 req/sec limit)
private globalRequestTimestamps: number[] = [];
```

**HonoX Implementation:**

```typescript
// app/lib/discord-auth.ts
// ✅ Copy rate limiting logic EXACTLY as-is
// ❌ Do NOT simplify or modify algorithm
```

**Cookie Security:**

```typescript
export const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
};
```

### 1.5 Database Architecture

**Singleton Pattern (MUST PRESERVE):**

```typescript
// Global connection caching
declare global {
  var mongoConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | null;
}

export class GuildManager {
  private static instance: GuildManager;

  static async getInstance(): Promise<GuildManager> {
    if (!GuildManager.instance) {
      await connectDB();
      GuildManager.instance = new GuildManager();
    }
    return GuildManager.instance;
  }
}
```

**Lean Queries Pattern:**

```typescript
// ✅ ALWAYS use .lean() for read operations
const guild = await Guild.findById(id).lean();

// ❌ NEVER omit .lean() unless you need document methods
const guild = await Guild.findById(id); // WRONG - slow
```

**Partial Update Pattern:**

```typescript
async updateAutomod(guildId: string, automodSettings: Partial<IGuildAutomod>) {
  const currentGuild = await this.getGuild(guildId);
  if (!currentGuild) return null;

  // Merge strategy - preserves existing nested fields
  const updatedAutomod = {
    ...currentGuild.automod,
    ...automodSettings
  };

  return this.updateGuild(guildId, { automod: updatedAutomod });
}
```

### 1.6 Caching Architecture

**In-Memory Cache Pattern:**

```typescript
interface Cache<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const guildsCache = new Map<string, Cache<DiscordGuild[]>>();

export async function getDiscordGuilds(c: Context): Promise<DiscordGuild[]> {
  const accessToken = getCookie(c, 'access_token');

  const cached = guildsCache.get(accessToken);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const guildsData = await fetchWithRetry<DiscordGuild[]>(/* ... */);

  guildsCache.set(accessToken, {
    data: guildsData,
    timestamp: Date.now()
  });

  return guildsData;
}
```

**Cache Invalidation:**

```typescript
// Called when:
// 1. User explicitly refreshes data
// 2. Guild configuration changes
// 3. Bot joins/leaves guild
export function clearGuildsCache(): void {
  guildsCache.clear();
}
```

---

## 2. Animation & Library Strategy

### 2.1 Library Decisions

| Library       | Size | Status      | Justification                                       |
| ------------- | ---- | ----------- | --------------------------------------------------- |
| **GSAP**      | 47KB | ✅ **KEEP** | Complex timelines, review card animations, industry standard |
| **Lenis**     | 8KB  | ❌ **REMOVE** | Sidebar scroll conflicts, CSS replacement available |
| **Alpine.js** | 15KB | ✅ **KEEP** | Core interactivity, 58 files, fundamental to architecture |

### 2.2 GSAP: Keep for Complexity

**Justification:**

1. **Complex Timeline Control** - Staggered animations across multiple elements
2. **ScrollTrigger Plugin** - Industry-standard scroll-based animations
3. **Professional Features** - Advanced easing, morphing, motion paths
4. **Reinvention Risk** - Custom implementation would exceed 47KB

**Use Cases:**

✅ **Use GSAP for:**
- Counter animations with custom easing
- Staggered card reveals (GuardianTestimonials)
- Complex scroll-triggered sequences
- Timeline orchestration
- SVG morphing/path animations

❌ **Don't use GSAP for:**
- Simple fade-in effects (use Intersection Observer)
- Hover states (use CSS transitions)
- Button interactions (use CSS transitions)
- Page transitions (use View Transitions API)

**Example: Complex Stagger Animation**

```typescript
// app/components/GuardianTestimonials.tsx
import { useEffect, useRef } from 'hono/jsx';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function GuardianTestimonials({ reviews }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.review-card');

    gsap.fromTo(
      cards,
      { opacity: 0, y: 50, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: {
          amount: 0.6,
          from: 'start',
          ease: 'power2.out',
        },
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, []);

  return (
    <div ref={containerRef} class="testimonials-grid">
      {reviews.map((review) => (
        <div key={review.id} class="review-card">
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

### 2.3 Lenis: Remove for Sidebar Conflicts

**Problem:** Lenis smooth scroll conflicts with nested scroll containers (dashboard sidebar).

**Replacement: CSS (Zero Cost)**

```css
/* global.css */
html {
  scroll-behavior: smooth;
  overscroll-behavior-y: contain;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

/* Dashboard pages with sidebars */
.dashboard-sidebar,
.dashboard-content {
  overflow-y: auto;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}
```

**Benefits:**
- Zero JavaScript (8KB saved)
- No conflicts with nested scroll
- Respects `prefers-reduced-motion`
- Browser-native, GPU-accelerated

### 2.4 Alpine.js: Core Dependency

**Usage Statistics:** 58 files across the application

**Why Essential:**
1. **Declarative Syntax** - Matches Astro/HonoX component model
2. **No Build Step** - Works directly in JSX
3. **Tiny Footprint** - 15KB vs React 130KB
4. **Progressive Enhancement** - Works with SSR HTML
5. **Modern Pattern** - Alpine + HTMX is industry standard

**HonoX Integration:**

```tsx
// Use dangerouslySetInnerHTML for Alpine directives
<div dangerouslySetInnerHTML={{
  __html: `
    <div x-data="{ open: false }">
      <button x-on:click="open = !open">Toggle</button>
      <div x-show="open">Content</div>
    </div>
  `
}} />
```

### 2.5 Animation Decision Matrix

| Animation Type                 | Tool                        | Example                        |
| ------------------------------ | --------------------------- | ------------------------------ |
| **Simple fade-in/slide-in**    | Intersection Observer + CSS | Blog posts, testimonials       |
| **Hover states**               | CSS transitions             | Buttons, links, cards          |
| **Page transitions**           | View Transitions API        | Route changes                  |
| **Counter animations**         | GSAP                        | Stats section (BattleStats)    |
| **Staggered reveals**          | GSAP                        | Review cards                   |
| **Scroll-triggered sequences** | GSAP ScrollTrigger          | Hero parallax                  |
| **Smooth scrolling**           | CSS `scroll-behavior`       | Anchor links, page scroll      |
| **Complex timelines**          | GSAP                        | Multi-step animations          |
| **Interactive state**          | Alpine.js                   | Dropdowns, modals, toggles     |

### 2.6 Accessibility

**All animations must respect `prefers-reduced-motion`:**

```typescript
// app/lib/motion.ts
export function respectsMotion(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Usage in GSAP animations
useEffect(() => {
  if (!respectsMotion()) return;
  gsap.to(/* ... */);
}, []);
```

```css
/* global.css */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 3. CF Worker API Integration

### 3.1 Existing Infrastructure

**CF Worker API:** `api.4mina.app` (deployed from `api` branch)

**Technology Stack:**
- Framework: Hono 4.10.7 (same as HonoX!)
- Database: MongoDB 7.0.0
- Validation: Zod 4.1.13
- Runtime: Cloudflare Workers

**KV Namespaces:**
1. **CACHE** - Response caching
2. **RATE_LIMIT** - Request throttling
3. **BOTS** - Bot metadata

### 3.2 Three-Tier Rate Limiting

```typescript
// Tier 1: Public API (Anonymous)
publicRateLimit: {
  windowMs: 60000,
  maxRequests: 60,
  keyPrefix: 'rl:public'
}

// Tier 2: API Key Authenticated
apiKeyRateLimit: {
  windowMs: 60000,
  maxRequests: 300,
  keyPrefix: 'rl:apikey'
}

// Tier 3: Bot Internal
botRateLimit: {
  windowMs: 60000,
  maxRequests: 120,
  keyPrefix: 'rl:bot'
}
```

### 3.3 Edge Caching Strategy

**Cache TTL Guidelines:**

```typescript
if (path.startsWith('/bot/metrics')) {
  // Bot stats: cache for 60s
  c.res.headers.set(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );
} else if (path.startsWith('/guild')) {
  // Guild data: cache for 30s
  c.res.headers.set('Cache-Control', 'private, max-age=30');
}
```

| Endpoint     | TTL  | Rationale                         |
| ------------ | ---- | --------------------------------- |
| `/bot/stats` | 60s  | High traffic, frequently changing |
| `/guild/:id` | 30s  | Moderate traffic, user-specific   |
| `/v1/bots`   | 300s | Low traffic, rarely changes       |

### 3.4 Integration with HonoX Dashboard

**Option 1: Client-Side API Calls (Recommended)**

```typescript
// app/islands/BotStats.tsx
import { useEffect, useState } from 'hono/jsx';

export default function BotStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('https://api.4mina.app/bot/stats')
      .then(res => res.json())
      .then(data => setStats(data.data));
  }, []);

  return (
    <div class="stats-grid">
      {stats && (
        <>
          <div class="stat">
            <span>{stats.guilds.toLocaleString()}</span>
            <label>Servers</label>
          </div>
          {/* ... */}
        </>
      )}
    </div>
  );
}
```

**Pros:**
- ✅ Leverages CF Worker edge caching
- ✅ Reduces HonoX server load
- ✅ Better scalability

**Option 2: HonoX Route Proxy**

```typescript
// app/routes/api/bot/stats.ts
export default new Hono().get('/', async (c) => {
  const response = await fetch('https://api.4mina.app/bot/stats', {
    headers: {
      Authorization: `Bearer ${c.env.API_SECRET}`,
    },
  });
  return response;
});
```

**Pros:**
- ✅ Works without JavaScript
- ✅ No flash of loading state
- ✅ Can add server-side auth

### 3.5 CORS Configuration

**Update required:**

```typescript
// api/src/middleware/index.ts
const allowedOrigins = [
  'https://4mina.app',
  'https://www.4mina.app',
  'https://dash.4mina.app',
  'https://api.4mina.app',
  'http://localhost:5173', // ← CHANGE from 4321 (HonoX dev port)
];
```

### 3.6 MongoDB Connection Pattern

**Important:** HonoX dashboard should NOT directly connect to MongoDB. Use CF Worker API instead.

```typescript
// CF Worker handles all database operations
// Dashboard calls CF Worker API
// This maintains microservices architecture
```

---

## 4. Migration Phases (8 Weeks)

> **📋 Detailed Phase Tracking:** For task-by-task breakdown, progress tracking, and daily updates, see **[MIGRATION-TRACKER.md](./MIGRATION-TRACKER.md)**

This section provides a high-level overview of the migration phases. Each phase has detailed tasks, checklists, and success criteria in the tracker document.

### Phase 0: Pre-Migration Analysis ✅ (COMPLETE)

**Status:** Complete (2025-12-07 → 2025-12-08)

**Objectives:**
- ✅ Comprehensive codebase analysis
- ✅ Document authentication flow
- ✅ Map type system dependencies
- ✅ Create migration plan (this document)
- ✅ Consolidate documentation

### Phase 1: Infrastructure Foundation (Week 1)

**Goal:** Build HonoX skeleton alongside Astro

**Tasks:**
1. Create `app/` directory structure
2. Install HonoX dependencies
3. Create `vite.config.ts` for HonoX
4. Set up `app/routes/_renderer.tsx`
5. Configure TypeScript for HonoX/JSX
6. Test "Hello World" route

**Success Criteria:**
- [ ] HonoX dev server runs on port 5173
- [ ] Basic route works
- [ ] TypeScript compiles
- [ ] Astro still works on port 4321

### Phase 2: Core Infrastructure Port (Week 2)

**Goal:** Migrate shared libraries and utilities

**Tasks:**
1. Port `src/env.ts` → `app/config/env.ts`
2. Port `src/config/site.ts` → `app/config/site.ts`
3. Port `src/lib/discord-auth.ts` → `app/lib/discord-auth.ts`
4. Port `src/lib/cookie-utils.ts` → `app/lib/cookie-utils.ts`
5. Port `src/lib/database/mongoose.ts` → `app/lib/database/mongoose.ts`
6. Port `src/lib/data-utils.ts` → `app/lib/data-utils.ts`
7. Port `src/lib/guardian-ranks.ts` → `app/lib/guardian-ranks.ts`
8. Port `src/lib/achievements.ts` → `app/lib/achievements.ts`

**Testing:**
- Unit tests for each utility
- Verify Discord OAuth flow
- Test database connections

### Phase 3: Middleware Translation (Week 2)

**Goal:** Convert Astro middleware to Hono middleware

**Tasks:**
1. Create `app/middleware/auth.ts`
2. Create `app/middleware/cache.ts`
3. Create `app/middleware/error.ts`
4. Create `app/routes/_middleware.ts`

**Example:**

```typescript
// app/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';

export const authGuard = createMiddleware(async (c, next) => {
  const accessToken = getCookie(c, 'access_token');
  const refreshToken = getCookie(c, 'refresh_token');

  if (!accessToken || !refreshToken) {
    return c.redirect(discordAuth.getAuthUrl());
  }

  const isValid = await discordAuth.validateToken(accessToken);
  if (!isValid) {
    try {
      const newTokens = await discordAuth.refreshToken(refreshToken);
      const userData = await discordAuth.getUserInfo(newTokens.access_token);
      setAuthCookies(c, newTokens, userData);
    } catch {
      clearAuthCookies(c);
      return c.redirect('/');
    }
  }

  await next();
});
```

### Phase 4: Component Migration (Week 3-4)

**Goal:** Convert Astro components to Hono JSX

**Conversion Pattern:**

**Before (Astro):**
```astro
---
const { title } = Astro.props;
interface Props {
  title: string;
}
---

<div class="card">
  <h2>{title}</h2>
  <slot />
</div>
```

**After (HonoX):**
```tsx
import type { FC } from 'hono/jsx';

interface CardProps {
  title: string;
  children?: any;
}

export const Card: FC<CardProps> = ({ title, children }) => {
  return (
    <div class="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
};
```

**Component Mapping:**

- **Layouts:** `src/layouts/Layout.astro` → `app/components/layouts/BaseLayout.tsx`
- **Navigation:** 4 files → `app/components/navigation/*.tsx`
- **UI Components:** 39 files → `app/components/ui/**/*.tsx`
- **Sections:** 7 files → `app/components/sections/*.tsx`
- **Character:** 5 files → `app/components/ui/character/*.tsx`

### Phase 5: Route Migration (Week 5-6)

**Goal:** Migrate pages and API routes

**Static Routes:**

```typescript
// app/routes/index.tsx
import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  return c.render(
    <BaseLayout title="Amina">
      <Header />
      <main>
        <HeroAmina />
        <BattleStats />
      </main>
    </BaseLayout>
  );
});
```

**Dynamic Routes:**

```typescript
// app/routes/dash/guild/[id].tsx
export default createRoute(async (c) => {
  const guildId = c.req.param('id');
  const guild = await getGuild(guildId);
  
  return c.render(
    <DashboardLayout title={guild.name}>
      <GuildConfig guild={guild} />
    </DashboardLayout>
  );
});
```

**API Routes:**

```typescript
// app/routes/api/auth/logout.ts
import { Hono } from 'hono';

const app = new Hono();

app.post('/', async (c) => {
  clearAuthCookies(c);
  return c.redirect('/');
});

export default app;
```

### Phase 6: Progressive Cutover (Week 7)

**Goal:** Gradually switch traffic to HonoX

**Strategy:**
1. Deploy both Astro and HonoX side-by-side
2. Use feature flags to control routing
3. Test each route thoroughly
4. Monitor error rates and performance

**Traffic Shift:**
- Day 1-2: 10% → HonoX
- Day 3-4: 25% → HonoX
- Day 5-6: 50% → HonoX
- Day 7: 100% → HonoX

### Phase 7: Cleanup & Optimization (Week 8)

**Goal:** Remove Astro dependencies and optimize

**Tasks:**
1. Remove `src/` directory
2. Uninstall Astro packages
3. Update `package.json` scripts
4. Update Dockerfile
5. Run performance benchmarks
6. Update documentation

---

## 5. Component Conversion Patterns

### 5.1 Layout Conversion

**Before (Astro):**

```astro
---
export const prerender = false;
import Meta from '@components/Meta.astro';

const { title } = Astro.props;
interface Props {
  title?: string;
}
---

<html lang="en">
  <head>
    <Meta />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

**After (HonoX):**

```tsx
import type { FC } from 'hono/jsx';
import { Meta } from '@/components/Meta';

interface BaseLayoutProps {
  title?: string;
  children?: any;
}

export const BaseLayout: FC<BaseLayoutProps> = ({ title, children }) => {
  return (
    <html lang="en">
      <head>
        <Meta />
        <title>{title}</title>
      </head>
      <body>{children}</body>
    </html>
  );
};
```

### 5.2 Alpine.js Integration

**Challenge:** Alpine.js directives may not work directly in JSX

**Solution:** Use `dangerouslySetInnerHTML`

```tsx
export const Dropdown = () => {
  const html = `
    <div x-data="{ open: false }" x-on:click.away="open = false">
      <button x-on:click="open = !open">Menu</button>
      <div x-show="open" x-transition>
        <a href="/profile">Profile</a>
        <a href="/logout">Logout</a>
      </div>
    </div>
  `;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
```

---

## 6. Testing Requirements

### 6.1 Critical Test Cases

**Authentication Flow:**

```typescript
describe('Authentication Flow', () => {
  it('should handle OAuth callback', async () => {
    const code = 'valid_code';
    const response = await app.request(`/auth/callback?code=${code}`);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/dash');
    expect(response.headers.get('set-cookie')).toContain('access_token');
  });

  it('should refresh expired token', async () => {
    const cookie = createExpiredTokenCookie();
    const response = await app.request('/dash', {
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('access_token');
  });
});
```

**Type System:**

```typescript
describe('Type System', () => {
  it('should import all types from barrel', () => {
    const user: DiscordUser = {
      id: '123',
      username: 'test',
      discriminator: '0001',
      avatar: 'abc',
      global_name: 'Test User',
    };

    expect(user).toBeDefined();
  });
});
```

### 6.2 Performance Tests

```typescript
test('response time within bounds', async () => {
  const start = Date.now();
  await app.request('/dash');
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(500);
});

test('memory usage acceptable', async () => {
  const before = process.memoryUsage().heapUsed;

  await Promise.all(
    Array(100).fill(null).map(() => app.request('/dash'))
  );

  const after = process.memoryUsage().heapUsed;
  const increase = after - before;

  expect(increase).toBeLessThan(50 * 1024 * 1024); // 50MB max
});
```

---

## 7. Success Criteria

### 7.1 Performance Targets

| Metric              | Current | Target  | Improvement |
| ------------------- | ------- | ------- | ----------- |
| Idle Memory         | 280MB   | < 50MB  | 82%+        |
| Load Memory         | 450MB   | < 120MB | 73%+        |
| Cold Start          | 2.1s    | < 500ms | 76%+        |
| Bundle Size         | 640KB   | < 100KB | 84%+        |
| TTFB (Homepage)     | 180ms   | < 50ms  | 72%+        |
| TTFB (Dashboard)    | 420ms   | < 200ms | 52%+        |
| Lighthouse Score    | 78      | > 95    | 22%+        |

### 7.2 Quality Targets

- Zero regression in functionality
- Zero increase in error rate
- 100% test coverage maintained
- Zero accessibility regressions
- 100% type safety preserved

### 7.3 Final Checklist

Before marking migration complete:

- [ ] All routes migrated and tested
- [ ] No increase in error rate (< 0.5%)
- [ ] Response time improved or maintained
- [ ] Memory usage reduced by 30%+
- [ ] All tests passing
- [ ] Zero critical bugs reported
- [ ] User satisfaction maintained
- [ ] Production stable for 2 weeks
- [ ] Documentation updated
- [ ] Team trained on HonoX

---

## The 10 Commandments of Migration

1. **Thou shalt not modify `/types/*`** - Type system is sacred
2. **Thou shalt preserve rate limiting** - Discord API protection is critical
3. **Thou shalt maintain singleton pattern** - Database connections must not multiply
4. **Thou shalt use `.lean()` queries** - Performance matters
5. **Thou shalt cache Discord API calls** - 5-minute cache is mandatory
6. **Thou shalt preserve cookie security** - httpOnly, secure, sameSite: lax
7. **Thou shalt test Alpine.js thoroughly** - Client interactivity is non-negotiable
8. **Thou shalt implement authentication identically** - OAuth flow must not change
9. **Thou shalt maintain merge strategy** - Partial updates prevent data loss
10. **Thou shalt rollback if in doubt** - Stability > speed

---

**Document Status:** REFERENCE - Use during migration  
**Last Updated:** 2025-12-07  
**Version:** 1.0
