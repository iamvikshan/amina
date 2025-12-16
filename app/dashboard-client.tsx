/** @jsxImportSource react */
// Dashboard client-side entry point
// This is loaded on dashboard pages for Chakra UI

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/theme/config';
import { queryClient } from '@/api/hooks';

// Dashboard components
import { DashboardHome } from '@/components/dashboard/chakra/pages/DashboardHome';

// Get the component to render based on data attribute
function getComponent(name: string) {
  const components: Record<string, React.ComponentType> = {
    'dashboard-home': DashboardHome,
  };
  return components[name] || null;
}

// Initialize dashboard when DOM is ready
function initDashboard() {
  const rootEl = document.getElementById('dashboard-root');
  if (!rootEl) return;

  const componentName = rootEl.dataset.component || 'dashboard-home';
  const Component = getComponent(componentName);

  if (!Component) {
    console.error(`Unknown dashboard component: ${componentName}`);
    return;
  }

  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

export { initDashboard };
