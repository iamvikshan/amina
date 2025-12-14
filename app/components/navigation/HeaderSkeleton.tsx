import type { FC } from 'hono/jsx';
import { BrandLogo } from '@/components/BrandLogo';

export const HeaderSkeleton: FC = () => {
  return (
    <>
      <header
        class="sticky top-0 inset-x-0 h-14 w-full border-b z-[100000] select-none border-gray-200 dark:border-night-steel/80 bg-white/60 dark:bg-night-black/40 backdrop-blur-md"
        style="isolation: isolate;"
        aria-label="Loading navigation"
      >
        <section class="mx-auto w-full max-w-full md:max-w-screen-xl px-4 md:px-12 lg:px-20 flex items-center justify-between h-full">
          <div class="hidden lg:flex items-center space-x-12 flex-1">
            <div class="flex items-center space-x-2">
              <BrandLogo class="h-8 w-auto opacity-50" />
              <div class="h-5 w-16 rounded bg-slate-200/50 dark:bg-slate-700/50 shimmer" />
            </div>

            <nav class="flex items-center">
              <ul class="flex list-none items-center space-x-1">
                <li>
                  <div class="h-5 w-20 rounded bg-slate-200/50 dark:bg-slate-700/50 shimmer" />
                </li>
                <li>
                  <div class="h-5 w-12 rounded bg-slate-200/50 dark:bg-slate-700/50 shimmer" />
                </li>
              </ul>
            </nav>
          </div>

          <div class="hidden lg:flex items-center gap-x-3">
            <div class="h-8 w-8 rounded-full bg-gradient-to-r from-amina-crimson/20 via-amina-crimson/40 to-amina-crimson/20 shimmer ring-2 ring-cyber-blue/20" />
          </div>

          <div class="flex lg:hidden items-center justify-between w-full px-2">
            <div class="h-8 w-8 rounded-md bg-slate-200/50 dark:bg-slate-700/50 animate-pulse ml-5" />

            <div class="flex items-center gap-x-2">
              <div class="h-7 w-7 rounded-full bg-gradient-to-r from-amina-crimson/20 via-amina-crimson/40 to-amina-crimson/20 shimmer" />
            </div>
          </div>
        </section>
      </header>

      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }

          .shimmer {
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
            position: relative;
            overflow: hidden;
          }

          .shimmer::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(220, 20, 60, 0.1) 50%,
              transparent 100%
            );
            animation: shimmer-glow 1.5s ease-in-out infinite;
          }

          @keyframes shimmer-glow {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          header {
            isolation: isolate;
          }
        `}
      </style>
    </>
  );
};
