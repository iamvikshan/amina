/**
 * GuildBanner Component
 * Header banner for guild pages
 * Based on reference: .reference/frontend/src/components/GuildBanner.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { getGuildIconUrl, getGuildBannerUrl } from '@/lib/dashboard/utils';

interface GuildBannerProps {
  /** Guild ID */
  guildId: string;
  /** Guild name */
  name: string;
  /** Guild icon hash */
  icon?: string | null;
  /** Guild banner hash */
  banner?: string | null;
  /** Member count */
  memberCount?: number;
  /** Show settings button */
  showSettings?: boolean;
  /** Additional className */
  className?: string;
}

export const GuildBanner: FC<GuildBannerProps> = ({
  guildId,
  name,
  icon,
  banner,
  memberCount,
  showSettings = true,
  className,
}) => {
  const bannerUrl = getGuildBannerUrl(guildId, banner);
  const iconUrl = getGuildIconUrl(guildId, icon);

  return (
    <div
      class={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-gradient-to-r from-amina-crimson to-amina-rose-red',
        className
      )}
      style={
        bannerUrl
          ? {
              backgroundImage: `url(${bannerUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {/* Overlay for banner images */}
      {bannerUrl && (
        <div class="absolute inset-0 bg-gradient-to-r from-amina-crimson/90 to-amina-rose-red/80" />
      )}

      <div class="relative px-5 lg:px-8 py-5 lg:py-7">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Guild Icon */}
          <div class="shrink-0">
            <img
              src={iconUrl}
              alt={name}
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shadow-lg ring-2 ring-white/20"
              loading="lazy"
            />
          </div>

          {/* Guild Info */}
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl sm:text-3xl font-heading font-bold text-white truncate">
              {name}
            </h1>
            {memberCount !== undefined && (
              <p class="text-white/80 text-sm sm:text-base mt-1">
                <span class="inline-flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {memberCount.toLocaleString()} members
                </span>
              </p>
            )}
          </div>

          {/* Actions */}
          {showSettings && (
            <div class="shrink-0 flex gap-2">
              <a
                href={`/dash/guild/${guildId}/settings`}
                class={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-white/20 hover:bg-white/30 text-white',
                  'transition-colors duration-200',
                  'font-medium text-sm'
                )}
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Compact Guild Header
 * For use in sidebars or smaller spaces
 */
export const GuildHeaderCompact: FC<{
  guildId: string;
  name: string;
  icon?: string | null;
  className?: string;
}> = ({ guildId, name, icon, className }) => {
  const iconUrl = getGuildIconUrl(guildId, icon);

  return (
    <a
      href={`/dash/guild/${guildId}`}
      class={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'hover:bg-night-steel/50 transition-colors',
        'cursor-pointer',
        className
      )}
    >
      <img
        src={iconUrl}
        alt={name}
        class="w-10 h-10 rounded-lg"
        loading="lazy"
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-pure-white truncate">{name}</p>
      </div>
      <svg
        class="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </a>
  );
};
