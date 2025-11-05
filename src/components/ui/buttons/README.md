# Amina Button Components

Reusable button components following Amina's design system with Akame ga Kill color palette.

---

## 🎨 Button Hierarchy

### 1. **PrimaryBtn** - Amina Crimson (Main Actions)

Bold gradient crimson button for primary CTAs and important actions.

**Props:**

- `url?: string` - Link destination (default: `#`)
- `text?: string` - Button text (default: `'Get Started'`)
- `icon?: string` - Icon: `'discord'`, `'arrow'`, `'shield'`, `'star'` (default: `'arrow'`)
- `class?: string` - Additional CSS classes

**Example:**

```astro
<PrimaryBtn
  url="https://discord.com/oauth2/authorize?client_id=YOUR_ID"
  text="Add to Discord"
  icon="discord"
/>

<PrimaryBtn url="/signup" text="Get Started" icon="shield" />
```

---

### 2. **SecondaryBtn** - Cyber Blue (Support Actions)

Electric blue outlined button for secondary CTAs and informational links.

**Props:**

- `url?: string` - Link destination (default: `#`)
- `text?: string` - Button text (default: `'Learn More'`)
- `icon?: string` - Icon: `'document'`, `'dashboard'`, `'book'`, `'guide'`, `'chart'`, `'settings'` (default: `'document'`)
- `class?: string` - Additional CSS classes

**Example:**

```astro
<SecondaryBtn url="/docs" text="Documentation" icon="book" />

<SecondaryBtn url="/dashboard" text="View Dashboard" icon="dashboard" />
```

---

### 3. **TertiaryBtn** - Imperial Gold (Special Actions)

Imperial gold outlined button for premium/achievement-focused actions.

**Props:**

- `url?: string` - Link destination (default: `#`)
- `text?: string` - Button text (default: `'Click Me'`)
- `icon?: string` - Icon: `'star'`, `'trophy'`, `'badge'`, `'crown'`, `'fire'`, `'lightning'` (default: `'star'`)
- `class?: string` - Additional CSS classes

**Example:**

```astro
<TertiaryBtn url="/achievements" text="View Achievements" icon="trophy" />

<TertiaryBtn url="/premium" text="Upgrade" icon="crown" />
```

> **Note:** This button is ready for your custom use case! Update the description in `TertiaryBtn.astro` to match your needs.

---

## 🎨 Design System Colors

| Button           | Color                   | Usage                                           |
| ---------------- | ----------------------- | ----------------------------------------------- |
| **PrimaryBtn**   | Crimson Red (#DC143C)   | Main CTAs, Discord invites, critical actions    |
| **SecondaryBtn** | Cyber Blue (#00CED1)    | Documentation, info links, secondary actions    |
| **TertiaryBtn**  | Imperial Gold (#FFD700) | Achievements, premium features, special actions |

---

## 📦 Usage in Components

```astro
---
import PrimaryBtn from '@components/ui/buttons/PrimaryBtn.astro';
import SecondaryBtn from '@components/ui/buttons/SecondaryBtn.astro';
import TertiaryBtn from '@components/ui/buttons/TertiaryBtn.astro';
---

<!-- Full button row example -->
<div class="flex flex-col sm:flex-row gap-4">
  <PrimaryBtn url="/invite" text="Add to Discord" icon="discord" />
  <SecondaryBtn url="/docs" text="Documentation" icon="book" />
  <TertiaryBtn url="/premium" text="Go Premium" icon="crown" />
</div>
```

---

## 🎯 When to Use Each Button

- **PrimaryBtn**: Your main call-to-action. Use sparingly (1-2 per page).
- **SecondaryBtn**: Supporting actions that complement the primary CTA.
- **TertiaryBtn**: Special features, achievements, or tertiary actions.

**Visual Hierarchy**: Primary > Secondary > Tertiary

---

## 🎭 Amina's Character Integration

These buttons follow Amina's guardian aesthetic from Akame ga Kill:

- **Crimson Red** - Her passion and protective nature
- **Cyber Blue** - Her AI/digital nature and tactical side
- **Imperial Gold** - Achievements and guardian ranks

All buttons include:

- ✅ Smooth hover animations
- ✅ Glow effects matching their color
- ✅ Scale transforms on interaction
- ✅ Focus rings for accessibility
- ✅ Flexible icon system
