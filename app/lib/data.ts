/**
 * Data utilities for UI components
 */

/**
 * Get Discord avatar URL
 */
export function getAvatarUrl(
  userId: string,
  avatarHash?: string | null
): string {
  if (!avatarHash) {
    // Default Discord avatar
    const defaultAvatarIndex = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
  }

  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
}

/**
 * Get Discord guild icon URL
 */
export function getGuildIconUrl(
  guildId: string,
  iconHash?: string | null
): string {
  if (!iconHash) {
    return '/images/default-guild.png';
  }

  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png?size=256`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;

  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
