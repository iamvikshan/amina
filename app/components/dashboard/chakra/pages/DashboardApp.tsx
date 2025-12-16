/** @jsxImportSource react */
'use client';

import { ChakraProvider, ColorModeScript, Box } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/theme/config';
import { queryClient } from '@/api/hooks';
import { DashboardHome } from './DashboardHome';

// Dashboard App - wraps the dashboard pages with Chakra providers
export function DashboardApp() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config?.initialColorMode} />
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <Box minH="100vh" bg="night.900">
            <DashboardHome />
          </Box>
        </QueryClientProvider>
      </ChakraProvider>
    </>
  );
}

export default DashboardApp;
