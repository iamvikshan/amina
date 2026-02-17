/**
 * Spotify Card Generator
 *
 * Generates a Spotify "Now Playing" style card.
 */

import { SpotifyCardOptions } from '../../../types/cards';

/**
 * Generate a Spotify card SVG
 */
export function generateSpotifyCard(options: SpotifyCardOptions): string {
  // Normalize and clamp progress to [0, 100]
  let progress = 50; // default
  if (options.progress !== undefined && Number.isFinite(options.progress)) {
    progress = Math.max(0, Math.min(100, Number(options.progress)));
  }
  const progressWidth = Math.floor(progress * 4.5); // 450px max

  return `<svg width="600" height="200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#191414"/>
      <stop offset="100%" style="stop-color:#121212"/>
    </linearGradient>
    
    <!-- Progress gradient (Spotify green) -->
    <linearGradient id="progress" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1DB954"/>
      <stop offset="100%" style="stop-color:#1ed760"/>
    </linearGradient>
    
    <!-- Album art clip -->
    <clipPath id="art-clip">
      <rect x="20" y="20" width="160" height="160" rx="8"/>
    </clipPath>
  </defs>
  
  <!-- Background -->
  <rect width="600" height="200" rx="12" fill="url(#bg)"/>
  
  <!-- Border -->
  <rect x="1" y="1" width="598" height="198" rx="11" fill="none" stroke="#282828" stroke-width="1"/>
  
  <!-- Album art container -->
  <g>
    <rect x="20" y="20" width="160" height="160" rx="8" fill="#282828"/>
    ${
      options.albumArt
        ? `
    <image xlink:href="${options.albumArt}" x="20" y="20" width="160" height="160" clip-path="url(#art-clip)" preserveAspectRatio="xMidYMid slice"/>
    `
        : `
    <!-- Music note placeholder -->
    <text x="100" y="110" text-anchor="middle" fill="#535353" font-size="48">♪</text>
    `
    }
  </g>
  
  <!-- Spotify logo (small) -->
  <g transform="translate(200, 20)">
    <circle cx="12" cy="12" r="12" fill="#1DB954"/>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5c-.2 0-.4-.1-.5-.2-1.4-.9-3.2-1.4-5-1.4-1.4 0-2.8.2-4.1.7-.1 0-.3.1-.4.1-.4 0-.7-.3-.7-.7 0-.3.2-.6.5-.7 1.5-.5 3.1-.8 4.7-.8 2.1 0 4.1.5 5.8 1.6.3.2.4.4.4.7 0 .4-.3.7-.7.7zm1.2-2.8c-.2 0-.4-.1-.6-.2-1.7-1-3.8-1.6-6.1-1.6-1.6 0-3.1.3-4.3.7-.1 0-.2.1-.4.1-.4 0-.8-.4-.8-.8 0-.4.2-.7.6-.8 1.4-.5 3-.8 4.9-.8 2.6 0 5 .6 7 1.8.3.2.5.5.5.9 0 .4-.4.7-.8.7zm1.4-3.3c-.2 0-.3 0-.5-.1-2-1.2-4.5-1.8-7.1-1.8-1.7 0-3.5.2-5.1.7-.1 0-.2.1-.4.1-.5 0-.9-.4-.9-.9 0-.5.3-.8.7-.9 1.8-.6 3.8-.9 5.7-.9 2.9 0 5.7.7 8 2.1.4.2.6.5.6 1 0 .4-.4.7-1 .7z" fill="white" transform="scale(0.8) translate(3, 3)"/>
  </g>
  
  <!-- Track info -->
  <text x="200" y="65" fill="#ffffff" font-size="20" font-weight="bold" font-family="Inter, Arial, sans-serif">${escapeXml(truncate(options.title, 28))}</text>
  <text x="200" y="90" fill="#b3b3b3" font-size="14" font-family="Inter, Arial, sans-serif">${escapeXml(truncate(options.artist, 35))}</text>
  ${
    options.album
      ? `
  <text x="200" y="110" fill="#727272" font-size="12" font-family="Inter, Arial, sans-serif">${escapeXml(truncate(options.album, 40))}</text>
  `
      : ''
  }
  
  <!-- Progress bar -->
  <g transform="translate(200, 140)">
    <!-- Background -->
    <rect x="0" y="0" width="370" height="4" rx="2" fill="#404040"/>
    
    <!-- Progress -->
    <rect x="0" y="0" width="${progressWidth}" height="4" rx="2" fill="url(#progress)"/>
    
    <!-- Time labels -->
    <text x="0" y="20" fill="#b3b3b3" font-size="11" font-family="Inter, Arial, sans-serif">${options.currentTime || '0:00'}</text>
    <text x="370" y="20" text-anchor="end" fill="#b3b3b3" font-size="11" font-family="Inter, Arial, sans-serif">${options.duration || '0:00'}</text>
  </g>
  
  <!-- Play/Pause indicator -->
  <g transform="translate(550, 85)">
    ${
      options.isPlaying
        ? `
    <!-- Playing indicator (sound waves) -->
    <rect x="0" y="8" width="4" height="14" rx="2" fill="#1DB954">
      <animate attributeName="height" values="14;8;14" dur="0.6s" repeatCount="indefinite"/>
      <animate attributeName="y" values="8;11;8" dur="0.6s" repeatCount="indefinite"/>
    </rect>
    <rect x="8" y="4" width="4" height="22" rx="2" fill="#1DB954">
      <animate attributeName="height" values="22;12;22" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="y" values="4;9;4" dur="0.5s" repeatCount="indefinite"/>
    </rect>
    <rect x="16" y="10" width="4" height="10" rx="2" fill="#1DB954">
      <animate attributeName="height" values="10;18;10" dur="0.7s" repeatCount="indefinite"/>
      <animate attributeName="y" values="10;6;10" dur="0.7s" repeatCount="indefinite"/>
    </rect>
    `
        : `
    <!-- Paused indicator -->
    <rect x="4" y="4" width="5" height="22" rx="1" fill="#b3b3b3"/>
    <rect x="14" y="4" width="5" height="22" rx="1" fill="#b3b3b3"/>
    `
    }
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

/**
 * Truncate text with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}
