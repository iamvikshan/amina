/**
 * Rank Card Generator
 *
 * Generates SVG rank cards with Amina's design system.
 * Can be converted to PNG via downstream processing or browser.
 */

import { RankCardOptions } from '../../../types/cards';

// Amina theme colors
const themes = {
  dark: {
    background: ['#1a1a2e', '#16213e'],
    card: '#0a0a0a',
    progress: ['#DC143C', '#ff6b6b'],
    text: '#ffffff',
    textSecondary: '#888888',
    accent: '#DC143C',
  },
  light: {
    background: ['#f5f5f5', '#e0e0e0'],
    card: '#ffffff',
    progress: ['#DC143C', '#e63946'],
    text: '#1a1a1a',
    textSecondary: '#666666',
    accent: '#DC143C',
  },
  amina: {
    background: ['#0a0a0a', '#1a1a1a'],
    card: '#1a1a1a',
    progress: ['#DC143C', '#e63946'],
    text: '#ffffff',
    textSecondary: '#888888',
    accent: '#DC143C',
  },
};

/**
 * Generate a rank card SVG
 */
export function generateRankCard(options: RankCardOptions): string {
  const theme = themes[options.theme || 'amina'];
  const progress = Math.min(100, (options.xp / options.requiredXp) * 100);
  const progressWidth = Math.floor(progress * 6); // 600px max width

  const progressColor = options.progressColor || theme.progress[0];
  const textColor = options.textColor || theme.text;

  // Format numbers with commas
  const formatNumber = (n: number) => n.toLocaleString('en-US');

  // Calculate level badge position
  const levelText = `LVL ${options.level}`;

  // Status indicator color
  const statusColors: Record<string, string> = {
    online: '#57f287',
    idle: '#faa61a',
    dnd: '#ed4245',
    offline: '#747f8d',
  };
  const statusColor = statusColors[options.status || 'offline'];

  return `<svg width="934" height="282" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.background[0]}"/>
      <stop offset="100%" style="stop-color:${theme.background[1]}"/>
    </linearGradient>
    
    <!-- Progress bar gradient -->
    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${progressColor}"/>
      <stop offset="100%" style="stop-color:${theme.progress[1]}"/>
    </linearGradient>
    
    <!-- Card shadow -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    
    <!-- Avatar clip -->
    <clipPath id="avatar-clip">
      <circle cx="141" cy="141" r="70"/>
    </clipPath>
    
    <!-- Progress glow -->
    <filter id="progress-glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Main card background -->
  <rect width="934" height="282" rx="20" fill="url(#bg-gradient)" filter="url(#shadow)"/>
  
  <!-- Inner border accent -->
  <rect x="2" y="2" width="930" height="278" rx="18" fill="none" stroke="${theme.accent}" stroke-opacity="0.3" stroke-width="1"/>
  
  <!-- Avatar container -->
  <g>
    <!-- Avatar background circle -->
    <circle cx="141" cy="141" r="80" fill="${theme.card}"/>
    <circle cx="141" cy="141" r="80" fill="none" stroke="${theme.accent}" stroke-width="3"/>
    
    ${
      options.avatar
        ? `
    <!-- Avatar image -->
    <image xlink:href="${options.avatar}" x="71" y="71" width="140" height="140" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice"/>
    `
        : `
    <!-- Default avatar placeholder -->
    <circle cx="141" cy="141" r="70" fill="${theme.card}"/>
    <text x="141" y="155" text-anchor="middle" fill="${theme.textSecondary}" font-size="48" font-family="Arial, sans-serif">?</text>
    `
    }
    
    <!-- Status indicator -->
    <circle cx="191" cy="191" r="16" fill="${theme.card}"/>
    <circle cx="191" cy="191" r="12" fill="${statusColor}"/>
  </g>
  
  <!-- Username -->
  <text x="260" y="75" fill="${textColor}" font-size="32" font-weight="bold" font-family="Rajdhani, Arial, sans-serif">${escapeXml(options.username)}</text>
  
  <!-- Discriminator (legacy) -->
  ${
    options.discriminator && options.discriminator !== '0'
      ? `
  <text x="260" y="100" fill="${theme.textSecondary}" font-size="18" font-family="Inter, Arial, sans-serif">#${options.discriminator}</text>
  `
      : ''
  }
  
  <!-- Rank badge -->
  <g transform="translate(260, 110)">
    <rect x="0" y="0" width="100" height="32" rx="16" fill="${theme.card}" stroke="${theme.accent}" stroke-width="1"/>
    <text x="50" y="22" text-anchor="middle" fill="${theme.accent}" font-size="14" font-weight="bold" font-family="Rajdhani, Arial, sans-serif">RANK #${formatNumber(options.rank)}</text>
  </g>
  
  <!-- Level badge (right side) -->
  <g transform="translate(790, 50)">
    <rect x="0" y="0" width="120" height="48" rx="10" fill="${theme.accent}"/>
    <text x="60" y="34" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="bold" font-family="Rajdhani, Arial, sans-serif">${levelText}</text>
  </g>
  
  <!-- XP Progress section -->
  <g transform="translate(260, 165)">
    <!-- Progress label -->
    <text x="0" y="0" fill="${theme.textSecondary}" font-size="14" font-family="Inter, Arial, sans-serif">EXPERIENCE</text>
    
    <!-- Progress bar background -->
    <rect x="0" y="15" width="600" height="24" rx="12" fill="${theme.card}"/>
    
    <!-- Progress bar fill -->
    <rect x="0" y="15" width="${progressWidth}" height="24" rx="12" fill="url(#progress-gradient)" filter="url(#progress-glow)"/>
    
    <!-- Progress percentage -->
    <text x="600" y="0" text-anchor="end" fill="${theme.textSecondary}" font-size="14" font-family="Inter, Arial, sans-serif">${progress.toFixed(1)}%</text>
    
    <!-- XP text -->
    <text x="300" y="60" text-anchor="middle" fill="${theme.textSecondary}" font-size="16" font-family="Inter, Arial, sans-serif">
      <tspan fill="${textColor}" font-weight="bold">${formatNumber(options.xp)}</tspan> / ${formatNumber(options.requiredXp)} XP
    </text>
  </g>
</svg>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
