/**
 * Feature Grid Component
 * Grid layout for displaying feature cards
 */

import { FeatureCard } from './FeatureCard';
import type { FeatureConfig } from '@types';

interface FeatureGridProps {
  features: FeatureConfig[];
  enabledFeatures: string[];
  guildId: string;
  onToggleFeature?: (featureId: string, enabled: boolean) => void;
}

export function FeatureGrid({
  features,
  enabledFeatures,
  guildId,
  onToggleFeature,
}: FeatureGridProps) {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          enabled={enabledFeatures.includes(feature.id)}
          guildId={guildId}
          onToggle={(enabled) => onToggleFeature?.(feature.id, enabled)}
        />
      ))}
    </div>
  );
}
