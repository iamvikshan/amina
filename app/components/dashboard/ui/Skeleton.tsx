/**
 * Skeleton Component
 * Loading placeholder for content
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton: FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
}) => {
  const baseStyles = 'animate-pulse bg-night-steel/50';

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      class={cn(baseStyles, variantStyles[variant], className)}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
    />
  );
};

/** Skeleton variants for common use cases */
export const SkeletonText: FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => {
  return (
    <div class={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      class={cn(
        'p-6 bg-night-shadow rounded-lg border border-night-slate',
        className
      )}
    >
      <div class="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div class="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="w-3/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};
