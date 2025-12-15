/**
 * Guild Settings Page
 * Route: /dash/guild/:guildId/settings
 */

import { createRoute } from 'honox/factory';
import { GuildLayout } from '@/components/dashboard/layouts/GuildLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/dashboard/ui/Card';
import {
  FormCard,
  FormSection,
  FormActions,
  InputField,
  SelectField,
  SwitchField,
} from '@/components/dashboard/forms';
import type { BreadcrumbItem } from '@types';

export default createRoute((c) => {
  const guildId = c.req.param('guildId') || '';

  // TODO: Fetch guild data from database
  const guild = {
    id: guildId,
    name: 'My Awesome Server',
    icon: null as string | null,
    banner: null as string | null,
    memberCount: 1234,
  };

  // TODO: Fetch enabled features from database
  const enabledFeatures: string[] = ['welcome', 'logging'];

  // TODO: Fetch guild settings from database
  const settings = {
    prefix: '!',
    language: 'en',
    timezone: 'UTC',
    deleteCommands: false,
    embedColor: '#3B82F6',
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dash' },
    { label: guild.name, href: `/dash/guild/${guildId}` },
    { label: 'Settings', href: `/dash/guild/${guildId}/settings` },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ja', label: '日本語' },
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
  ];

  return c.render(
    <GuildLayout
      guildId={guildId}
      guild={guild}
      enabledFeatures={enabledFeatures}
      activeId="settings"
      breadcrumbs={breadcrumbs}
    >
      <div class="space-y-6">
        {/* Page Header */}
        <div>
          <h1 class="text-2xl font-heading font-bold text-pure-white">
            Server Settings
          </h1>
          <p class="text-gray-400 mt-1">
            Configure general settings for {guild.name}
          </p>
        </div>

        {/* General Settings */}
        <FormCard
          title="General"
          description="Basic bot configuration for this server"
        >
          <FormSection>
            <InputField
              label="Command Prefix"
              description="The prefix used to trigger bot commands"
              value={settings.prefix}
              placeholder="!"
            />
            <SelectField
              label="Language"
              description="Default language for bot responses"
              value={settings.language}
              options={languageOptions}
            />
            <SelectField
              label="Timezone"
              description="Timezone for scheduled events and timestamps"
              value={settings.timezone}
              options={timezoneOptions}
            />
          </FormSection>
        </FormCard>

        {/* Behavior Settings */}
        <FormCard
          title="Behavior"
          description="Control how the bot behaves in this server"
        >
          <FormSection>
            <SwitchField
              label="Delete Command Messages"
              description="Automatically delete the message that triggered a command"
              checked={settings.deleteCommands}
            />
            <InputField
              label="Embed Color"
              description="Default color for bot embeds (hex code)"
              value={settings.embedColor}
              placeholder="#3B82F6"
            />
          </FormSection>
        </FormCard>

        {/* Danger Zone */}
        <Card className="border-amina-crimson/30">
          <CardHeader>
            <CardTitle className="text-amina-crimson">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your server's data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center justify-between p-4 bg-amina-crimson/5 rounded-lg border border-amina-crimson/20">
              <div>
                <p class="text-pure-white font-medium">Reset All Settings</p>
                <p class="text-gray-400 text-sm">
                  This will reset all bot settings to their defaults
                </p>
              </div>
              <button
                type="button"
                class="px-4 py-2 bg-amina-crimson/10 hover:bg-amina-crimson/20 text-amina-crimson border border-amina-crimson/30 rounded-lg text-sm font-medium transition-colors"
              >
                Reset Settings
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </GuildLayout>
  );
});
