/**
 * Feature Configuration
 * Defines all available dashboard features and their metadata
 */

import type { FeatureConfig, FeatureId } from '@types';

/** All available features with metadata */
export const features: Record<FeatureId, FeatureConfig> = {
  welcome: {
    id: 'welcome',
    name: 'Welcome Messages',
    description: 'Send customizable messages when new members join your server',
    icon: 'lucide:user-plus',
  },
  farewell: {
    id: 'farewell',
    name: 'Farewell Messages',
    description: 'Send messages when members leave your server',
    icon: 'lucide:user-minus',
  },
  logging: {
    id: 'logging',
    name: 'Server Logging',
    description:
      'Track server events like message edits, deletions, and role changes',
    icon: 'lucide:file-text',
  },
  automod: {
    id: 'automod',
    name: 'Auto Moderation',
    description:
      'Automatically moderate spam, invites, links, and other unwanted content',
    icon: 'lucide:shield',
  },
  ticket: {
    id: 'ticket',
    name: 'Support Tickets',
    description: 'Let members create private support tickets with staff',
    icon: 'lucide:ticket',
  },
  warnings: {
    id: 'warnings',
    name: 'Warning System',
    description: 'Issue warnings to members and take action after a threshold',
    icon: 'lucide:alert-triangle',
  },
  stats: {
    id: 'stats',
    name: 'Stats & Leveling',
    description: 'Track member activity and reward engagement with levels',
    icon: 'lucide:bar-chart',
  },
};

/** Get feature by ID */
export function getFeature(id: FeatureId): FeatureConfig | undefined {
  return features[id];
}

/** Get all features as array */
export function getAllFeatures(): FeatureConfig[] {
  return Object.values(features);
}

/** Check if feature ID is valid */
export function isValidFeature(id: string): id is FeatureId {
  return id in features;
}
