/**
 * Feature Configuration Page
 * Route: /dash/guild/:guildId/features/:feature
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
import { Badge } from '@/components/dashboard/ui/Badge';
import { ErrorPanel } from '@/components/dashboard/panels/ErrorPanel';
import {
  FormCard,
  FormSection,
  InputField,
  TextAreaField,
  SwitchField,
  SelectField,
  ChannelPicker,
  RolePicker,
  ColorPicker,
} from '@/components/dashboard/forms';
import { getFeature, isValidFeature } from '@/config/features';
import type { BreadcrumbItem, ChannelOption, RoleOption } from '@types';

export default createRoute((c) => {
  const guildId = c.req.param('guildId') || '';
  const featureId = c.req.param('feature') || '';

  // Validate feature ID
  if (!featureId || !isValidFeature(featureId)) {
    return c.render(<ErrorPanel error={`Feature not found: "${featureId}"`} />);
  }

  const feature = getFeature(featureId);
  if (!feature) {
    return c.render(
      <ErrorPanel error="Failed to load feature configuration" />
    );
  }

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
  const isEnabled = enabledFeatures.includes(featureId);

  // TODO: Fetch guild channels and roles from Discord API
  const channels: ChannelOption[] = [
    { id: '1', name: 'general', type: 0, position: 0 },
    { id: '2', name: 'welcome', type: 0, position: 1 },
    { id: '3', name: 'logs', type: 0, position: 2 },
    { id: '4', name: 'mod-logs', type: 0, position: 3 },
  ];

  const roles: RoleOption[] = [
    { id: '1', name: 'Admin', color: '#E74C3C', position: 3 },
    { id: '2', name: 'Moderator', color: '#3498DB', position: 2 },
    { id: '3', name: 'Member', color: '#95A5A6', position: 1 },
  ];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dash' },
    { label: guild.name, href: `/dash/guild/${guildId}` },
    {
      label: feature.name,
      href: `/dash/guild/${guildId}/features/${featureId}`,
    },
  ];

  return c.render(
    <GuildLayout
      guildId={guildId}
      guild={guild}
      enabledFeatures={enabledFeatures}
      activeId={featureId}
      breadcrumbs={breadcrumbs}
    >
      <div class="space-y-6">
        {/* Feature Header */}
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-cyber-blue/10 flex items-center justify-center">
              <span
                class="iconify w-7 h-7 text-cyber-blue"
                data-icon={feature.icon}
              />
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-heading font-bold text-pure-white">
                  {feature.name}
                </h1>
                <Badge variant={isEnabled ? 'success' : 'default'}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p class="text-gray-400 mt-1">{feature.description}</p>
            </div>
          </div>
          <FeatureToggle enabled={isEnabled} />
        </div>

        {/* Feature Configuration */}
        <FeatureConfig
          featureId={featureId}
          isEnabled={isEnabled}
          channels={channels}
          roles={roles}
        />
      </div>
    </GuildLayout>
  );
});

