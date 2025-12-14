import type { FC } from 'hono/jsx';

interface LucideIconProps {
  name: string;
  class?: string;
  size?: number | string;
}

/**
 * LucideIcon Component
 * ====================
 * Renders Lucide icons via Iconify CDN
 * Using inline SVG with iconify-icon web component fallback
 *
 * Note: For production, consider pre-bundling icons instead of CDN
 */
export const LucideIcon: FC<LucideIconProps> = ({
  name,
  class: className = '',
  size = 24,
}) => {
  // Use iconify-icon web component (loaded via CDN in BaseLayout)
  return (
    <span
      class={`iconify ${className}`}
      data-icon={`lucide:${name}`}
      data-width={size}
      data-height={size}
      style={`display: inline-block; width: ${size}px; height: ${size}px;`}
    />
  );
};
