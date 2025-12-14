import type { FC } from 'hono/jsx';
import type { GuardianRank } from '@types';
import { ImagePaths } from '@/utils/cdn';

interface GuardianBadgeProps {
  rank: GuardianRank;
  showProgress?: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GuardianBadge: FC<GuardianBadgeProps> = ({
  rank,
  showProgress = false,
  progress = 0,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  } as const;

  const badgeImageSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  } as const;

  const badgeImages: Record<string, string> = {
    Recruit: ImagePaths.badges.recruit,
    Scout: ImagePaths.badges.scout,
    Guardian: ImagePaths.badges.guard,
    Elite: ImagePaths.badges.elite,
    Commander: ImagePaths.badges.commander,
    Legend: ImagePaths.badges.legend,
  };

  const badgeImage = badgeImages[rank.name];

  return (
    <>
      <div
        class={`guardian-badge-root inline-flex flex-col gap-2 ${className}`}
      >
        <div
          class={`guardian-badge-shell inline-flex items-center gap-2 rounded-xl border-2 ${rank.color} border-current bg-night-shadow/50 backdrop-blur-sm ${sizeClasses[size]} font-heading font-bold shadow-lg`}
        >
          <img
            src={badgeImage}
            alt={`${rank.name} Badge`}
            class={`${badgeImageSizes[size]} object-contain pixelated`}
            loading="lazy"
          />
          <span class="uppercase tracking-wider">{rank.name}</span>
          <span class="opacity-60 text-xs">Lv.{rank.level}</span>
        </div>

        {showProgress && rank.maxServers !== Infinity && (
          <div class="flex items-center gap-2 text-xs">
            <div class="flex-1 h-1.5 bg-night-steel rounded-full overflow-hidden">
              <div
                class={`h-full ${rank.color.replace('text-', 'bg-')} transition-all duration-500 shadow-glow-crimson`}
                style={`width: ${progress}%`}
              />
            </div>
            <span class="text-gray-400 font-mono">{progress}%</span>
          </div>
        )}
      </div>

      <style>
        {`
          .guardian-badge-root .pixelated {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
          }

          .guardian-badge-root .guardian-badge-shell {
            animation: badge-glow 3s ease-in-out infinite;
          }

          @keyframes badge-glow {
            0%,
            100% {
              box-shadow: 0 0 10px currentColor;
            }
            50% {
              box-shadow:
                0 0 20px currentColor,
                0 0 30px currentColor;
            }
          }
        `}
      </style>
    </>
  );
};
