# HonoX Migration Quick Start

**Quick reference for daily development during migration**

---

## At a Glance

- **Timeline:** 8 weeks
- **Target Memory:** 87% reduction (280MB → 35MB idle)
- **Target Bundle:** 84% reduction (640KB → 100KB)
- **Keep:** GSAP (47KB), Alpine.js (15KB)
- **Remove:** Lenis (8KB) → CSS replacement
- **Remove:** Astro (570KB) → HonoX (50KB)

---

## Syntax Conversions

### Component Structure

| Astro                           | HonoX                            |
| ------------------------------- | -------------------------------- |
| `---` frontmatter               | ES6 imports                      |
| `<slot />`                      | `{children}`                     |
| `Astro.props.name`              | `{ name }` parameter             |
| `.astro` extension              | `.tsx` extension                 |
| `export const prerender = true` | SSG config in route              |

### Import Rules

```typescript
// ✅ CORRECT
import type { DiscordUser, IGuild } from '@types';
import { Header } from '@/components/navigation/Header';
import { discordAuth } from '@/lib/discord-auth';

// ❌ WRONG
import type { DiscordUser } from '@types/discord'; // No direct imports
import { Header } from '../../components/Header'; // No relative paths
```

### Request Data

```typescript
// Astro
const { guildId } = Astro.params;
const code = Astro.url.searchParams.get('code');
const token = Astro.cookies.get('access_token')?.value;

// HonoX
const guildId = c.req.param('id'); // Note: 'id' not 'guildId'
const code = c.req.query('code');
const token = getCookie(c, 'access_token');
```

### Middleware

```typescript
// Astro
import { defineMiddleware } from 'astro:middleware';

export const authGuard = defineMiddleware(async ({ cookies, redirect }, next) => {
  if (!cookies.has('access_token')) {
    return redirect('/auth');
  }
  return next();
});

// HonoX
import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';

export const authGuard = createMiddleware(async (c, next) => {
  if (!getCookie(c, 'access_token')) {
    return c.redirect('/auth');
  }
  await next(); // ← Don't forget await!
});
```

---

## Copy-Paste Ready Patterns

### Pattern 1: Basic Page

```tsx
// app/routes/example.tsx
import { createRoute } from 'honox/factory';
import { BaseLayout } from '@/components/layouts/BaseLayout';

export default createRoute(async (c) => {
  const data = await fetchData();

  return c.render(
    <BaseLayout title="Page Title">
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </BaseLayout>
  );
});
```

### Pattern 2: Protected Route

```tsx
// app/routes/dash/index.tsx
import { createRoute } from 'honox/factory';
import { getDiscordUserData } from '@/lib/data-utils';

// Middleware applied in _middleware.ts
export default createRoute(async (c) => {
  const userData = await getDiscordUserData(c);

  return c.render(
    <DashboardLayout>
      <h1>Welcome, {userData.username}!</h1>
    </DashboardLayout>
  );
});
```

### Pattern 3: API Endpoint

```tsx
// app/routes/api/example.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  const data = await fetchData();
  return c.json({ data });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  await saveData(body);
  return c.json({ success: true });
});

export default app;
```

### Pattern 4: Component with Props

```tsx
// app/components/ui/Card.tsx
import type { FC } from 'hono/jsx';

interface CardProps {
  title: string;
  description?: string;
  children?: any;
}

export const Card: FC<CardProps> = ({ title, description, children }) => {
  return (
    <div class="card">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
};
```

### Pattern 5: Alpine.js Component

```tsx
// app/components/Dropdown.tsx
import type { FC } from 'hono/jsx';

export const Dropdown: FC<{ items: string[] }> = ({ items }) => {
  const html = `
    <div x-data="{ open: false }" x-on:click.away="open = false">
      <button 
        x-on:click="open = !open" 
        :aria-expanded="open"
        class="btn"
      >
        Menu
      </button>
      <div 
        x-show="open" 
        x-transition
        class="dropdown-menu"
      >
        ${items.map(item => `<a href="#">${item}</a>`).join('')}
      </div>
    </div>
  `;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
```

### Pattern 6: Island Component

```tsx
// app/islands/Counter.tsx
import { useState } from 'hono/jsx';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

// Usage in routes
import Counter from '../islands/Counter';

export default createRoute((c) => {
  return c.render(
    <BaseLayout>
      <Counter />
    </BaseLayout>
  );
});
```

---

## Common Patterns

### Database Query

```typescript
// ✅ CORRECT - Always use .lean()
const guild = await Guild.findById(guildId).lean();

// ❌ WRONG - Slow, uses more memory
const guild = await Guild.findById(guildId);
```

### Caching

```typescript
const cached = guildsCache.get(accessToken);
if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
  return cached.data;
}

const fresh = await fetchData();
guildsCache.set(accessToken, { data: fresh, timestamp: Date.now() });
return fresh;
```

### Cookie Utilities

```typescript
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// Get
const token = getCookie(c, 'access_token');

// Set
setCookie(c, 'access_token', token, {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'Lax',
  maxAge: 3600,
});

// Delete
deleteCookie(c, 'access_token');
```

---

## Import Rules

### ✅ DO

```typescript
// Always import from barrel export
import type { DiscordUser, IGuild, TokenData } from '@types';

// Use absolute paths with @
import { Header } from '@/components/navigation/Header';
import { discordAuth } from '@/lib/discord-auth';

// Group imports logically
import type { ... } from '@types';           // Types first
import { Component } from '@/components/...'; // Components
import { utility } from '@/lib/...';          // Utilities
```

