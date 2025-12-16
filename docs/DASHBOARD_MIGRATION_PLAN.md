# Dashboard Migration Plan: Chakra UI Refactor

**Status**: 🔄 Phase 6 - Chakra UI Migration (Major Refactor)  
**Target**: Exact clone of discord-bot-dashboard-next reference frontend  
**Framework**: HonoX (Hono + Vite + React JSX) + **Chakra UI**  
**Created**: 2025-12-15  
**Last Updated**: 2025-12-16

---

## 🚨 Major Pivot: Tailwind → Chakra UI

After completing Phases 1-5 with Tailwind CSS, we're pivoting to **Chakra UI** to achieve pixel-perfect parity with the reference dashboard. The current Tailwind implementation doesn't match the reference UI closely enough.

### Why Chakra UI?

1. **Exact Match** - Reference uses Chakra UI; using same library = identical look
2. **Component Parity** - Chakra's built-in components match reference exactly
3. **Theme System** - Semantic tokens, color modes, component variants
4. **Less Custom CSS** - Reference's theme config can be adapted directly
5. **Form Integration** - `chakra-react-select` for Discord pickers

### What We Keep

- ✅ HonoX framework (routes, middleware, server)
- ✅ Route structure (`/dash/*`, `/api/*`)
- ✅ Type system (`/types/*` with barrel exports)
- ✅ React Query hooks architecture
- ✅ MongoDB driver integration
- ✅ Auth middleware flow

### What We Replace

- ❌ Tailwind CSS → Chakra UI (for dashboard only)
- ❌ Preline UI components → Chakra components
- ❌ Alpine.js interactions → Chakra's built-in (Drawer, Menu, Modal)
- ❌ Custom form components → Chakra form components
- ❌ Current dashboard components → Port from reference

---

## 📦 New Dependencies

```json
{
  "@chakra-ui/react": "^2.8.0",
  "@emotion/react": "^11.11.0",
  "@emotion/styled": "^11.11.0",
  "framer-motion": "^10.16.0",
  "chakra-react-select": "^4.7.0",
  "react-colorful": "^5.6.1",
  "react-calendar": "^4.8.0",
  "react-icons": "^4.12.0",
  "apexcharts": "^3.45.0",
  "react-apexcharts": "^1.4.1"
}
```

### Keep for Public Site

- Tailwind CSS v4 (public pages only)
- Alpine.js (public pages only)
- Preline (public pages only)

---

## 🎨 Theme Configuration

### Port from Reference

Copy and adapt `/src/theme/` from reference:

```
app/theme/
├── config.tsx              # extendTheme setup
├── colors.ts               # Brand colors, semantic tokens
├── breakpoints.ts          # Responsive breakpoints
├── components/
│   ├── avatar.ts
│   ├── button.ts
│   ├── card.ts
│   ├── input.ts
│   ├── menu.ts
│   ├── modal.ts
│   ├── popover.ts
│   ├── select.ts
│   ├── skeleton.ts
│   ├── slider.ts
│   ├── switch.ts
│   ├── tabs.ts
│   └── textarea.ts
└── styles/
    └── global.ts           # Global styles
```

### Color Palette (Amina's Colors - Akame ga Kill Inspired)

```typescript
// Amina brand colors (crimson theme)
brand: {
  100: '#fce4e8',
  200: '#f5a3b0',
  300: '#e63946',  // rose-red
  400: '#dc143c',  // amina-crimson (dark mode)
  500: '#dc143c',  // amina-crimson (light mode)
  600: '#b01030',
  700: '#8b0000',  // blood-red
  800: '#6b0000',
  900: '#4a0000',
}

// Night Raid darkness (backgrounds)
night: {
  50: '#3d3d3d',   // slate-gray
  100: '#2d2d2d',  // steel-gray
  200: '#1a1a1a',  // shadow-gray
  300: '#0a0a0a',  // midnight-black
  800: '#1a1a1a',  // card bg dark (shadow-gray)
  900: '#0a0a0a',  // global bg dark (midnight-black)
}

// Additional Amina colors
imperial: {
  gold: '#ffd700',
  amber: '#ffa500',
  bronze: '#cd7f32',
}

cyber: {
  blue: '#1e90ff',   // electric-blue
  electric: '#00ced1', // cyber-blue
  ice: '#87ceeb',
}

discord: {
  blurple: '#5865f2',
  green: '#57f287',
  red: '#ed4245',
  gray: '#36393f',
}

// Semantic tokens
light: {
  globalBg: 'gray.100',
  brand: 'brand.500',
  textColorPrimary: 'gray.900',
  cardBg: 'white',
}

dark: {
  globalBg: 'night.900',    // midnight-black
  brand: 'brand.400',       // amina-crimson
  textColorPrimary: 'white',
  cardBg: 'night.800',      // shadow-gray
}
```

