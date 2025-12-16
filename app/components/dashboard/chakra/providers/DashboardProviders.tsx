/** @jsxImportSource react */
'use client';

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/theme/config';
import { queryClient } from '@/api/hooks';
import type { ReactNode } from 'react';

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config?.initialColorMode} />
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ChakraProvider>
    </>
  );
}
