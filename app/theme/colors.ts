// Amina Dashboard - Color Palette (Akame ga Kill Inspired)
// Reference: docs/DESIGN.md

export const colors = {
  // Amina brand colors (crimson theme)
  brand: {
    100: '#fce4e8',
    200: '#f5a3b0',
    300: '#e63946', // rose-red
    400: '#dc143c', // amina-crimson (dark mode brand)
    500: '#dc143c', // amina-crimson (light mode brand)
    600: '#b01030',
    700: '#8b0000', // blood-red
    800: '#6b0000',
    900: '#4a0000',
  },
  brandAlpha: {
    500: '#dc143c9c',
    100: '#dc143c2d',
  },

  // Night Raid's darkness (backgrounds)
  night: {
    50: '#4d4d4d',
    100: '#3d3d3d', // slate-gray
    200: '#2d2d2d', // steel-gray
    300: '#1a1a1a', // shadow-gray
    400: '#151515',
    500: '#121212',
    600: '#0f0f0f',
    700: '#0c0c0c',
    800: '#1a1a1a', // card bg dark (shadow-gray)
    900: '#0a0a0a', // global bg dark (midnight-black)
  },

  // Imperial gold (achievements, success)
  imperial: {
    100: '#fff9e6',
    200: '#fff3cc',
    300: '#ffe699',
    400: '#ffd700', // imperial-gold
    500: '#ffa500', // amber-gold
    600: '#cc8400',
    700: '#996300',
    800: '#cd7f32', // bronze
    900: '#4d3200',
  },

  // Cyber blue (AI, info)
  cyber: {
    100: '#e6f4ff',
    200: '#b3dfff',
    300: '#87ceeb', // ice-blue
    400: '#00ced1', // cyber-blue
    500: '#1e90ff', // electric-blue
    600: '#1873cc',
    700: '#125699',
    800: '#0c3a66',
    900: '#061d33',
  },

  // Discord integration
  discord: {
    blurple: '#5865f2',
    green: '#57f287',
    yellow: '#fee75c',
    fuchsia: '#eb459e',
    red: '#ed4245',
    gray: '#36393f',
    darkGray: '#2f3136',
    black: '#23272a',
  },

  // Grays (for light mode compatibility)
  secondaryGray: {
    100: '#E0E5F2',
    200: '#E1E9F8',
    300: '#F4F7FE',
    400: '#E9EDF7',
    500: '#8F9BBA',
    600: '#A3AED0',
    700: '#707EAE',
    800: '#4a5568',
    900: '#1a202c',
  },

  // Status colors
  red: {
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ed4245', // discord-red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  green: {
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#57f287', // discord-green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  orange: {
    100: '#FFF6DA',
    200: '#ffeeba',
    300: '#ffd699',
    400: '#ffbf66',
    500: '#ffa500', // amber
    600: '#cc8400',
    700: '#996300',
    800: '#664200',
    900: '#332100',
  },
  blue: {
    50: '#EFF4FB',
    100: '#e6f4ff',
    200: '#b3dfff',
    300: '#80c9ff',
    400: '#4db3ff',
    500: '#1e90ff', // electric-blue
    600: '#1873cc',
    700: '#125699',
    800: '#0c3a66',
    900: '#061d33',
  },

  // Guardian rank colors
  rank: {
    recruit: '#808080',
    scout: '#00ced1',
    guard: '#4169e1',
    elite: '#9370db',
    commander: '#ffd700',
    legend: '#dc143c',
  },

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Light mode semantic colors
export const light = {
  globalBg: 'gray.100',
  brand: 'brand.500',
  textColorPrimary: 'gray.900',
  textColorSecondary: 'gray.600',
  cardBg: 'white',
  shadow: '14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
};

// Dark mode semantic colors
export const dark = {
  globalBg: 'night.900',
  brand: 'brand.400',
  textColorPrimary: 'white',
  textColorSecondary: 'gray.400',
  cardBg: 'night.800',
  shadow: '14px 17px 40px 4px rgba(2, 4, 6, 0.06)',
};
