/**
 * Loading Panel Component
 * Display loading state with spinner
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { LoadingPanelProps } from '@types';

export const LoadingPanel: FC<LoadingPanelProps> = ({
  message = 'Loading...',
  className,
}) => {
  return (
    <div
      class={cn('flex flex-col items-center justify-center py-12', className)}
    >
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue mb-4" />
      <p class="text-gray-400 text-sm">{message}</p>
    </div>
  );
};
