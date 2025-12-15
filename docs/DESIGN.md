# Amina Dashboard - Design System

## Hybrid Approach with Akame ga Kill Color Palette

_Based on Amina's character story and inspired by Akame ga Kill's dramatic aesthetic_

---

## 🎨 Color Palette - Akame ga Kill Inspired

### Primary Colors (From Akame ga Kill)

```css
:root {
  /* === AKAME'S CRIMSON === */
  /* The signature red - represents Amina's passion and protective nature */
  --amina-crimson: #dc143c; /* Primary action color */
  --blood-red: #8b0000; /* Danger, warnings, critical actions */
  --rose-red: #e63946; /* Hover states, active elements */

  /* === NIGHT RAID'S DARKNESS === */
  /* Deep blacks and grays - the tactical, protective side */
  --midnight-black: #0a0a0a; /* Deepest backgrounds */
  --shadow-gray: #1a1a1a; /* Card backgrounds */
  --steel-gray: #2d2d2d; /* Borders, dividers */
  --slate-gray: #3d3d3d; /* Inactive elements */

  /* === IMPERIAL GOLD === */
  /* Represents achievements, success, and rank */
  --imperial-gold: #ffd700; /* Achievements, badges */
  --amber-gold: #ffa500; /* Warning states, attention */
  --bronze: #cd7f32; /* Secondary badges */

  /* === DIGITAL BLUE === */
  /* Amina's AI nature, electric energy */
  --electric-blue: #1e90ff; /* Info, links, AI elements */
  --cyber-blue: #00ced1; /* Active states, glow effects */
  --ice-blue: #87ceeb; /* Subtle accents */

  /* === DISCORD INTEGRATION === */
  --discord-blurple: #5865f2; /* Discord-specific actions */
  --discord-green: #57f287; /* Online, success states */
  --discord-red: #ed4245; /* Discord errors */
  --discord-gray: #36393f; /* Discord dark theme match */

  /* === NEUTRAL/UTILITY === */
  --pure-white: #ffffff; /* Text on dark backgrounds */
  --off-white: #f5f5f5; /* Light text, disabled states */
  --transparent-white: rgba(255, 255, 255, 0.1); /* Subtle overlays */
  --transparent-black: rgba(0, 0, 0, 0.5); /* Overlays, modals */
}
```

### Color Usage Guidelines

| Element               | Color               | Usage                                |
| --------------------- | ------------------- | ------------------------------------ |
| **Primary CTA**       | `--amina-crimson`   | Main action buttons, important links |
| **Secondary CTA**     | `--electric-blue`   | Secondary actions, info buttons      |
| **Danger/Delete**     | `--blood-red`       | Destructive actions, errors          |
| **Success**           | `--discord-green`   | Confirmations, success messages      |
| **Warning**           | `--amber-gold`      | Warnings, requires attention         |
| **Info**              | `--cyber-blue`      | Tips, information, help text         |
| **Background (Dark)** | `--midnight-black`  | Page background                      |
| **Cards**             | `--shadow-gray`     | Card/panel backgrounds               |
| **Borders**           | `--steel-gray`      | Default borders                      |
| **Text Primary**      | `--pure-white`      | Main text content                    |
| **Text Secondary**    | `--off-white`       | Less important text                  |
| **Achievements**      | `--imperial-gold`   | Badges, ranks, rewards               |
| **Discord Brand**     | `--discord-blurple` | Login, Discord integrations          |

---

## 🖋️ Typography

### Font Families

```css
:root {
  /* Headings - Bold, Energetic, Tactical */
  --font-heading: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  /* Futuristic, dynamic, sharp angles with energy - matches Amina's confident warrior personality */
  /* Weights: 600-900 for varying emphasis levels */

  /* Body - Warm, Readable, Professional */
  --font-body: 'Nunito Sans', ui-sans-serif, system-ui, sans-serif;
  /* Rounded terminals add warmth while maintaining professionalism - protective guardian who cares */
  /* Weights: 400-700 for hierarchy */

  /* Character Dialogue - Friendly, Confident */
  --font-dialogue: Comfortaa, ui-sans-serif, system-ui, sans-serif;
  /* Rounded but structured - balance of warmth and strength, mature confidence */
  /* Weights: 400-700 for expressiveness */

  /* Code/Monospace - Technical */
  --font-mono: 'Fira Code', ui-monospace, monospace;
  /* For command displays, IDs, technical info - unchanged, perfect for utility */
}
```

**Font Selection Rationale:**

These fonts were chosen to match Amina's character: a passionate, energetic 18-20 year old warrior who's both protective and approachable. The previous fonts (Rajdhani, Inter, Quicksand) felt too corporate/sterile or childish.

- **Exo 2**: Replaces Rajdhani - angular geometry creates action/movement, matches gaming UI aesthetic and digital guardian theme
- **Nunito Sans**: Replaces Inter - adds warmth through rounded terminals while staying professional, reflects caring protector personality
- **Comfortaa**: Replaces Quicksand - maintains friendliness but with more confidence and maturity, distinguishes character voice without being childish

