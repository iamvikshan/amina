import type { FC } from 'hono/jsx';
import type { Achievement } from '@types';
import { getRarityColor } from '@/lib/achievements';
import { ImagePaths } from '@/utils/cdn';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export const AchievementBadge: FC<AchievementBadgeProps> = ({
  achievement,
  size = 'md',
  showDescription = true,
  className = '',
}) => {
  const colors = getRarityColor(achievement.rarity);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  } as const;

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  } as const;

  const achievementImages: Record<string, string> = {
    first_watch: ImagePaths.achievements.firstWatch,
    squad_leader: ImagePaths.achievements.squadLeader,
    network_guardian: ImagePaths.achievements.networkGuardian,
    empire_shield: ImagePaths.achievements.empireShield,
    realm_master: ImagePaths.achievements.realmMaster,
    living_legend: ImagePaths.achievements.livingLegend,
    dawn_warrior: ImagePaths.achievements.dawnWarrior,
    midnight_sentinel: ImagePaths.achievements.midnightSentinel,
    speedrunner: ImagePaths.achievements.speedrunner,
    dedication: ImagePaths.achievements.dedication,
    social_butterfly: ImagePaths.achievements.socialButterfly,
    perfectionist: ImagePaths.achievements.perfectionist,
  };

  const achievementImage = achievementImages[achievement.id];

  return (
    <>
      <div
        class={`achievement-badge ${colors.bg} ${colors.border} border-2 rounded-xl ${sizeClasses[size]} ${className} backdrop-blur-sm`}
        title={achievement.description}
      >
        <div class="flex items-center gap-3">
          {achievementImage ? (
            <img
              src={achievementImage}
              alt={achievement.name}
              class={`${iconSizes[size]} pixel-art flex-shrink-0`}
              loading="lazy"
            />
          ) : (
            <span class={`text-2xl ${colors.text} flex-shrink-0`}>
              {achievement.icon}
            </span>
          )}

          <div class="flex-1">
            <div class={`font-heading font-bold ${colors.text}`}>
              {achievement.name}
            </div>
            {showDescription && (
              <div class="text-xs text-gray-400 mt-0.5">
                {achievement.description}
              </div>
            )}
          </div>

          {achievement.rarity !== 'common' && (
            <span
              class={`text-xs font-bold ${colors.text} opacity-60 uppercase tracking-wider`}
            >
              {achievement.rarity}
            </span>
          )}
        </div>
      </div>

      <style>
        {`
          .achievement-badge {
            animation: badge-unlock 0.5s ease-out;
            transition: all 0.3s ease;
          }

          .achievement-badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px currentColor;
          }

          @keyframes badge-unlock {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(20px);
            }
            60% {
              transform: scale(1.1) translateY(-5px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};
