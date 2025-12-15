/**
 * Separator Component
 * Visual divider for content sections
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator: FC<SeparatorProps> = ({
  orientation = 'horizontal',
  className,
}) => {
  return (
    <div
      class={cn(
        'bg-night-slate',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className
      )}
    />
  );
};
