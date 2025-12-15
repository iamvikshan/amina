/**
 * AppLayout Component
 * Main dashboard layout with sidebar and content area
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { AppLayoutProps } from '@types';

export const AppLayout: FC<AppLayoutProps> = ({ children, sidebar }) => {
  return (
    <div class="flex h-screen bg-night-black overflow-hidden">
      {/* Sidebar - Desktop */}
      {sidebar && (
        <div class="hidden lg:flex lg:flex-shrink-0 w-72">{sidebar}</div>
      )}

      {/* Main Content Area */}
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Content */}
        <div class="flex-1 overflow-y-auto">{children}</div>
      </main>

      {/* Mobile Sidebar Drawer */}
      {sidebar && <MobileSidebarDrawer>{sidebar}</MobileSidebarDrawer>}
    </div>
  );
};

/**
 * Mobile Sidebar Drawer
 * Toggleable sidebar for mobile devices
 */
const MobileSidebarDrawer: FC<{ children?: any }> = ({ children }) => {
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        class="lg:hidden fixed bottom-4 right-4 z-50 p-3 rounded-full bg-amina-crimson text-white shadow-lg hover:bg-amina-rose-red transition-all duration-200 hover:scale-110"
        data-hs-overlay="#mobile-sidebar"
        aria-controls="mobile-sidebar"
        aria-label="Toggle sidebar"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay Sidebar */}
      <div
        id="mobile-sidebar"
        class="hs-overlay hidden fixed inset-0 z-60 lg:hidden"
        aria-labelledby="mobile-sidebar-label"
      >
        {/* Backdrop */}
        <div class="hs-overlay-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Sidebar Panel */}
        <div class="hs-overlay-panel absolute inset-y-0 left-0 w-80 max-w-[85vw] transform -translate-x-full transition-transform duration-300 ease-in-out">
          <div class="flex flex-col h-full bg-night-shadow shadow-2xl">
            {/* Close Button */}
            <div class="flex items-center justify-between p-4 border-b border-night-slate">
              <h2
                id="mobile-sidebar-label"
                class="text-lg font-heading font-semibold text-pure-white"
              >
                Menu
              </h2>
              <button
                type="button"
                class="p-2 rounded-md text-gray-400 hover:text-pure-white hover:bg-night-steel/50 transition-colors"
                data-hs-overlay="#mobile-sidebar"
                aria-label="Close sidebar"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Sidebar Content */}
            <div class="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};