### ❌ DON'T

```typescript
// Never import directly from type files
import type { DiscordUser } from '@types/discord';

// Never use relative paths
import { Header } from '../../components/Header';

// Never define types inline
type DiscordUser = { id: string; ... };
```

---

## Debugging Quick Fixes

### Issue: "Cookie not found"

```typescript
// Debug: Log all cookies
console.log('All cookies:', c.req.header('cookie'));

// Check specific cookie
const token = getCookie(c, 'access_token');
console.log('Token:', token);

// Verify cookie options
setCookie(c, 'test', 'value', {
  path: '/',
  secure: false, // Try false in dev
  httpOnly: true,
  sameSite: 'Lax',
});
```

### Issue: "Module not found"

```typescript
// Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@types": ["./types"],
      "@/*": ["./app/*"]
    }
  }
}

// Use absolute imports
import { Header } from '@/components/navigation/Header'; // ✅
import { Header } from '../../components/Header'; // ❌
```

### Issue: "Alpine.js not working"

```html
<!-- Verify Alpine.js is loaded -->
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.15.2/dist/cdn.min.js" defer></script>

<!-- Test simple component -->
<div x-data="{ test: 'works' }" x-text="test"></div>

<!-- Check console for errors -->
```

### Issue: "Middleware not executing"

```typescript
// Don't forget await!
export const myMiddleware = createMiddleware(async (c, next) => {
  console.log('Before');
  await next(); // ← MUST have await
  console.log('After');
});

// Apply middleware
// app/routes/_middleware.ts
import { authGuard } from '@/middleware/auth';

export default authGuard;
```

---

## Command Reference

```bash
# Development
bun run dev              # Start Astro (port 4321)
bun run dev:honox        # Start HonoX (port 5173)

# Type checking
bun run typecheck        # TypeScript check
bun run check            # Astro check + prettier

# Building
bun run build            # Build for production
bun run preview          # Preview production build

# Testing
bun test                 # Run all tests
bun test:watch           # Watch mode
bun test:coverage        # Coverage report

# Docker
docker compose up -d     # Start all services
docker compose down      # Stop all services
docker compose logs -f   # Follow logs
```

---

## Animation Guide

### When to Use What

| Need                      | Tool                  | Size | Example                 |
| ------------------------- | --------------------- | ---- | ----------------------- |
| Simple fade/slide         | CSS + Intersection    | 0KB  | Blog cards              |
| Hover effects             | CSS transitions       | 0KB  | Buttons                 |
| Smooth scrolling          | CSS scroll-behavior   | 0KB  | Anchor links            |
| Counter animations        | GSAP                  | 47KB | BattleStats             |
| Staggered card reveals    | GSAP + ScrollTrigger  | 47KB | GuardianTestimonials    |
| Dropdowns/modals          | Alpine.js             | 15KB | User menu               |
| Complex timelines         | GSAP                  | 47KB | Multi-step sequences    |

### GSAP Example

```typescript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

useEffect(() => {
  gsap.fromTo(
    '.card',
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.container',
        start: 'top 80%',
      },
    }
  );
}, []);
```

### CSS Smooth Scroll

```css
/* Already in global.css */
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

### Alpine.js Example

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open" x-transition>Content</div>
</div>
```

---

## Performance Checklist

- [ ] Use `.lean()` for all database queries
- [ ] Implement 5-minute cache for API calls
- [ ] Use rate limiting for external APIs
- [ ] Minimize bundle size (code splitting)
- [ ] Lazy load non-critical components
- [ ] Set appropriate cache headers
- [ ] Use connection pooling (MongoDB)
- [ ] Respect `prefers-reduced-motion`

---

## Testing Checklist

Before marking a component "complete":

### Visual
- [ ] Renders correctly
- [ ] Responsive (mobile/tablet/desktop)
- [ ] Dark mode works
- [ ] Hover states work

### Functional
- [ ] All props work
- [ ] Event handlers work
- [ ] Alpine.js directives work (if any)
- [ ] Navigation works

### Technical
- [ ] TypeScript compiles
- [ ] No console errors
- [ ] No console warnings
- [ ] Performance acceptable

### Code Quality
- [ ] Follows naming conventions
- [ ] Proper type annotations
- [ ] Comments for complex logic
- [ ] No duplicate code
- [ ] Accessibility maintained

---

## Need Help?

1. **Check MIGRATION-GUIDE.md** - Comprehensive technical details
2. **Check RISK-AND-ROLLBACK.md** - Risk management and rollback procedures
3. **Search migrated components** - Look for similar examples
4. **Ask the team** - Don't struggle alone!

---

## Quick Tips

💡 **Always await `next()` in middleware** - `await next()`, not just `next()`

💡 **Use barrel imports for types** - `from '@types'`, never `from '@types/discord'`

💡 **Alpine.js needs dangerouslySetInnerHTML** - JSX doesn't support custom attributes

💡 **Always use `.lean()` queries** - 5x faster, less memory

💡 **Cache API calls for 5 minutes** - Reduces Discord API load by 80%

💡 **Test auth flow thoroughly** - Most complex part of migration

💡 **Monitor memory usage** - Should be < 100MB under load

💡 **Respect user motion preferences** - Check `prefers-reduced-motion`

---

**Last Updated:** 2025-12-07  
**Version:** 1.0
