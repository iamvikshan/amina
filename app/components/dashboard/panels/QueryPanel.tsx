/**
 * Query Panel Component
 * Wrapper for React Query results with loading and error states
 */

import type { FC } from 'hono/jsx';
import { LoadingPanel } from './LoadingPanel';
import { ErrorPanel } from './ErrorPanel';
import type { PanelProps } from '@types';

interface QueryPanelProps extends PanelProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  retry?: () => void;
  loadingMessage?: string;
}

export const QueryPanel: FC<QueryPanelProps> = ({
  children,
  isLoading,
  isError,
  error,
  retry,
  loadingMessage,
  className,
}) => {
  if (isLoading) {
    return <LoadingPanel message={loadingMessage} className={className} />;
  }

  if (isError && error) {
    return <ErrorPanel error={error} retry={retry} className={className} />;
  }

  return <div class={className}>{children}</div>;
};
