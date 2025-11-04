/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    './node_modules/preline/preline.js',
  ],
  darkMode: 'class',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#ffffff',

      // Akame ga Kill Inspired - Amina's Color Palette
      amina: {
        crimson: '#DC143C', // Primary action color
        'blood-red': '#8B0000', // Danger, warnings
        'rose-red': '#E63946', // Hover states
      },

      night: {
        black: '#0A0A0A', // Deepest backgrounds
        shadow: '#1A1A1A', // Card backgrounds
        steel: '#2D2D2D', // Borders, dividers
        slate: '#3D3D3D', // Inactive elements
      },

      imperial: {
        gold: '#FFD700', // Achievements, badges
        amber: '#FFA500', // Warning states
        bronze: '#CD7F32', // Secondary badges
      },

      cyber: {
        blue: '#1E90FF', // Info, links, AI elements
        electric: '#00CED1', // Active states, glow
        ice: '#87CEEB', // Subtle accents
      },

      discord: {
        blurple: '#5865F2', // Discord-specific actions
        green: '#57F287', // Online, success
        red: '#ED4245', // Discord errors
        gray: '#36393F', // Discord dark theme match
      },

      // Legacy colors for compatibility (will phase out)
      gray: colors.gray,
      pink: colors.pink,
      sky: colors.sky,
      blue: colors.blue,
      indigo: colors.indigo,
      neutral: colors.neutral,
      slate: colors.slate,
      cyan: colors.cyan,
      fuchsia: colors.fuchsia,
      zinc: colors.zinc,
    },
    extend: {
      fontFamily: {
        heading: ['Rajdhani', 'Orbitron', 'Space Grotesk', 'sans-serif'],
        body: ['Inter', 'Poppins', 'sans-serif'],
        dialogue: ['Quicksand', 'Comfortaa', 'cursive'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-crimson': '0 0 20px rgba(220, 20, 60, 0.6)',
        'glow-blue': '0 0 20px rgba(30, 144, 255, 0.6)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.6)',
        'glow-green': '0 0 20px rgba(87, 242, 135, 0.6)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'portrait-breathe': 'portrait-breathe 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'portrait-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss/nesting'),
    require('preline/plugin'),
    require('@tailwindcss/forms'),
  ],
};
