/**
 * Badge Component
 * Status indicators and labels
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { BadgeVariant } from '@types';

interface BadgeProps {
  children?: any;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-night-steel text-gray-300 border-night-slate',
  success: 'bg-discord-green/10 text-discord-green border-discord-green/20',
  warning: 'bg-imperial-gold/10 text-imperial-gold border-imperial-gold/20',
  danger: 'bg-discord-red/10 text-discord-red border-discord-red/20',
  info: 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue/20',
};

export const Badge: FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  return (
    <span
      class={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
