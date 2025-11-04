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
    {
      id: 'first_mission',
      name: 'First Mission',
      description: 'Added Amina to your first server',
      icon: '[>]',
      rarity: 'common',
      unlocked: serverCount >= 1,
    },
    {
      id: 'night_guard_initiate',
      name: 'Night Guard Initiate',
      description: 'Completed full server setup',
      icon: '[*]',
      rarity: 'common',
      unlocked: configuredCount >= 1,
    },
    {
      id: 'squad_builder',
      name: 'Squad Builder',
      description: 'Manage 3 servers simultaneously',
      icon: '[**]',
      rarity: 'rare',
      unlocked: serverCount >= 3,
    },
    {
      id: 'community_guardian',
      name: 'Community Guardian',
      description: 'Protect 5 realms at once',
      icon: '[***]',
      rarity: 'rare',
      unlocked: serverCount >= 5,
    },
    {
      id: 'empire_defender',
      name: 'Empire Defender',
      description: 'Command 10+ realms',
      icon: '[****]',
      rarity: 'epic',
      unlocked: serverCount >= 10,
    },
    {
      id: 'legend_status',
      name: 'Legend of the Digital Empire',
      description: 'Manage 20+ servers',
      icon: '[*****]',
      rarity: 'legendary',
      unlocked: serverCount >= 20,
    },
    {
      id: 'early_riser',
      name: 'Early Riser',
      description: 'Logged in before 6 AM',
      icon: '(^_^)',
      rarity: 'common',
      unlocked: new Date().getHours() < 6,
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Active after midnight',
      icon: '(-..-)',
      rarity: 'common',
      unlocked: new Date().getHours() >= 0 && new Date().getHours() < 5,
    },
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
