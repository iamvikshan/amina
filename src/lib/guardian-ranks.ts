// Guardian Rank System Utility
// Calculates user rank based on server count

export type GuardianRank = {
  name: string;
  level: number;
  minServers: number;
  maxServers: number;
  message: string;
  color: string;
  badgeSymbol: string;
};

export const GUARDIAN_RANKS: GuardianRank[] = [
  {
    name: 'Recruit',
    level: 1,
    minServers: 0,
    maxServers: 1,
    message: "You've just joined the Night Guard. Let's train together!",
    color: 'text-gray-400',
    badgeSymbol: '[>]',
  },
  {
    name: 'Scout',
    level: 2,
    minServers: 2,
    maxServers: 4,
    message: 'Your skills are developing. I can see your potential.',
    color: 'text-cyber-blue',
    badgeSymbol: '[>>]',
  },
  {
    name: 'Guard',
    level: 3,
    minServers: 5,
    maxServers: 8,
    message: "You've proven yourself in battle. Well done.",
    color: 'text-discord-green',
    badgeSymbol: '[*]',
  },
  {
    name: 'Elite',
    level: 4,
    minServers: 9,
    maxServers: 13,
    message: "Few reach this level. You're one of the best.",
    color: 'text-imperial-gold',
    badgeSymbol: '[**]',
  },
  {
    name: 'Commander',
    level: 5,
    minServers: 14,
    maxServers: 19,
    message: 'Leading multiple fronts with mastery. Impressive.',
    color: 'text-amina-rose-red',
    badgeSymbol: '[***]',
  },
  {
    name: 'Legend',
    level: 6,
    minServers: 20,
    maxServers: Infinity,
    message: "You've transcended the ranks. A true guardian.",
    color: 'text-amina-crimson',
    badgeSymbol: '[****]',
  },
];

/**
 * Get the user's Guardian Rank based on server count
 */
export function getGuardianRank(serverCount: number): GuardianRank {
  return (
    GUARDIAN_RANKS.find(
      (rank) => serverCount >= rank.minServers && serverCount <= rank.maxServers
    ) || GUARDIAN_RANKS[0]
  );
}

/**
 * Calculate progress to next rank (0-100)
 */
export function getRankProgress(serverCount: number): number {
  const currentRank = getGuardianRank(serverCount);

  // If at max rank, return 100
  if (currentRank.maxServers === Infinity) {
    return 100;
  }

  const serversInRank = currentRank.maxServers - currentRank.minServers + 1;
  const currentProgress = serverCount - currentRank.minServers;

  return Math.round((currentProgress / serversInRank) * 100);
}

/**
 * Get next rank information
 */
export function getNextRank(serverCount: number): GuardianRank | null {
  const currentRank = getGuardianRank(serverCount);
  const nextRankIndex = GUARDIAN_RANKS.indexOf(currentRank) + 1;

  return nextRankIndex < GUARDIAN_RANKS.length
    ? GUARDIAN_RANKS[nextRankIndex]
    : null;
}

/**
 * Calculate servers needed for next rank
 */
export function getServersUntilNextRank(serverCount: number): number {
  const nextRank = getNextRank(serverCount);
  return nextRank ? nextRank.minServers - serverCount : 0;
}

/**
 * Get contextual Amina dialogue based on rank and progress
 */
export function getAminaDialogue(serverCount: number): string {
  const rank = getGuardianRank(serverCount);
  const progress = getRankProgress(serverCount);
  const nextRank = getNextRank(serverCount);

  if (serverCount === 0) {
    return "Ready to begin your mission? Let's get your first realm protected! (^_^)";
  }

  if (progress > 80 && nextRank) {
    const serversNeeded = getServersUntilNextRank(serverCount);
    return `Almost at ${nextRank.name} rank! Just ${serversNeeded} more realm${serversNeeded === 1 ? '' : 's'} to go. Keep it up!`;
  }

  if (progress < 30) {
    return rank.message;
  }

  return `Your ${rank.name} skills are showing. Your realms are in good hands! (•̀ᴗ•́)و`;
}

/**
 * Time-based greeting from Amina
 * Returns greeting without rank - rank display is handled by GuardianBadge
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning, Guardian!';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon, Guardian!';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening, Guardian!';
  } else {
    return 'Night Guard Protocol active!';
  }
}
