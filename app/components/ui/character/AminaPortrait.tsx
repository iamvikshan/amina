import type { FC } from 'hono/jsx';
import { ImagePaths } from '@utils/cdn';

interface AminaPortraitProps {
  expression?: 'idle' | 'success' | 'alert' | 'error';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  className?: string;
  presence?: 'online' | 'idle' | 'dnd' | 'offline';
  showPresence?: boolean;
}

export const AminaPortrait: FC<AminaPortraitProps> = ({
  expression = 'idle',
  size = 'md',
  showGlow = true,
  className = '',
  presence = 'online',
  showPresence = true,
}) => {
  type Expression = NonNullable<AminaPortraitProps['expression']>;
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  } as const;

  const glowClasses = {
    idle: 'shadow-glow-crimson',
    success: 'shadow-glow-green',
    alert: 'shadow-glow-gold',
    error: 'shadow-glow-crimson',
  } as const;

  const presenceColors = {
    online: 'bg-discord-green',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
  } as const;

  const presenceTitles = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
  } as const;

  const indicatorSizes = {
    sm: 'w-3 h-3 border-2',
    md: 'w-4 h-4 border-2',
    lg: 'w-5 h-5 border-[3px]',
    xl: 'w-6 h-6 border-[3px]',
  } as const;

  const portraits: Record<Expression, string> = {
    idle: ImagePaths.portraits.idle,
    success: ImagePaths.portraits.success,
    alert: ImagePaths.portraits.alert,
    error: ImagePaths.portraits.error,
  };

  const portraitSrc = portraits[expression];

  return (
    <>
      <div
        class={`amina-portrait relative ${sizeClasses[size]} ${
          showGlow ? glowClasses[expression] : ''
        } ${className}`}
        data-expression={expression}
      >
        <img
          src={portraitSrc}
          alt={`Amina - ${expression}`}
          class="w-full h-full object-cover"
          loading="lazy"
        />

        {showPresence && (
          <div
            class={`absolute bottom-0 right-0 ${indicatorSizes[size]} ${
              presenceColors[presence]
            } rounded-full border-night-black`}
            title={presenceTitles[presence]}
          />
        )}
      </div>

      <style>
        {`
          .amina-portrait {
            border-radius: 50%;
            border: 3px solid var(--amina-crimson);
            overflow: hidden;
            animation: portrait-breathe 4s ease-in-out infinite;
          }

          @keyframes portrait-breathe {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }

          .amina-portrait[data-expression='success'] {
            animation: portrait-success 0.6s ease-out;
          }

          @keyframes portrait-success {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.15) rotate(5deg);
            }
            100% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </>
  );
};