---

## 🏗️ Migration Phases

### Phase 6.1: Setup Chakra UI ⏳

- [ ] Install Chakra UI dependencies
- [ ] Create `/app/theme/` directory structure
- [ ] Port theme config from reference
- [ ] Create `ChakraProvider` wrapper for dashboard routes
- [ ] Update `_renderer.tsx` to include ChakraProvider
- [ ] Verify Vite/HonoX compatibility

### Phase 6.2: Core Layout Components ⏳

Port from `.reference/frontend/src/components/layout/`:

- [ ] `app.tsx` → `AppLayout.tsx` (main dashboard shell)
- [ ] `sidebar/index.tsx` → `Sidebar.tsx` (desktop + mobile drawer)
- [ ] `sidebar/SidebarContent.tsx` → sidebar content
- [ ] `sidebar/GuildItem.tsx` → guild list item
- [ ] `navbar/index.tsx` → `Navbar.tsx`
- [ ] `navbar/default.tsx` → default navbar content
- [ ] `guild/get-guild-layout.tsx` → `GuildLayout.tsx`
- [ ] `guild/guild-navbar.tsx` → guild navbar
- [ ] `guild/guild-sidebar.tsx` → guild sidebar
- [ ] `Separator.tsx` → section separator
- [ ] `GuildBanner.tsx` → guild banner

### Phase 6.3: Panel Components ⏳

Port from `.reference/frontend/src/components/panel/`:

- [ ] `LoadingPanel.tsx` → loading states
- [ ] `ErrorPanel.tsx` → error display with retry
- [ ] `QueryPanel.tsx` → React Query status wrapper

### Phase 6.4: Form Components ⏳

Port from `.reference/frontend/src/components/forms/`:

- [ ] `Form.tsx` → form wrapper with save indicator
- [ ] `InputForm.tsx` → text input field
- [ ] `TextAreaForm.tsx` → textarea field
- [ ] `SwitchField.tsx` → toggle switch
- [ ] `SelectField.tsx` → dropdown select
- [ ] `ChannelSelect.tsx` → Discord channel picker
- [ ] `RoleSelect.tsx` → Discord role picker
- [ ] `ColorPicker.tsx` → color picker
- [ ] `DatePicker.tsx` → date picker
- [ ] `FilePicker.tsx` → file upload
- [ ] `SearchBar.tsx` → search input

### Phase 6.5: Feature Components ⏳

Port from `.reference/frontend/src/components/feature/`:

- [ ] `FeatureItem.tsx` → feature card
- [ ] `UpdateFeaturePanel.tsx` → feature config wrapper

### Phase 6.6: Menu & Navigation ⏳

- [ ] `UserMenu.tsx` → user dropdown
- [ ] `SidebarTrigger.tsx` → mobile menu trigger
- [ ] `ThemeSwitch.tsx` → dark/light mode toggle
- [ ] Breadcrumb navigation

### Phase 6.7: Pages ⏳

Rewrite using new Chakra components:

- [ ] `/dash/index.tsx` → user home
- [ ] `/dash/user/[userId].tsx` → user profile
- [ ] `/dash/guild/[guildId].tsx` → guild overview
- [ ] `/dash/guild/[guildId]/settings.tsx` → guild settings
- [ ] `/dash/guild/[guildId]/features/[feature].tsx` → feature config

### Phase 6.8: Config & Cleanup ⏳

