/**
 * Feature Card Component
 * Displays a feature with enable/disable toggle and configure button
 * Based on reference: .reference/frontend/src/components/feature/FeatureItem.tsx
 */

import type { FeatureConfig } from '@types';

interface FeatureCardProps {
  feature: FeatureConfig;
  enabled: boolean;
  guildId: string;
  onToggle?: (enabled: boolean) => void;
}

export function FeatureCard({
  feature,
  enabled,
  guildId,
  onToggle,
}: FeatureCardProps) {
  const handleToggle = () => {
    if (onToggle) {
      onToggle(!enabled);
    }
  };

  return (
    <div class="bg-surface-elevated rounded-xl p-6 border border-border hover:border-accent-primary/30 transition-all group">
      {/* Header */}
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-4">
          {/* Icon */}
          <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span class="iconify w-6 h-6 text-white" data-icon={feature.icon} />
          </div>

          {/* Title */}
          <div>
            <h3 class="text-lg font-semibold text-text-primary mb-1">
              {feature.name}
            </h3>
            {enabled && (
              <span class="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full border border-success/20">
                Enabled
              </span>
            )}
          </div>
        </div>

        {/* Toggle */}
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onchange={handleToggle}
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-surface-base peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
        </label>
      </div>

      {/* Description */}
      <p class="text-sm text-text-secondary mb-4">{feature.description}</p>

      {/* Actions */}
      <div class="flex items-center gap-3">
        <a
          href={`/dash/guild/${guildId}/features/${feature.id}`}
          class={`
            flex-1 px-4 py-2 rounded-lg font-medium text-center transition-colors
            ${
              enabled
                ? 'bg-accent-primary hover:bg-accent-primary/90 text-white'
                : 'bg-surface-base hover:bg-surface-elevated text-text-secondary border border-border'
            }
          `}
        >
          {enabled ? 'Configure' : 'Enable to Configure'}
        </a>

        {enabled && (
          <button
            class="px-4 py-2 bg-surface-base hover:bg-surface-elevated text-text-primary rounded-lg border border-border transition-colors"
            onclick={() => {
              alert('View settings coming soon');
            }}
          >
            <span class="iconify w-5 h-5" data-icon="lucide:settings" />
          </button>
        )}
      </div>
    </div>
  );
}
