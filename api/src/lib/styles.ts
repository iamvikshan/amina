/**
 * Amina Design System - Shared Styles
 *
 * Central CSS variables and base styles used across all HTML templates.
 * This remains fully static - no SSR overhead.
 */

export const aminaDesignSystem = `
:root {
  /* === AKAME'S CRIMSON === */
  --amina-crimson: #dc143c;
  --blood-red: #8b0000;
  --rose-red: #e63946;

  /* === NIGHT RAID'S DARKNESS === */
  --midnight-black: #0a0a0a;
  --shadow-gray: #1a1a1a;
  --steel-gray: #2d2d2d;
  --slate-gray: #3d3d3d;

  /* === IMPERIAL GOLD === */
  --imperial-gold: #ffd700;
  --amber-gold: #ffa500;

  /* === DIGITAL BLUE === */
  --electric-blue: #1e90ff;
  --cyber-blue: #00ced1;

  /* === DISCORD === */
  --discord-blurple: #5865f2;
  --discord-green: #57f287;
  --discord-red: #ed4245;

  /* === NEUTRAL === */
  --pure-white: #ffffff;
  --off-white: #f5f5f5;

  /* Typography */
  --font-heading: 'Rajdhani', 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', 'JetBrains Mono', monospace;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Border Radius */
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows & Glows */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --glow-crimson: 0 0 20px rgba(220, 20, 60, 0.6);
  --glow-blue: 0 0 20px rgba(30, 144, 255, 0.6);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  background: var(--midnight-black);
  color: var(--pure-white);
  min-height: 100vh;
  line-height: 1.6;
}
`;
