/**
 * Guild Overview Page
 * Route: /dash/guild/:guildId
 * Shows guild info and feature cards
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
import { getAllFeatures } from '@/config/features';
import type { FeatureConfig, BreadcrumbItem } from '@types';

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

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dash' },
    { label: guild.name, href: `/dash/guild/${guildId}` },
  ];

  return c.render(
    <GuildLayout
      guildId={guildId}
      guild={guild}
      enabledFeatures={enabledFeatures}
      activeId="overview"
      breadcrumbs={breadcrumbs}
      showBanner={true}
    >
      {/* Features Section */}
      <section>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-heading font-bold text-pure-white">
              Features
            </h2>
            <p class="text-gray-400 text-sm mt-1">
              Configure bot features for your server
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <span class="w-2 h-2 rounded-full bg-discord-green" />
            {enabledFeatures.length} enabled
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getAllFeatures().map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              guildId={guildId}
              enabled={enabledFeatures.includes(feature.id)}
            />
          ))}
        </div>
      </section>

      {/* Quick Stats Section */}
      <section class="mt-8">
        <h2 class="text-xl font-heading font-bold text-pure-white mb-4">
          Quick Stats
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Members"
            value={guild.memberCount.toLocaleString()}
            icon="lucide:users"
          />
          <StatCard
            label="Features"
            value={enabledFeatures.length.toString()}
            icon="lucide:puzzle"
          />
          <StatCard
            label="Commands Used"
            value="12.5K"
            icon="lucide:terminal"
          />
          <StatCard
            label="Messages"
            value="45.2K"
            icon="lucide:message-circle"
          />
        </div>
      </section>
    </GuildLayout>
  );
});

/** Feature Card Component */
function FeatureCard({
  feature,
  guildId,
  enabled,
}: {
  feature: FeatureConfig;
  guildId: string;
  enabled: boolean;
}) {
  return (
    <a href={`/dash/guild/${guildId}/features/${feature.id}`}>
      <Card hover className="h-full group">
        <CardHeader>
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-cyber-blue/10 flex items-center justify-center group-hover:bg-cyber-blue/20 transition-colors">
              <span
                class="iconify w-5 h-5 text-cyber-blue"
                data-icon={feature.icon}
              />
            </div>
            <Badge variant={enabled ? 'success' : 'default'}>
              {enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <CardTitle className="text-base">{feature.name}</CardTitle>
          <CardDescription className="text-sm line-clamp-2">
            {feature.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-2 text-xs text-gray-500 group-hover:text-cyber-blue transition-colors">
            <span class="iconify w-4 h-4" data-icon="lucide:settings-2" />
            <span>Configure</span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

/** Stat Card Component */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <Card className="p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-night-steel flex items-center justify-center">
          <span class="iconify w-5 h-5 text-gray-400" data-icon={icon} />
        </div>
        <div>
          <p class="text-2xl font-bold text-pure-white">{value}</p>
          <p class="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}