/** Feature toggle button */
function FeatureToggle({ enabled }: { enabled: boolean }) {
  return (
    <button
      type="button"
      class={`
        relative inline-flex h-8 w-14 items-center rounded-full transition-colors
        ${enabled ? 'bg-discord-green' : 'bg-night-steel'}
      `}
    >
      <span
        class={`
          inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform
          ${enabled ? 'translate-x-7' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

/** Feature-specific configuration forms */
function FeatureConfig({
  featureId,
  isEnabled,
  channels,
  roles,
}: {
  featureId: string;
  isEnabled: boolean;
  channels: ChannelOption[];
  roles: RoleOption[];
}) {
  if (!isEnabled) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div class="text-center">
            <span
              class="iconify w-12 h-12 text-gray-600 mx-auto mb-4"
              data-icon="lucide:power-off"
            />
            <h3 class="text-lg font-medium text-pure-white mb-2">
              Feature Disabled
            </h3>
            <p class="text-gray-400 text-sm max-w-md mx-auto">
              Enable this feature using the toggle above to configure its
              settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render feature-specific configuration
  switch (featureId) {
    case 'welcome':
      return <WelcomeConfig channels={channels} roles={roles} />;
    case 'farewell':
      return <FarewellConfig channels={channels} />;
    case 'logging':
      return <LoggingConfig channels={channels} />;
    case 'automod':
      return <AutomodConfig channels={channels} roles={roles} />;
    case 'ticket':
      return <TicketConfig channels={channels} roles={roles} />;
    case 'warnings':
      return <WarningsConfig roles={roles} />;
    case 'stats':
      return <StatsConfig channels={channels} />;
    default:
      return (
        <Card>
          <CardContent className="py-8">
            <p class="text-gray-400 text-center">
              Configuration for this feature is not yet available.
            </p>
          </CardContent>
        </Card>
      );
  }
}

/** Welcome Feature Config */
function WelcomeConfig({
  channels,
  roles,
}: {
  channels: ChannelOption[];
  roles: RoleOption[];
}) {
  return (
    <div class="space-y-6">
      <FormCard
        title="Channel & Role"
        description="Where to send welcome messages and what role to assign"
      >
        <FormSection>
          <ChannelPicker
            label="Welcome Channel"
            description="Channel where welcome messages will be sent"
            channels={channels}
            value=""
          />
          <RolePicker
            label="Auto Role"
            description="Role automatically assigned to new members"
            roles={roles}
            value=""
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Welcome Message"
        description="Customize the message sent when a member joins"
      >
        <FormSection>
          <TextAreaField
            label="Message Content"
            description="Use {user} for mention, {username} for name, {server} for server name"
            placeholder="Welcome {user} to {server}! 🎉"
            rows={4}
          />
          <SwitchField
            label="Send as Embed"
            description="Send the welcome message as a rich embed"
            checked={false}
          />
          <ColorPicker
            label="Embed Color"
            description="Color of the embed border"
            value="#3B82F6"
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Direct Message"
        description="Send a private welcome message"
      >
        <FormSection>
          <SwitchField
            label="Enable DM Welcome"
            description="Send a direct message to new members"
            checked={false}
          />
          <TextAreaField
            label="DM Message"
            description="Message sent privately to new members"
            placeholder="Welcome to our server! Please read the rules in #rules"
            rows={3}
          />
        </FormSection>
      </FormCard>
    </div>
  );
}

/** Farewell Feature Config */
function FarewellConfig({ channels }: { channels: ChannelOption[] }) {
  return (
    <div class="space-y-6">
      <FormCard
        title="Farewell Channel"
        description="Where to send goodbye messages"
      >
        <FormSection>
          <ChannelPicker
            label="Farewell Channel"
            description="Channel where farewell messages will be sent"
            channels={channels}
            value=""
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Farewell Message"
        description="Customize the goodbye message"
      >
        <FormSection>
          <TextAreaField
            label="Message Content"
            description="Use {username} for name, {server} for server name, {count} for member count"
            placeholder="Goodbye {username}! We now have {count} members."
            rows={4}
          />
          <SwitchField
            label="Send as Embed"
            description="Send the farewell message as a rich embed"
            checked={false}
          />
        </FormSection>
      </FormCard>
    </div>
  );
}

/** Logging Feature Config */
function LoggingConfig({ channels }: { channels: ChannelOption[] }) {
  return (
    <div class="space-y-6">
      <FormCard
        title="Log Channels"
        description="Set up different channels for different log types"
      >
        <FormSection>
          <ChannelPicker
            label="Message Logs"
            description="Log edited and deleted messages"
            channels={channels}
            value=""
          />
          <ChannelPicker
            label="Member Logs"
            description="Log member joins, leaves, and role changes"
            channels={channels}
            value=""
          />
          <ChannelPicker
            label="Moderation Logs"
            description="Log bans, kicks, and warnings"
            channels={channels}
            value=""
          />
          <ChannelPicker
            label="Server Logs"
            description="Log channel and role changes"
            channels={channels}
            value=""
          />
        </FormSection>
      </FormCard>

      <FormCard title="Log Settings" description="Fine-tune what gets logged">
        <FormSection>
          <SwitchField
            label="Log Bot Messages"
            description="Include messages from bots in message logs"
            checked={false}
          />
          <SwitchField
            label="Log Bulk Deletes"
            description="Log when multiple messages are deleted at once"
            checked={true}
          />
        </FormSection>
      </FormCard>
    </div>
  );
}

/** Automod Feature Config */
function AutomodConfig({
  channels,
  roles,
}: {
  channels: ChannelOption[];
  roles: RoleOption[];
}) {
  return (
    <div class="space-y-6">
      <FormCard
        title="Ignored Roles & Channels"
        description="Exclude certain roles and channels from automod"
      >
        <FormSection>
          <RolePicker
            label="Ignored Roles"
            description="Members with these roles bypass automod"
            roles={roles}
            value=""
          />
          <ChannelPicker
            label="Ignored Channels"
            description="Automod is disabled in these channels"
            channels={channels}
            value=""
          />
        </FormSection>
      </FormCard>

      <FormCard title="Spam Protection" description="Prevent spam and flooding">
        <FormSection>
          <SwitchField
            label="Anti-Spam"
            description="Detect and act on repeated messages"
            checked={true}
          />
          <InputField
            label="Max Messages"
            description="Maximum messages in time window before action"
            value="5"
            type="number"
          />
          <InputField
            label="Time Window (seconds)"
            description="Time window for spam detection"
            value="5"
            type="number"
          />
        </FormSection>
      </FormCard>

      <FormCard title="Content Filters" description="Filter unwanted content">
        <FormSection>
          <SwitchField
            label="Block Invites"
            description="Delete messages containing Discord invite links"
            checked={true}
          />
          <SwitchField
            label="Block Links"
            description="Delete messages containing external links"
            checked={false}
          />
          <SwitchField
            label="Block Mentions"
            description="Limit mass mentions in messages"
            checked={true}
          />
        </FormSection>
      </FormCard>
    </div>
  );
}

/** Ticket Feature Config */
function TicketConfig({
  channels,
  roles,
}: {
  channels: ChannelOption[];
  roles: RoleOption[];
}) {
  return (
    <div class="space-y-6">
      <FormCard title="Ticket Setup" description="Configure the ticket system">
        <FormSection>
          <ChannelPicker
            label="Ticket Category"
            description="Category where ticket channels will be created"
            channels={channels}
            value=""
          />
          <RolePicker
            label="Support Roles"
            description="Roles that can see and respond to tickets"
            roles={roles}
            value=""
          />
          <ChannelPicker
            label="Transcript Channel"
            description="Channel where ticket transcripts are saved"
            channels={channels}
            value=""
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Ticket Panel"
        description="Customize the ticket creation panel"
      >
        <FormSection>
          <InputField
            label="Panel Title"
            description="Title shown on the ticket panel"
            value="Support Tickets"
          />
          <TextAreaField
            label="Panel Description"
            description="Description shown on the ticket panel"
            placeholder="Click the button below to create a support ticket"
            rows={3}
          />
          <ColorPicker
            label="Panel Color"
            description="Color of the ticket panel embed"
            value="#3B82F6"
          />
        </FormSection>
      </FormCard>
    </div>
  );
}

/** Warnings Feature Config */
function WarningsConfig({ roles }: { roles: RoleOption[] }) {
  return (
    <div class="space-y-6">
      <FormCard
        title="Warning Actions"
        description="Automatic actions based on warning count"
      >
        <FormSection>
          <InputField
            label="Warnings for Mute"
            description="Number of warnings before auto-mute"
            value="3"
            type="number"
          />
          <InputField
            label="Warnings for Kick"
            description="Number of warnings before auto-kick"
            value="5"
            type="number"
          />
          <InputField
            label="Warnings for Ban"
            description="Number of warnings before auto-ban"
            value="7"
            type="number"
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Warning Settings"
        description="General warning configuration"
      >
        <FormSection>
          <RolePicker
            label="Muted Role"
            description="Role assigned when a member is muted"
            roles={roles}
            value=""
          />
          <InputField
            label="Warning Expiry (days)"
            description="Days until warnings expire (0 for never)"
            value="30"
            type="number"
          />
          <SwitchField
            label="DM on Warning"
            description="Send a DM to members when they receive a warning"
            checked={true}
          />
        </FormSection>
      </FormCard>
    </div>
  );
}

/** Stats Feature Config */
function StatsConfig({ channels }: { channels: ChannelOption[] }) {
  return (
    <div class="space-y-6">
      <FormCard
        title="Stats Channels"
        description="Voice channels that display server statistics"
      >
        <FormSection>
          <ChannelPicker
            label="Member Count Channel"
            description="Voice channel showing total member count"
            channels={channels}
            value=""
          />
          <ChannelPicker
            label="Bot Count Channel"
            description="Voice channel showing bot count"
            channels={channels}
            value=""
          />
          <ChannelPicker
            label="Online Count Channel"
            description="Voice channel showing online member count"
            channels={channels}
            value=""
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Display Format"
        description="Customize how stats are displayed"
      >
        <FormSection>
          <InputField
            label="Member Count Format"
            description="Use {count} as placeholder for the number"
            value="👥 Members: {count}"
          />
          <InputField label="Bot Count Format" value="🤖 Bots: {count}" />
          <InputField label="Online Count Format" value="🟢 Online: {count}" />
        </FormSection>
      </FormCard>
    </div>
  );
}
