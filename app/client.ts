// Client-side hydration bootstrap for HonoX
// This file will be used for interactive islands hydration

import { createClient } from 'honox/client';

// Import global CSS - this gets processed by Vite/PostCSS (Tailwind v4)
import '@styles/global.css';

// Import Preline components for dashboard interactivity
import '@preline/overlay';
import '@preline/dropdown';
import '@preline/collapse';
import '@preline/accordion';
import '@preline/tabs';

// Initialize Preline after DOM loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // @ts-ignore - Preline adds HSStaticMethods to window
    if (window.HSStaticMethods) {
      // @ts-ignore
      window.HSStaticMethods.autoInit();
    }
  });
}

createClient();
