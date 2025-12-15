/**
 * Dashboard utility functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge
 * Prevents class conflicts and deduplicates classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get icon URL for Discord guild
 */
export function getGuildIconUrl(guildId: string, icon?: string | null): string {
  if (!icon) {
    return '/images/default-guild.png';
  }
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=256`;
}

/**
 * Get banner URL for Discord guild
 */
export function getGuildBannerUrl(
  guildId: string,
  banner?: string | null
): string | null {
  if (!banner) return null;
  return `https://cdn.discordapp.com/banners/${guildId}/${banner}.png?size=1024`;
}