- [ ] Port `config/features.tsx`
- [ ] Port `config/sidebar-items.tsx`
- [ ] Remove old Tailwind dashboard components
- [ ] Update types as needed

---

## 📁 New Directory Structure

```
app/
├── theme/                    # NEW: Chakra UI theme
│   ├── config.tsx
│   ├── colors.ts
│   ├── breakpoints.ts
│   ├── components/
│   └── styles/
├── components/
│   └── dashboard/            # Chakra-based components
│       ├── layouts/
│       │   ├── AppLayout.tsx
│       │   ├── GuildLayout.tsx
│       │   ├── Sidebar.tsx
│       │   └── Navbar.tsx
│       ├── panels/
│       │   ├── LoadingPanel.tsx
│       │   ├── ErrorPanel.tsx
│       │   └── QueryPanel.tsx
│       ├── forms/
│       │   ├── Form.tsx
│       │   ├── InputForm.tsx
│       │   ├── ChannelSelect.tsx
│       │   ├── RoleSelect.tsx
│       │   └── ...
│       ├── features/
│       │   ├── FeatureItem.tsx
│       │   └── UpdateFeaturePanel.tsx
│       └── menu/
│           └── UserMenu.tsx
├── routes/dash/              # Dashboard routes
│   ├── _renderer.tsx         # ChakraProvider
│   ├── _middleware.ts
│   ├── index.tsx
│   ├── user/
│   └── guild/
└── config/
    ├── features.tsx
    └── sidebar-items.tsx
```

---

## 🔧 Implementation Notes

### ChakraProvider in HonoX

```tsx
// app/routes/dash/_renderer.tsx
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { theme } from '@/theme/config';

export default function DashboardRenderer({ children }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <QueryProvider>{children}</QueryProvider>
      </ChakraProvider>
    </>
  );
}
```

### Responsive Sidebar Pattern

```tsx
// From reference: components/layout/app.tsx
<Flex direction="row" h="full">
  <Sidebar sidebar={sidebar} />
  <Show below={sidebarBreakpoint}>
    <SidebarResponsive sidebar={sidebar} />
  </Show>
  <Flex direction="column" flex={1} overflow="auto">
    <Navbar>{navbar}</Navbar>
    <Box flex={1} px="30px" my="50px">
      {children}
    </Box>
  </Flex>
</Flex>
```

### Semantic Tokens Usage

```tsx
// Use semantic tokens for automatic dark/light mode
<Box bg="CardBackground" color="TextPrimary">
  <Text color="TextSecondary">Secondary text</Text>
  <Button bg="Brand">Brand button</Button>
</Box>
```

---

## ✅ Previous Phases (Archived)

<details>
<summary>Phases 1-5 (Tailwind) - SUPERSEDED</summary>

### Phase 1-5 Summary

- Completed basic dashboard with Tailwind CSS
- Implemented layouts, forms, features
- Added React Query integration
- UI doesn't match reference closely enough
- Decision: Migrate to Chakra UI

</details>

---

## � API Integration Approach

### Implement Now (Discord REST API)

- User info (`/api/@me`)
- User guilds (`/api/users/@me/guilds`)
- Guild info, roles, channels via Discord API
- OAuth flow (already exists)

### Mock for Now (Needs DB/Bot)

- Feature configurations (mock data)
- Guild settings storage
- Feature enable/disable state
- User preferences

### Ask First If Unsure

- Complex integrations
- Bot command interactions
- Real-time features

---

## 📋 Pre-Migration Checklist

- [x] Run `bun run check` - current state compiles
- [ ] Create backup branch: `git checkout -b dash-tailwind-backup`
- [ ] Install Chakra dependencies
- [ ] Test Chakra + HonoX + Vite compatibility
- [ ] Port theme config first (before components)

---

## 🎯 Success Criteria

1. **Visual Parity** - Identical to reference screenshots
2. **Responsive** - Mobile drawer, desktop fixed sidebar
3. **Dark Mode** - Proper theme switching
4. **Forms Work** - All inputs functional
5. **Type Safe** - No TypeScript errors
6. **Auth Flow** - Middleware protection intact
