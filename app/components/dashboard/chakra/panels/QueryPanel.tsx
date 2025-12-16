/** @jsxImportSource react */
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorPanel } from './ErrorPanel';

export function QueryStatus({
  query,
  error,
  loading,
  children,
}: {
  query: UseQueryResult;
  error: string;
  /**
   * Element to display when loading
   */
  loading: ReactNode;
  children: ReactNode;
}) {
  if (query.isError)
    return <ErrorPanel retry={() => query.refetch()}>{error}</ErrorPanel>;
  if (query.isLoading) return <>{loading}</>;
  if (query.isSuccess) return <>{children}</>;

  return <></>;
}
