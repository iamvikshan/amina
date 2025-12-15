/**
 * Card Component
 * Styled container for dashboard content
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { CardVariant } from '@types';

interface CardProps {
  children?: any;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-night-shadow border-night-slate',
  primary: 'bg-night-shadow border-cyber-blue/30',
  active: 'bg-night-shadow border-cyber-blue ring-1 ring-cyber-blue/50',
  danger: 'bg-night-shadow border-discord-red/30',
};

export const Card: FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  onClick,
  hover = false,
}) => {
  return (
    <div
      class={cn(
        'rounded-lg border p-6 transition-all duration-200',
        variantStyles[variant],
        hover &&
          'hover:border-cyber-blue/50 hover:shadow-lg hover:shadow-cyber-blue/10',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: FC<{ children?: any; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div class={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
};

export const CardTitle: FC<{ children?: any; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <h3
      class={cn(
        'text-lg font-heading font-semibold text-pure-white',
        className
      )}
    >
      {children}
    </h3>
  );
};

export const CardDescription: FC<{ children?: any; className?: string }> = ({
  children,
  className,
}) => {
  return <p class={cn('text-sm text-gray-400', className)}>{children}</p>;
};

export const CardContent: FC<{ children?: any; className?: string }> = ({
  children,
  className,
}) => {
  return <div class={cn('', className)}>{children}</div>;
};

export const CardFooter: FC<{ children?: any; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      class={cn(
        'flex items-center justify-end gap-2 mt-4 pt-4 border-t border-night-slate',
        className
      )}
    >
      {children}
    </div>
  );
};
