/**
 * Error Panel Component
 * Display error message with retry option
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { Button } from '@/components/dashboard/ui/Button';
import type { ErrorPanelProps } from '@types';

export const ErrorPanel: FC<ErrorPanelProps> = ({
  error,
  retry,
  className,
}) => {
  const errorMessage =
    typeof error === 'string' ? error : error.message || 'An error occurred';

  return (
    <div
      class={cn('flex flex-col items-center justify-center py-12', className)}
    >
      <div class="text-center max-w-md">
        <div class="mb-4">
          <svg
            class="mx-auto h-12 w-12 text-discord-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-heading font-semibold text-pure-white mb-2">
          Something went wrong
        </h3>
        <p class="text-sm text-gray-400 mb-6">{errorMessage}</p>
        {retry && (
          <Button onClick={retry} variant="primary">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};
