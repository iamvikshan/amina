// Achievement System
// Tracks user milestones and accomplishments

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string; // Kaomoji or text symbol
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: Date;
};

export type AchievementCategory = {
  category: string;
  achievements: Achievement[];
};

/**
 * Check which achievements the user has unlocked
 */
export function checkAchievements(
  serverCount: number,
  configuredCount: number,
  userData: any
): Achievement[] {
  const achievements: Achievement[] = [
    // Core Deployment Achievements
    {
      id: 'first_watch',
      name: 'First Watch',
      description:
        'Deployed Amina to your first realm. The Night Guard Protocol begins!',
      icon: '[>_]',
      rarity: 'common',
      unlocked: configuredCount >= 1,
    },
    {
      id: 'squad_leader',
      name: 'Squad Leader',
      description:
        'Protecting multiple realms now. Your command expands! (•̀ᴗ•́)و',
      icon: '[>>_]',
      rarity: 'common',
      unlocked: configuredCount >= 2,
    },
    {
      id: 'network_guardian',
      name: 'Network Guardian',
      description:
        'Five realms under protection. Your influence grows across the network.',
      icon: '[*_*]',
      rarity: 'rare',
      unlocked: configuredCount >= 5,
    },
    {
      id: 'empire_shield',
      name: "Empire's Shield",
      description:
        "Ten realms defended. You're becoming a true guardian commander.",
      icon: '[**_]',
      rarity: 'rare',
      unlocked: configuredCount >= 10,
    },
    {
      id: 'realm_master',
      name: 'Realm Master',
      description:
        'Fifteen realms bow to your guardianship. A master of protection.',
      icon: '[***]',
      rarity: 'epic',
      unlocked: configuredCount >= 15,
    },
    {
      id: 'living_legend',
      name: 'Living Legend',
      description:
        'Twenty realms and beyond. Legends are written about guardians like you.',
      icon: '[****]',
      rarity: 'legendary',
      unlocked: configuredCount >= 20,
    },
    // Time-Based Achievements
    {
      id: 'dawn_warrior',
      name: 'Dawn Warrior',
      description:
        'Active before dawn breaks. A true early bird guardian! (^_^)',
      icon: '(^_^)/',
      rarity: 'rare',
      unlocked: new Date().getHours() < 6,
    },
    {
      id: 'midnight_sentinel',
      name: 'Midnight Sentinel',
      description:
        'On watch when others sleep. The night is your domain. (⌐■_■)',
      icon: '(⌐■_■)',
      rarity: 'rare',
      unlocked: new Date().getHours() === 0,
    },
    // Optional/Future Achievements (not yet fully implemented)
    // {
    //   id: 'speedrunner',
    //   name: 'Speedrunner',
    //   description: "Five realms in one day? You don't waste time! [>>]",
    //   icon: '[>>]',
    //   rarity: 'epic',
    //   unlocked: false, // Requires timestamp tracking
    // },
    // {
    //   id: 'dedication',
    //   name: 'Unwavering Dedication',
    //   description: '30 days of constant vigilance. Your commitment is unmatched.',
    //   icon: '[*_*]',
    //   rarity: 'epic',
    //   unlocked: false, // Requires login streak system
    // },
    // {
    //   id: 'social_butterfly',
    //   name: 'Social Butterfly',
    //   description: 'Protecting large communities. Thousands trust your guardianship! (◕‿◕)',
    //   icon: '(◕‿◕)',
    //   rarity: 'rare',
    //   unlocked: false, // Requires large server tracking
    // },
    // {
    //   id: 'perfectionist',
    //   name: 'Perfectionist',
    //   description: 'Every realm fully configured. Perfection achieved. [****]',
    //   icon: '[****]',
    //   rarity: 'legendary',
    //   unlocked: false, // Requires full config completion tracking
    // },
  ];

  return achievements.filter((a) => a.unlocked);
}

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: Achievement['rarity']): {
  bg: string;
  border: string;
  text: string;
} {
  const colors = {
    common: {
      bg: 'bg-gray-700',
      border: 'border-gray-500',
      text: 'text-gray-300',
    },
    rare: {
      bg: 'bg-cyber-blue/20',
      border: 'border-cyber-blue',
      text: 'text-cyber-blue',
    },
    epic: {
      bg: 'bg-imperial-amber/20',
      border: 'border-imperial-amber',
      text: 'text-imperial-gold',
    },
    legendary: {
      bg: 'bg-amina-crimson/20',
      border: 'border-amina-crimson',
      text: 'text-amina-crimson',
    },
  };

  return colors[rarity];
}

/**
 * Get Amina's reaction to achievement unlock
 */
export function getAchievementMessage(achievementId: string): string {
  const messages: Record<string, string> = {
    first_mission:
      'Welcome to the Night Guard! This is just the beginning. (^_^)',
    night_guard_initiate:
      'Excellent work! Your first realm is fully armed and operational.',
    squad_builder: "Managing multiple fronts already? You're a natural leader!",
    community_guardian:
      'Five realms under your protection... impressive dedication!',
    empire_defender:
      "Ten realms! You've become a pillar of the Digital Empire. (•̀ᴗ•́)و",
    legend_status:
      "Twenty realms... You've truly transcended the ranks. A legend among guardians!",
    early_riser: "Up early to check on your realms? That's dedication! (^_^)b",
    night_owl: 'Burning the midnight oil? Get some rest, Commander! (>_<)',
  };

  return (
    messages[achievementId] ||
    "You've unlocked something special! Keep up the great work!"
  );
}

/**
 * Get total achievement progress
 */
export function getAchievementProgress(unlockedCount: number): {
  percentage: number;
  message: string;
} {
  const total = 8; // Total number of achievements
  const percentage = Math.round((unlockedCount / total) * 100);

  let message = '';
  if (percentage === 0) {
    message = 'Begin your journey by adding Amina to your first server!';
  } else if (percentage < 25) {
    message = 'Just getting started! Keep exploring.';
  } else if (percentage < 50) {
    message = "You're making good progress!";
  } else if (percentage < 75) {
    message = "Over halfway there! You're doing great!";
  } else if (percentage < 100) {
    message = 'So close to completing everything!';
  } else {
    message = "You've achieved everything! You're a true legend!";
  }

  return { percentage, message };
}