### Typography Scale

```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem; /* 12px - tiny labels */
  --text-sm: 0.875rem; /* 14px - secondary text */
  --text-base: 1rem; /* 16px - body text */
  --text-lg: 1.125rem; /* 18px - emphasized text */
  --text-xl: 1.25rem; /* 20px - card titles */
  --text-2xl: 1.5rem; /* 24px - section headers */
  --text-3xl: 1.875rem; /* 30px - page titles */
  --text-4xl: 2.25rem; /* 36px - hero text */

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-black: 900; /* For dramatic headings */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Typography Examples

```css
/* Page Title */
.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-black);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--amina-crimson);
}

/* Card Title */
.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--pure-white);
}

/* Body Text */
.body-text {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--off-white);
}

/* Character Dialogue */
.amina-dialogue {
  font-family: var(--font-dialogue);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--cyber-blue);
}
```

---

## 🎯 Spacing System

```css
:root {
  /* Base spacing unit: 4px */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
}
```

---

## 🔲 Border Radius

```css
:root {
  --radius-sm: 0.375rem; /* 6px - subtle rounding */
  --radius-md: 0.5rem; /* 8px - default */
  --radius-lg: 0.75rem; /* 12px - cards */
  --radius-xl: 1rem; /* 16px - large cards */
  --radius-2xl: 1.5rem; /* 24px - hero elements */
  --radius-full: 9999px; /* Pills, circular elements */
}
```

---

## ✨ Shadows & Glows

### Shadows

```css
:root {
  /* Standard Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6);

  /* Glow Effects (Key to Akame ga Kill aesthetic) */
  --glow-crimson: 0 0 20px rgba(220, 20, 60, 0.6);
  --glow-blue: 0 0 20px rgba(30, 144, 255, 0.6);
  --glow-gold: 0 0 20px rgba(255, 215, 0, 0.6);
  --glow-green: 0 0 20px rgba(87, 242, 135, 0.6);

  /* Inner Shadows */
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3);
}
```

### Glow Usage

```css
/* Primary Button Glow */
.btn-primary {
  box-shadow: var(--shadow-md), var(--glow-crimson);
}

/* Active Card Glow */
.card-active {
  border: 1px solid var(--amina-crimson);
  box-shadow: var(--shadow-lg), var(--glow-crimson);
}

/* Success Glow */
.success-state {
  box-shadow: var(--glow-green);
}
```

---

## 🎨 Component Styles

### Buttons

```css
/* Primary Button (Amina's Crimson) */
.btn-primary {
  background: linear-gradient(
    135deg,
    var(--amina-crimson) 0%,
    var(--blood-red) 100%
  );
  color: var(--pure-white);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  font-size: var(--text-base);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: var(--shadow-md), var(--glow-crimson);
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--glow-crimson);
  background: linear-gradient(
    135deg,
    var(--rose-red) 0%,
    var(--amina-crimson) 100%
  );
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* Secondary Button (Electric Blue) */
.btn-secondary {
  background: transparent;
  color: var(--electric-blue);
  border: 2px solid var(--electric-blue);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  font-size: var(--text-base);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--electric-blue);
  color: var(--midnight-black);
  box-shadow: var(--glow-blue);
}

/* Danger Button */
.btn-danger {
  background: var(--blood-red);
  color: var(--pure-white);
  border: 2px solid var(--blood-red);
  /* ...rest similar to primary */
}

/* Discord Button */
.btn-discord {
  background: var(--discord-blurple);
  color: var(--pure-white);
  border: 2px solid var(--discord-blurple);
  /* ...rest similar to primary */
}
```

### Cards

```css
/* Base Card */
.card {
  background: var(--shadow-gray);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  border-color: var(--electric-blue);
  box-shadow:
    var(--shadow-lg),
    0 0 15px rgba(30, 144, 255, 0.3);
}

/* Active/Selected Card */
.card-active {
  border: 2px solid var(--amina-crimson);
  box-shadow: var(--shadow-lg), var(--glow-crimson);
}

/* Server Card (Specific) */
.server-card {
  background: var(--shadow-gray);
  border: 2px solid var(--steel-gray);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all 0.3s ease;
}

.server-card:hover {
  border-color: var(--amina-crimson);
  transform: scale(1.02);
  box-shadow: var(--shadow-xl), var(--glow-crimson);
}
```

### Inputs & Forms

```css
/* Text Input */
.input {
  background: var(--midnight-black);
  border: 2px solid var(--steel-gray);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--pure-white);
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--electric-blue);
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

