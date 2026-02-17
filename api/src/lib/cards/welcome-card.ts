/**
 * Welcome Card Generator
 *
 * Generates SVG welcome/farewell cards with Amina's design system.
 */

import { WelcomeCardOptions } from '../../../types/cards';

/**
 * Generate a welcome/farewell card SVG
 */
export function generateWelcomeCard(options: WelcomeCardOptions): string {
  const type = options.type || 'welcome';
  const isWelcome = type === 'welcome';

  const accentColor =
    options.accentColor || (isWelcome ? '#57f287' : '#ed4245');
  const textColor = options.textColor || '#ffffff';

  const title = isWelcome ? 'WELCOME' : 'GOODBYE';
  const message =
    options.message ||
    (isWelcome
      ? `You are member #${options.memberCount.toLocaleString()}`
      : `We'll miss you!`);

  return `<svg width="1024" height="450" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="50%" style="stop-color:#1a1a1a"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </linearGradient>
    
    <!-- Accent glow -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Avatar clip -->
    <clipPath id="avatar-clip">
      <circle cx="512" cy="160" r="80"/>
    </clipPath>
    
    <!-- Pattern for decoration -->
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1" fill="${accentColor}" opacity="0.2"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="450" fill="url(#bg-gradient)"/>
  
  <!-- Decorative pattern -->
  <rect width="1024" height="450" fill="url(#dots)"/>
  
  <!-- Top accent bar -->
  <rect x="0" y="0" width="1024" height="4" fill="${accentColor}"/>
  
  <!-- Avatar container -->
  <g transform="translate(0, 0)">
    <!-- Outer glow ring -->
    <circle cx="512" cy="160" r="95" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.3" filter="url(#glow)"/>
    
    <!-- Avatar background -->
    <circle cx="512" cy="160" r="85" fill="#2d2d2d"/>
    <circle cx="512" cy="160" r="85" fill="none" stroke="${accentColor}" stroke-width="3"/>
    
    ${
      options.avatar
        ? `
    <!-- Avatar image -->
    <image xlink:href="${options.avatar}" x="432" y="80" width="160" height="160" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice"/>
    `
        : `
    <!-- Default avatar -->
    <circle cx="512" cy="160" r="80" fill="#3d3d3d"/>
    <text x="512" y="175" text-anchor="middle" fill="#888" font-size="48" font-family="Arial, sans-serif">?</text>
    `
    }
  </g>
  
  <!-- Title -->
  <text x="512" y="290" text-anchor="middle" fill="${accentColor}" font-size="28" font-weight="bold" font-family="Rajdhani, Arial, sans-serif" letter-spacing="0.2em" filter="url(#glow)">${title}</text>
  
  <!-- Username -->
  <text x="512" y="340" text-anchor="middle" fill="${textColor}" font-size="42" font-weight="bold" font-family="Rajdhani, Arial, sans-serif">${escapeXml(options.username)}</text>
  
  <!-- Message -->
  <text x="512" y="380" text-anchor="middle" fill="#888888" font-size="18" font-family="Inter, Arial, sans-serif">${escapeXml(message)}</text>
  
  <!-- Guild name -->
  <text x="512" y="420" text-anchor="middle" fill="#666666" font-size="14" font-family="Inter, Arial, sans-serif">${escapeXml(options.guildName)}</text>
  
  <!-- Bottom accent bar -->
  <rect x="0" y="446" width="1024" height="4" fill="${accentColor}"/>
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
