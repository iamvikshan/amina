import type { FC } from 'hono/jsx';
import { ThemeIcon } from '@components/ThemeIcon';
import { BrandLogo } from '@components/BrandLogo';
import { LoginBtn } from '@components/ui/buttons/LoginBtn';
import { getAvatarUrl } from '@lib/data-utils';
import type { DiscordUser } from '@types';

interface HeaderProps {
  userData?: DiscordUser | null;
  isDashboardPage?: boolean;
  managedGuildsCount?: number;
  guardianRankLabel?: string;
}

export const Header: FC<HeaderProps> = ({
  userData,
  isDashboardPage = false,
  managedGuildsCount,
  guardianRankLabel,
}) => {
  const isAuthenticated = !!userData;
  const homeUrl = '/';

  const links = isDashboardPage
    ? []
    : [
        { name: 'Dashboard', url: '/dash' },
        { name: 'Docs', url: 'https://docs.4mina.app', target: '_blank' },
      ];

  const avatarUrl = userData ? getAvatarUrl(userData) : '';
  const rankText =
    guardianRankLabel ||
    (typeof managedGuildsCount === 'number'
      ? `Lv${managedGuildsCount} Guardian`
      : undefined);

  return (
    <>
      <header
        class="sticky top-0 inset-x-0 h-14 w-full border-b z-100000 select-none border-gray-200 dark:border-night-steel/80 bg-white/60 dark:bg-night-black/40 backdrop-blur-md header-fade-in"
        style="isolation: isolate;"
      >
        <section class="mx-auto w-full max-w-full md:max-w-7xl px-4 md:px-12 lg:px-20 flex items-center justify-between h-full">
          <div class="hidden lg:flex items-center space-x-12 flex-1">
            <a class="flex items-center space-x-2" href={homeUrl}>
              <span class="flex items-center space-x-2">
                <BrandLogo class="h-8 w-auto" />
                <span
                  class="text-lg font-bold font-heading leading-none! inline-block text-white hover:text-amina-crimson transition-colors"
                  style="margin-top:4px"
                >
                  Amina
                </span>
              </span>
            </a>

            {links.length > 0 && (
              <nav aria-label="Main" class="flex items-center mt-1">
                <ul class="group flex list-none items-center space-x-1">
                  {links.map((link) => (
                    <li>
                      <a
                        href={link.url}
                        target={link.target}
                        class="group inline-flex h-8 w-max items-center justify-center rounded-md bg-transparent px-4 py text-sm font-medium transition-colors text-neutral-400 hover:text-amina-crimson focus:text-amina-crimson focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          <div class="hidden lg:flex items-center">
            {isAuthenticated && userData ? (
              <div class="flex items-center gap-x-3">
                <a
                  href="/dash"
                  class="flex items-center gap-2 rounded-full ring-2 ring-cyber-blue/50 hover:ring-cyber-blue focus:ring-cyber-blue focus:outline-none transition-all duration-200 hover:scale-105"
                  aria-label="Open dashboard"
                >
                  <img
                    src={avatarUrl}
                    alt={userData.global_name || userData.username}
                    class="h-8 w-8 rounded-full"
                    loading="lazy"
                  />
                </a>
                {rankText ? (
                  <span class="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyber-blue/10 dark:bg-cyber-blue/20 border border-cyber-blue/20">
                    <span class="text-xs font-medium text-cyber-blue">
                      {rankText}
                    </span>
                  </span>
                ) : null}
              </div>
            ) : (
              <>
                <span class="mt-1 mr-4">
                  <ThemeIcon />
                </span>
                <LoginBtn />
              </>
            )}
          </div>

          <div class="flex lg:hidden items-center justify-between w-full px-2">
            <button
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amina-crimson focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 transition-all hover:bg-night-shadow hover:text-amina-crimson h-8 w-8 ml-5"
              type="button"
              data-hs-collapse="#navbar-mobile-menu"
              aria-controls="navbar-mobile-menu"
              aria-label="Toggle navigation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                class="lucide lucide-menu w-5 h-5 hs-collapse-open:hidden"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                class="lucide lucide-x w-5 h-5 hidden hs-collapse-open:block"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <div class="flex items-center gap-x-2">
              {isAuthenticated && userData ? (
                <a
                  href="/dash"
                  class="flex items-center gap-2 rounded-full ring-2 ring-cyber-blue/50 hover:ring-cyber-blue focus:ring-cyber-blue focus:outline-none transition-all duration-200 hover:scale-105"
                  aria-label="Open dashboard"
                >
                  <img
                    src={avatarUrl}
                    alt={userData.global_name || userData.username}
                    class="h-7 w-7 rounded-full"
                    loading="lazy"
                  />
                </a>
              ) : (
                <>
                  <ThemeIcon />
                  <LoginBtn />
                </>
              )}
            </div>
          </div>
        </section>

        <div
          id="navbar-mobile-menu"
          class="hs-collapse hidden w-full overflow-hidden transition-all duration-300 lg:hidden"
        >
          <div class="border-t border-night-steel/80 bg-night-shadow/95 backdrop-blur-md">
            <nav class="flex flex-col space-y-1 px-4 py-4">
              {links.map((link) => (
                <a
                  href={link.url}
                  target={link.target}
                  class="px-4 py-3 rounded-md text-sm font-medium text-neutral-400 hover:text-amina-crimson hover:bg-night-black/60 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .header-fade-in {
            animation: fadeIn 0.4s ease-out;
          }

          header button:hover {
            box-shadow: 0 0 15px rgba(220, 20, 60, 0.4);
          }

          nav a:hover {
            text-shadow: 0 0 8px rgba(220, 20, 60, 0.6);
          }

          nav a[aria-current='page'] {
            color: #dc143c;
            position: relative;
          }

          nav a[aria-current='page']::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #dc143c 0%, #e63946 100%);
            box-shadow: 0 0 8px rgba(220, 20, 60, 0.6);
          }

          header button:active {
            transform: scale(0.95);
          }

          #navbar-mobile-menu {
            transform-origin: top;
          }

          #navbar-mobile-menu.hs-collapse-open {
            animation: slideDown 0.3s ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          header {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }

          header a[href='/']:hover {
            filter: drop-shadow(0 0 8px rgba(220, 20, 60, 0.5));
          }

          #navbar-mobile-menu nav a {
            transition: all 0.2s ease;
          }

          #navbar-mobile-menu nav a:hover {
            transform: translateX(4px);
            border-left: 2px solid #dc143c;
            padding-left: 1rem;
          }
        `}
      </style>
    </>
  );
};
