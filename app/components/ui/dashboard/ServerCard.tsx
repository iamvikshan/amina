import type { FC } from 'hono/jsx';
import type { DiscordGuild } from '@types';
import { getServerIcon } from '@/lib/data-utils';
import { getInviteUrl } from '@/config/permalinks';
import { LucideIcon } from '@/components/ui/icons/LucideIcon';

interface ServerCardProps {
  guild: DiscordGuild;
  isConfigured: boolean;
  redirectPath?: string;
}

export const ServerCard: FC<ServerCardProps> = ({
  guild,
  isConfigured,
  redirectPath = '/dash',
}) => {
  const getStatusMessage = (configured: boolean) => {
    if (configured) {
      return {
        text: 'Night Guard Protocol Active',
        kaomoji: '[*]',
        color: 'text-discord-green',
      };
    }
    return {
      text: 'Ready for Deployment',
      kaomoji: '[>]',
      color: 'text-cyber-blue',
    };
  };

  const baseInviteUrl = getInviteUrl();
  const addBotUrl = new URL(baseInviteUrl);
  addBotUrl.searchParams.append('guild_id', guild.id);

  const getGradient = (name: string) => {
    const hash = name
      .split('')
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360;
    return `from-[hsl(${hue1},70%,60%)] to-[hsl(${hue2},70%,60%)]`;
  };

  const gradient = getGradient(guild.name);
  const iconUrl = getServerIcon(guild);

  const permissions = BigInt(guild.permissions);
  const isAdmin = (permissions & 0x8n) === 0x8n;

  const statusMessage = getStatusMessage(isConfigured);

  if (!isAdmin) {
    return null;
  }

  return (
    <div class="relative group">
      <div class="card-amina p-4 transform transition-all duration-300 hover:scale-105 hover:border-amina-crimson">
        <div class="absolute top-2 left-2 z-10">
          <div
            class={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
              isConfigured
                ? 'bg-discord-green/20 text-discord-green ring-1 ring-discord-green/30'
                : 'bg-cyber-blue/20 text-cyber-blue ring-1 ring-cyber-blue/30'
            }`}
          >
            {isConfigured ? (
              <LucideIcon name="check-circle" size={12} />
            ) : (
              <LucideIcon name="shield" size={12} />
            )}
            <span class="hidden sm:inline">{statusMessage.kaomoji}</span>
          </div>
        </div>

        <div class="absolute top-2 right-2 z-10">
          <form action="/api/guild/refresh" method="post">
            <input type="hidden" name="redirect" value={redirectPath} />
            <input type="hidden" name="guildId" value={guild.id} />
            <button
              type="submit"
              class="p-2 rounded-lg bg-night-steel/80 hover:bg-night-slate text-cyber-blue transition-all duration-300 hover:rotate-180 backdrop-blur-sm"
              title="Refresh server info"
            >
              <LucideIcon name="refresh-cw" size={16} />
            </button>
          </form>
        </div>

        <div
          class={`relative h-32 rounded-lg overflow-hidden mb-4 ${
            iconUrl ? '' : `bg-gradient-to-br ${gradient}`
          }`}
        >
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={`${guild.name} icon`}
              class="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div class="w-full h-full flex items-center justify-center">
              <span class="text-4xl font-bold text-white">
                {guild.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div class="flex items-start gap-3">
          <div
            class={`h-12 w-12 rounded-full overflow-hidden flex-shrink-0 ${
              iconUrl ? '' : `bg-gradient-to-br ${gradient}`
            }`}
          >
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={`${guild.name} icon`}
                class="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div class="w-full h-full flex items-center justify-center">
                <span class="text-lg font-bold text-white">
                  {guild.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {guild.name}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {guild.approximate_member_count?.toLocaleString() ?? 'Unknown'}{' '}
              members
            </p>
            <p class={`text-xs font-medium mt-1 ${statusMessage.color}`}>
              {statusMessage.text}
            </p>
          </div>
        </div>

        <div class="mt-4">
          {isConfigured ? (
            <a
              href={`/dash/guild/${guild.id}`}
              class="w-full btn-primary text-center block"
            >
              <span class="flex items-center justify-center gap-2">
                <LucideIcon name="settings" size={16} />
                Configure
              </span>
            </a>
          ) : (
            <a
              href={addBotUrl.toString()}
              class="w-full btn-secondary text-center block"
            >
              <span class="flex items-center justify-center gap-2">
                <LucideIcon name="plus" size={16} />
                Deploy Amina
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
