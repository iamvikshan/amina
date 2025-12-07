// Achievement System Types

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
