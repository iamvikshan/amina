# HonoX Migration Tracker

**Project:** Amina Dashboard (branch: `dash`)  
**Started:** 2025-12-07  
**Current Focus:** Phase 4 (Components) + Phase 5 (Routes; `/dash` pages deferred)  
**Last Updated:** 2025-12-14

This tracker is intentionally kept concise (<700 lines). Detailed phase notes live in `docs/summary/`.

---

## Status Overview

| Phase       | Status         | Summary                                                                    |
| ----------- | -------------- | -------------------------------------------------------------------------- |
| **Phase 0** | ✅ Complete    | Pre-migration analysis (see `docs/MIGRATION-GUIDE.md`)                     |
| **Phase 1** | ✅ Complete    | Infrastructure foundation (HonoX skeleton)                                 |
| **Phase 2** | ✅ Complete    | Core libs + auth utilities ported (auth flow preserved)                    |
| **Phase 3** | ✅ Complete    | Middleware translation (auth/error/cache)                                  |
| **Phase 4** | 🟢 In Progress | Component migration (homepage + dashboard primitives)                      |
| **Phase 5** | 🟢 In Progress | Route migration (page parity achieved; `/dash` pages intentionally paused) |
| **Phase 6** | 🔲 Not Started | Progressive cutover                                                        |
| **Phase 7** | 🔲 Not Started | Cleanup & optimization                                                     |

---

## Recent Completed Work

### 2025-12-14

- Static assets moved out of `src/assets/**` → `public/assets/**` and referenced via `/assets/**`.
  - CSS: `public/assets/styles/global.css`, `public/assets/styles/lenis.css`
  - Scripts: `public/assets/scripts/hydrateMetrics.js`, `public/assets/scripts/lenisSmoothScroll.js`
- Dashboard UI building blocks ported to TSX (no `/dash` route changes): sidebar, cards, avatar dropdown, dashboard footer, character badges.
- 404 page ported:
  - Global not-found handler: `app/routes/_404.tsx` for unknown paths.
  - UI: `app/components/pages/NotFoundPage.tsx`, `app/components/ui/buttons/Btn404.tsx`, `app/components/navigation/HeaderSkeleton.tsx`.
- Type safety: added Alpine attribute typings + dashboard UI types (all imported via `@types`).
- Validation: `bun run check` and `bun run build` passing.
- Dev SSR fix: updated file-based API route method exports to use `createRoute(...)` (handler arrays) so `createApp()` can register them without spreading non-iterables; also externalized `mongoose` in Vite SSR and made `favicon.ico` route work under Node-based dev server.

---

## Current Scope Rules

- Preserve auth flow exactly (OAuth, rate limiting, token refresh).
- Types only in `/types/**`; import types from `@types` only.
- Prefer `.lean()` for Mongoose reads.
- Do not migrate `/dash` routes yet; only migrate reusable UI pieces they depend on.

---

## Next Up

- Port `Header.astro` → `app/components/navigation/Header.tsx` (use existing `UserAvatarDropdown.tsx`).
- Verify there are no remaining runtime references to `/src/assets/**` in HonoX routes/layouts.

---

## Phase Summaries

- `docs/summary/PHASE-1-SUMMARY.md`
- `docs/summary/PHASE-2-SUMMARY.md`
- `docs/summary/phase-4-progress.md` (older detailed progress log)
