/**
 * User Profile Page
 * Route: /dash/user/:userId
 * Based on reference: .reference/frontend/src/app/user/profile/page.tsx
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
import { Badge } from '@/components/dashboard/ui/Badge';
import {
  FormCard,
  FormSection,
  SwitchField,
  SelectField,
} from '@/components/dashboard/forms';
import { sessionUtils } from '@lib/cookie-utils';
import type { DashSidebarSection, BreadcrumbItem } from '@types';

export default createRoute(async (c) => {
  const userId = c.req.param('userId') || '';
  const session = sessionUtils.getSession(c);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dash' },
    { label: 'Profile', href: `/dash/user/${userId}` },
  ];

  const sidebarSections: DashSidebarSection[] = [
    {
      items: [
        { id: 'home', name: 'Home', href: '/dash', icon: 'lucide:home' },
        {
          id: 'profile',
          name: 'Profile',
          href: `/dash/user/${userId}`,
          icon: 'lucide:user',
          active: true,
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

  // TODO: Fetch user data from database
  // For now, try to get from Discord API if we have a session
  let user = {
    id: userId,
    username: 'Loading...',
    discriminator: '0000',
    avatar: null as string | null,
    banner: null as string | null,
    accent_color: null as number | null,
  };

  if (session?.access_token) {
    try {
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        user = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }

  const themeOptions = [
    { value: 'system', label: 'System' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
  ];

  return c.render(
    <AppLayout sidebar={<Sidebar sections={sidebarSections} />}>
      <div class="sticky top-0 z-10 bg-night-shadow/95 backdrop-blur-sm border-b border-night-slate">
        <Navbar breadcrumbs={breadcrumbs} />
      </div>

      <div class="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* Profile Header Card */}
        <Card className="overflow-hidden">
          {/* Banner */}
          <div
            class="h-32 bg-gradient-to-r from-cyber-blue/30 to-amina-crimson/30"
            style={
              user.banner
                ? `background-image: url(https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=600); background-size: cover; background-position: center;`
                : user.accent_color
                  ? `background: #${user.accent_color.toString(16).padStart(6, '0')};`
                  : undefined
            }
          />

          {/* Profile Info */}
          <div class="px-6 pb-6">
            <div class="flex items-end gap-4 -mt-12">
              {/* Avatar */}
              <div class="relative">
                {user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                    alt={user.username}
                    class="w-24 h-24 rounded-full ring-4 ring-night-shadow bg-night-steel"
                  />
                ) : (
                  <div class="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-blue to-amina-crimson flex items-center justify-center ring-4 ring-night-shadow">
                    <span class="text-3xl font-bold text-pure-white">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div class="absolute -bottom-1 -right-1 w-7 h-7 bg-discord-green rounded-full border-4 border-night-shadow" />
              </div>

              {/* User Info */}
              <div class="flex-1 pb-2">
                <div class="flex items-center gap-3">
                  <h1 class="text-2xl font-heading font-bold text-pure-white">
                    {user.username}
                    {user.discriminator !== '0' && (
                      <span class="text-gray-400">#{user.discriminator}</span>
                    )}
                  </h1>
                  <Badge variant="info">Discord User</Badge>
                </div>
                <p class="text-gray-400 text-sm mt-1">ID: {user.id}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <FormCard
          title="Preferences"
          description="Customize your dashboard experience"
        >
          <FormSection>
            <SelectField
              label="Theme"
              description="Choose your preferred color scheme"
              value="system"
              options={themeOptions}
            />
            <SelectField
              label="Language"
              description="Choose your preferred language"
              value="en"
              options={languageOptions}
            />
          </FormSection>
        </FormCard>

        {/* Notifications */}
        <FormCard
          title="Notifications"
          description="Manage how you receive notifications"
        >
          <FormSection>
            <SwitchField
              label="Email Notifications"
              description="Receive important updates about your servers via email"
              checked={false}
            />
            <SwitchField
              label="Push Notifications"
              description="Receive browser notifications for important events"
              checked={true}
            />
            <SwitchField
              label="Marketing Emails"
              description="Receive news about new features and updates"
              checked={false}
            />
          </FormSection>
        </FormCard>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>Manage your linked accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              {/* Discord - Always Connected */}
              <div class="flex items-center justify-between p-4 bg-night-steel/50 rounded-lg border border-night-slate">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-discord-blurple rounded-lg flex items-center justify-center">
                    <svg
                      class="w-7 h-7 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-pure-white">Discord</p>
                    <p class="text-sm text-discord-green">
                      Connected as {user.username}
                    </p>
                  </div>
                </div>
                <Badge variant="success">Primary</Badge>
              </div>

              {/* GitHub - Optional */}
              <div class="flex items-center justify-between p-4 bg-night-steel/50 rounded-lg border border-night-slate">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span
                      class="iconify w-7 h-7 text-white"
                      data-icon="mdi:github"
                    />
                  </div>
                  <div>
                    <p class="font-medium text-pure-white">GitHub</p>
                    <p class="text-sm text-gray-400">Not connected</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="px-4 py-2 bg-night-steel hover:bg-night-slate text-pure-white rounded-lg text-sm font-medium transition-colors border border-night-slate"
                >
                  Connect
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-amina-crimson/30">
          <CardHeader>
            <CardTitle className="text-amina-crimson">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              {/* Revoke Access */}
              <div class="flex items-center justify-between p-4 bg-amina-crimson/5 rounded-lg border border-amina-crimson/20">
                <div>
                  <p class="text-pure-white font-medium">Revoke All Access</p>
                  <p class="text-gray-400 text-sm">
                    Remove bot from all your servers
                  </p>
                </div>
                <button
                  type="button"
                  class="px-4 py-2 bg-amina-crimson/10 hover:bg-amina-crimson/20 text-amina-crimson border border-amina-crimson/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Revoke Access
                </button>
              </div>

              {/* Delete Account */}
              <div class="flex items-center justify-between p-4 bg-amina-crimson/5 rounded-lg border border-amina-crimson/20">
                <div>
                  <p class="text-pure-white font-medium">Delete Account</p>
                  <p class="text-gray-400 text-sm">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <button
                  type="button"
                  class="px-4 py-2 bg-amina-crimson hover:bg-amina-crimson/90 text-pure-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
});
