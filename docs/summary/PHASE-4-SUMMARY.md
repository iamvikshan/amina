# Phase 4: Component Migration — Summary

**Status:** 🟢 In Progress  
**Started:** 2025-12-08  
**Last Updated:** 2025-12-14

## Goal

Migrate Astro UI/components to HonoX TSX while preserving the existing design system and behavior (including Alpine-like `x-*` usage where applicable).

## Completed (high level)

### Foundation components

- `app/components/BrandLogo.tsx`
- `app/components/ThemeIcon.tsx`
- `app/components/Meta.tsx`
- `app/components/ui/StatusPill.tsx`
- `app/components/ui/icons/LucideIcon.tsx`
- `app/components/ui/buttons/LoginBtn.tsx`
- `app/components/ui/buttons/PrimaryBtn.tsx`
- `app/components/ui/buttons/SecondaryBtn.tsx`
- `app/components/layouts/BaseLayout.tsx`

### Homepage sections (content parity)

- `app/routes/index.tsx` rewritten to match the Astro homepage composition.
- `app/components/sections/*` TSX ports (hero, steps, testimonials, etc.).

### Dashboard UI building blocks (no `/dash` route changes)

These are reusable components used by the Astro dashboard pages, ported into `app/components/**` so `/dash` route migration can happen later:

- Navigation:
  - `app/components/navigation/DashboardFooter.tsx`
  - `app/components/navigation/UserAvatarDropdown.tsx`
- Dashboard UI:
  - `app/components/ui/dashboard/Sidebar.tsx`
  - `app/components/ui/dashboard/SidebarIcon.tsx`
  - `app/components/ui/dashboard/ServerCard.tsx`
- Avatar / character UI:
  - `app/components/ui/avatars/Avatar.tsx`
  - `app/components/ui/character/AminaPortrait.tsx`
  - `app/components/ui/character/SpeechBubble.tsx`
  - `app/components/ui/character/GuardianBadge.tsx`
  - `app/components/ui/character/AchievementBadge.tsx`
- Links:
  - `app/components/ui/links/FooterSocialLink.tsx`

### Type system support

- `types/alpine.d.ts`: enables Alpine-style `x-*` attributes in TSX without breaking `bun run check`.
- `types/dashboard-ui.d.ts`: shared dashboard UI types.

## Cross-cutting: Static assets moved out of `src/`

To support eventual removal of `src/`, runtime assets were moved to `public/assets/**` and referenced via `/assets/**`.

- `src/assets/styles/*` → `public/assets/styles/*`
- `src/assets/scripts/*` → `public/assets/scripts/*`

## Validation

- `bun run check`: ✅ passing
- `bun run build`: ✅ passing

## Next

- Port `Header.astro` → `app/components/navigation/Header.tsx` (still without migrating `/dash` routes).

See `docs/summary/phase-4-progress.md` for earlier detailed notes from the initial session.
