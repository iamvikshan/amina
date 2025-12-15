/**
 * Dashboard Home - Guild Selector
 * Route: /dash
 */

import { createRoute } from 'honox/factory';
import { AppLayout } from '@/components/dashboard/layouts/AppLayout';
import { Sidebar } from '@/components/dashboard/layouts/Sidebar';
import { Navbar } from '@/components/dashboard/layouts/Navbar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/dashboard/ui/Card';
import { SkeletonCard } from '@/components/dashboard/ui/Skeleton';
import { sessionUtils } from '@lib/cookie-utils';
import { getGuildIconUrl } from '@/lib/dashboard/utils';
import type { DashSidebarSection } from '@types';

export default createRoute(async (c) => {
  const breadcrumbs = [{ label: 'Dashboard', href: '/dash' }];

  const sidebarSections: DashSidebarSection[] = [
    {
      items: [
        { id: 'home', name: 'Home', href: '/dash', icon: 'lucide:home' },
        {
          id: 'profile',
          name: 'Profile',
          href: '/dash/profile',
          icon: 'lucide:user',
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          id: 'docs',
          name: 'Documentation',
          href: 'https://docs.4mina.app',
          icon: 'lucide:book-open',
          external: true,
        },
        {
          id: 'support',
          name: 'Support',
          href: 'https://discord.gg/amina',
          icon: 'lucide:message-circle',
          external: true,
        },
      ],
    },
  ];

  // Fetch guilds from API
  const session = sessionUtils.getSession(c);
  let guilds: any[] = [];

  if (session?.access_token) {
    try {
      const response = await fetch(
        'https://discord.com/api/v10/users/@me/guilds',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const allGuilds = await response.json();
        // Filter guilds where user has MANAGE_GUILD permission
        guilds = allGuilds.filter((guild: any) => {
          const permissions = BigInt(guild.permissions || '0');
          const MANAGE_GUILD = BigInt(0x20);
          return (permissions & MANAGE_GUILD) === MANAGE_GUILD;
        });
      }
    } catch (error) {
      console.error('Failed to fetch guilds:', error);
    }
  }

  return c.render(
    <AppLayout sidebar={<Sidebar sections={sidebarSections} />}>
      <div class="bg-night-shadow/50 border-b border-night-slate">
        <Navbar breadcrumbs={breadcrumbs} />
      </div>

      <div class="max-w-7xl mx-auto p-6 md:p-8">
        <div class="mb-8">
          <h1 class="text-3xl font-heading font-bold text-pure-white mb-2">
            Your Servers
          </h1>
          <p class="text-gray-400">
            Select a server to manage Amina's features and settings
          </p>
        </div>

        {guilds.length > 0 ? (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guilds.map((guild: any) => (
              <GuildCard key={guild.id} guild={guild} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </AppLayout>
  );
});

/** Guild Card Component */
function GuildCard({ guild }: { guild: any }) {
  const iconUrl = getGuildIconUrl(guild.id, guild.icon);

  return (
    <a href={`/dash/guild/${guild.id}`}>
      <Card hover className="h-full">
        <CardHeader>
          <div class="flex items-center gap-3">
            <img
              src={iconUrl}
              alt={guild.name}
              class="w-12 h-12 rounded-full bg-night-steel"
              loading="lazy"
            />
            <div class="flex-1 min-w-0">
              <CardTitle className="truncate text-base">{guild.name}</CardTitle>
              {guild.memberCount && (
                <CardDescription>
                  {guild.memberCount.toLocaleString()} members
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span class="iconify" data-icon="lucide:settings" />
            <span>Manage Features</span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

/** Empty State */
function EmptyState() {
  return (
    <div class="text-center py-12">
      <div class="mb-4">
        <svg
          class="mx-auto h-16 w-16 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 class="text-lg font-heading font-semibold text-pure-white mb-2">
        No servers found
      </h3>
      <p class="text-sm text-gray-400 mb-6 max-w-md mx-auto">
        You don't have any servers where you can manage Amina. Make sure you
        have the "Manage Server" permission.
      </p>
      <a
        href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
        class="inline-flex items-center gap-2 px-4 py-2 bg-amina-crimson hover:bg-amina-rose-red text-white rounded-md transition-colors"
      >
        <span class="iconify" data-icon="lucide:plus" />
        Invite Amina to Your Server
      </a>
    </div>
  );
}
