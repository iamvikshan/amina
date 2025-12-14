import type { FC } from 'hono/jsx';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  presence?: 'online' | 'idle' | 'dnd' | 'offline';
  showPresence?: boolean;
}

export const Avatar: FC<AvatarProps> = ({
  src,
  alt,
  size = 'sm',
  presence = 'online',
  showPresence = false,
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  } as const;

  const indicatorSizes = {
    xs: 'w-2 h-2 border',
    sm: 'w-2.5 h-2.5 border-2',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-[3px]',
    xl: 'w-5 h-5 border-[3px]',
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

  return (
    <div class="relative inline-block">
      <img
        class={`${sizeClasses[size]} rounded-full ring-2 ring-neutral-50 dark:ring-zinc-800`}
        src={src}
        alt={alt}
        loading="eager"
      />

      {showPresence && (
        <div
          class={`absolute bottom-0 right-0 ${indicatorSizes[size]} ${presenceColors[presence]} rounded-full border-neutral-50 dark:border-zinc-800`}
          title={presenceTitles[presence]}
        />
      )}
    </div>
  );
};