/* Toggle Switch (Akame ga Kill Style) */
.toggle {
  width: 60px;
  height: 30px;
  background: var(--steel-gray);
  border: 2px solid var(--slate-gray);
  border-radius: var(--radius-full);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-active {
  background: var(--amina-crimson);
  border-color: var(--blood-red);
  box-shadow: var(--glow-crimson);
}

.toggle-handle {
  width: 22px;
  height: 22px;
  background: var(--pure-white);
  border-radius: var(--radius-full);
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
}

.toggle-active .toggle-handle {
  transform: translateX(30px);
}
```

### Progress Bars

```css
/* Guardian Rank Progress Bar */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--steel-gray);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--amina-crimson) 0%,
    var(--rose-red) 100%
  );
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
  box-shadow: var(--glow-crimson);
}

/* Animated Stripe Effect */
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(255, 255, 255, 0.1) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 50%,
    transparent 75%,
    rgba(255, 255, 255, 0.1) 75%
  );
  background-size: 30px 30px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 30px 30px;
  }
}
```

### Badges & Tags

```css
/* Achievement Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--shadow-gray);
  border: 2px solid var(--imperial-gold);
  border-radius: var(--radius-lg);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--imperial-gold);
  text-transform: uppercase;
  box-shadow: var(--glow-gold);
}

/* Rank Badge */
.rank-badge {
  background: linear-gradient(
    135deg,
    var(--imperial-gold) 0%,
    var(--amber-gold) 100%
  );
  color: var(--midnight-black);
  border: none;
  box-shadow: var(--shadow-md), var(--glow-gold);
}

/* Status Tag */
.tag-online {
  background: var(--discord-green);
  color: var(--midnight-black);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}
```

---

## 🎭 Character Integration

### Amina Portrait Container

```css
.amina-portrait {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  border: 3px solid var(--amina-crimson);
  box-shadow: var(--shadow-lg), var(--glow-crimson);
  overflow: hidden;
  position: relative;
}

/* Idle Animation */
.amina-portrait-idle {
  animation: portrait-breathe 4s ease-in-out infinite;
}

@keyframes portrait-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Active State */
.amina-portrait-active {
  animation: portrait-pulse 1.5s ease-in-out infinite;
}

@keyframes portrait-pulse {
  0%,
  100% {
    box-shadow: var(--shadow-lg), var(--glow-crimson);
  }
  50% {
    box-shadow:
      var(--shadow-xl),
      0 0 30px rgba(220, 20, 60, 0.8);
  }
}
```

### Speech Bubble

```css
.speech-bubble {
  background: var(--shadow-gray);
  border: 2px solid var(--cyber-blue);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  font-family: var(--font-dialogue);
  font-size: var(--text-base);
  color: var(--cyber-blue);
  position: relative;
  box-shadow: var(--shadow-md), var(--glow-blue);
  max-width: 300px;
}

/* Speech Bubble Tail */
.speech-bubble::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid var(--cyber-blue);
}
```

---

## 🎬 Animations

### Loading States

```css
/* Amina Loading Animation */
@keyframes amina-loading {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

.loading-amina {
  animation: amina-loading 1s ease-in-out infinite;
}

/* Pulse Effect */
@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Transitions

```css
:root {
  --transition-fast: 0.15s ease;
  --transition-base: 0.3s ease;
  --transition-slow: 0.5s ease;
}

/* Smooth all interactions */
* {
  transition:
    color var(--transition-fast),
    background-color var(--transition-base),
    border-color var(--transition-base),
    transform var(--transition-base),
    box-shadow var(--transition-base);
}
```

---

## 📐 Layout System

### Container Widths

```css
:root {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}

.container {
  max-width: var(--container-xl);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
```

### Grid System

```css
/* Server Grid */
.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-8);
  padding: var(--space-8);
}

@media (max-width: 768px) {
  .server-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
}
```

---

## 🌙 Dark Mode (Default)

The entire system is built dark-first, matching Akame ga Kill's night aesthetic.

**Light Mode** (optional, for those who prefer):

```css
[data-theme='light'] {
  --midnight-black: #ffffff;
  --shadow-gray: #f5f5f5;
  --steel-gray: #e0e0e0;
  --pure-white: #1a1a1a;
  --off-white: #3d3d3d;
  /* Keep accent colors vibrant */
}
```

---

## 🎯 Header Component Implementation

The header follows the reference design with Amina's personality:

### Desktop Header Features:

- **Sticky top positioning** with dark glassmorphism backdrop
- **Brand logo** with crimson glow on hover
- **Center navigation** with crimson accent on hover/active states
- **Right-aligned controls**: Theme toggle + User avatar/Login
- **Guardian rank badge** displayed on avatar dropdown
- **Electric blue** info accents with **crimson red** primary actions

### Mobile Header Features:

- **Hamburger menu** with crimson focus ring
- **Collapsible navigation** with slide-down animation
- **Right controls**: Theme toggle + User avatar (compact)
- **Mobile-optimized spacing** and touch targets

### Color Usage:

- Background: `night-black/40` with backdrop blur
- Border: `night-steel/80`
- Text: `neutral-400` default, `amina-crimson` on hover
- Glow effects: `rgba(220, 20, 60, 0.4)` on interactive elements
- Theme icons: `cyber-blue` (dark mode), `imperial-gold` (light mode)
