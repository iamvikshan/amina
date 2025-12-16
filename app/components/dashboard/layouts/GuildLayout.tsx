/**
 * GuildLayout Component
 * Layout wrapper for guild-specific pages
 * Based on reference: .reference/frontend/src/components/layout/guild/
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { BaseLayout } from '@components/layouts/BaseLayout';
import { AppLayout } from './AppLayout';
import { Sidebar, SidebarItem } from './Sidebar';
import { Navbar } from './Navbar';
import { GuildBanner, GuildHeaderCompact } from './GuildBanner';
import { getAllFeatures } from '@/config/features';
import type { BreadcrumbItem, DashSidebarSection } from '@types';

interface GuildLayoutProps {
  /** Guild ID */
  guildId: string;
  /** Guild data (optional - for displaying name/icon) */
  guild?: {
    name: string;
    icon?: string | null;
    banner?: string | null;
    memberCount?: number;
  };
  /** Enabled feature IDs */
  enabledFeatures?: string[];
  /** Currently active page/feature */
  activeId?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Whether to show the guild banner */
  showBanner?: boolean;
  /** Navbar actions slot */
  navbarActions?: any;
  /** Page content */
  children?: any;
  /** Additional className for content area */
  className?: string;
}

/**
 * Build sidebar sections for guild pages
 */
function buildGuildSidebar(
  guildId: string,
  guildName: string = 'Guild',
  enabledFeatures: string[] = [],
  activeId?: string
): DashSidebarSection[] {
  const features = getAllFeatures();

  return [
    // Guild navigation header (compact)
    {
      items: [
        {
          id: 'overview',
          name: 'Overview',
          href: `/dash/guild/${guildId}`,
          icon: 'lucide:layout-dashboard',
          active: activeId === 'overview' || !activeId,
        },
        {
          id: 'settings',
          name: 'Settings',
          href: `/dash/guild/${guildId}/settings`,
          icon: 'lucide:settings',
          active: activeId === 'settings',
        },
      ],
    },
    // Features section
    {
      title: 'Features',
      items: features.map((feature) => ({
        id: feature.id,
        name: feature.name,
        href: `/dash/guild/${guildId}/features/${feature.id}`,
        icon: feature.icon,
        active: activeId === feature.id,
        badge: enabledFeatures.includes(feature.id) ? '●' : undefined,
      })),
    },
    // Navigation
    {
      title: 'Navigation',
      items: [
        {
          id: 'back',
          name: 'All Servers',
          href: '/dash',
          icon: 'lucide:arrow-left',
        },
      ],
    },
  ];
}

export const GuildLayout: FC<GuildLayoutProps> = ({
  guildId,
  guild,
  enabledFeatures = [],
  activeId,
  breadcrumbs,
  showBanner = true,
  navbarActions,
  children,
  className,
}) => {
  const guildName = guild?.name || 'Guild';

  // Build sidebar with guild header
  const sidebarSections = buildGuildSidebar(
    guildId,
    guildName,
    enabledFeatures,
    activeId
  );

  // Build breadcrumbs if not provided
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dash' },
    { label: guildName, href: `/dash/guild/${guildId}` },
  ];

  const sidebar = (
    <Sidebar
      sections={sidebarSections}
      header={
        guild && (
          <GuildHeaderCompact
            guildId={guildId}
            name={guildName}
            icon={guild.icon}
          />
        )
      }
    />
  );

  const pageTitle = `${guildName} - Amina Dashboard`;

  return (
    <BaseLayout title={pageTitle}>
      <AppLayout sidebar={sidebar}>
        {/* Navbar */}
        <div class="bg-night-shadow/50 border-b border-night-slate">
          <Navbar
            breadcrumbs={breadcrumbs || defaultBreadcrumbs}
            actions={navbarActions}
          />
        </div>

        {/* Content Area */}
        <div class={cn('max-w-7xl mx-auto p-6 md:p-8', className)}>
          {/* Guild Banner */}
          {showBanner && guild && (
            <div class="mb-6">
              <GuildBanner
                guildId={guildId}
                name={guildName}
                icon={guild.icon}
                banner={guild.banner}
                memberCount={guild.memberCount}
              />
            </div>
          )}

          {/* Page Content */}
          {children}
        </div>
      </AppLayout>
    </BaseLayout>
  );
};

/**
 * GuildPageHeader - Simple header for guild sub-pages
 * For use when GuildBanner is not shown
 */
export const GuildPageHeader: FC<{
  title: string;
  description?: string;
  icon?: any;
  actions?: any;
  className?: string;
}> = ({ title, description, icon, actions, className }) => {
  return (
    <div class={cn('mb-8', className)}>
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          {icon && (
            <div class="w-12 h-12 rounded-xl bg-cyber-blue/10 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 class="text-3xl font-heading font-bold text-pure-white">
              {title}
            </h1>
            {description && <p class="text-gray-400 mt-1">{description}</p>}
          </div>
        </div>
        {actions && <div class="shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
