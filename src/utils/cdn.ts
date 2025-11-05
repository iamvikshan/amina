/**
 * CDN Configuration
 * =================
 * Centralized configuration for image CDN URLs
 * Uses Cloudflare R2 for large assets via custom domain
 *
 * CDN URL is public (read-only) - safe to hardcode
 * Domain: stuff.vikshan.me → R2 bucket: amina-assets
 */

// Cloudflare R2 CDN via custom domain (public read-only)
export const CDN_BASE_URL = 'https://stuff.vikshan.me';

/**
 * Get CDN URL for an image
 * @param path - Path relative to amina folder (e.g., 'portraits/portrait-error.png')
 * @returns Full URL to the image
 * @example getCDNUrl('portraits/portrait-error.png') → 'https://stuff.vikshan.me/amina/portraits/portrait-error.png'
 */
export function getCDNUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // All images are under amina/ prefix in the CDN
  return `${CDN_BASE_URL}/amina/${cleanPath}`;
}

/**
 * Image paths for different categories
 */
export const ImagePaths = {
  portraits: {
    alert: getCDNUrl('portraits/portrait-alert.png'),
    error: getCDNUrl('portraits/portrait-error.png'),
    idle: getCDNUrl('portraits/portrait-idle.png'),
    success: getCDNUrl('portraits/portrait-success.png'),
  },

  achievements: {
    dawnWarrior: getCDNUrl('achievements/achievement-dawn-warrior.png'),
    dedication: getCDNUrl('achievements/achievement-dedication.png'),
    empireShield: getCDNUrl('achievements/achievement-empire-shield.png'),
    firstWatch: getCDNUrl('achievements/achievement-first-watch.png'),
    livingLegend: getCDNUrl('achievements/achievement-living-legend.png'),
    midnightSentinel: getCDNUrl(
      'achievements/achievement-midnight-sentinel.png'
    ),
    networkGuardian: getCDNUrl('achievements/achievement-network-guardian.png'),
    perfectionist: getCDNUrl('achievements/achievement-perfectionist.png'),
    realmMaster: getCDNUrl('achievements/achievement-realm-master.png'),
    socialButterfly: getCDNUrl('achievements/achievement-social-butterfly.png'),
    speedrunner: getCDNUrl('achievements/achievement-speedrunner.png'),
    squadLeader: getCDNUrl('achievements/achievement-squad-leader.png'),
  },

  badges: {
    commander: getCDNUrl('badges/rank-commander.png'),
    elite: getCDNUrl('badges/rank-elite.png'),
    guard: getCDNUrl('badges/rank-guard.png'),
    legend: getCDNUrl('badges/rank-legend.png'),
    recruit: getCDNUrl('badges/rank-recruit.png'),
    scout: getCDNUrl('badges/rank-scout.png'),
  },

  hero: {
    casual: getCDNUrl('hero/full-body-casual.png'),
    hero: getCDNUrl('hero/full-body-hero.png'),
  },
} as const;
