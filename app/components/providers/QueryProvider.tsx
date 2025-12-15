/**
 * React Query Provider
 * Wraps the app with QueryClientProvider for data fetching
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000, // 1 minute default
    },
  },
});

interface QueryProviderProps {
  children?: any;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    // @ts-expect-error - React Query types don't match HonoX JSX types
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
