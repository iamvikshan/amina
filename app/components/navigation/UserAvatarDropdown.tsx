import type { FC } from 'hono/jsx';
import type { DiscordUser } from '@types';
import { URLS } from '@config/site';
import { Avatar } from '@components/ui/avatars/Avatar';
import { LucideIcon } from '@components/ui/icons/LucideIcon';

interface UserAvatarDropdownProps {
  userData: DiscordUser;
  avatarUrl: string;
  showPresence?: boolean;
  presence?: 'online' | 'idle' | 'dnd' | 'offline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  guardianRank?: string;
  currentPath?: string;
}

export const UserAvatarDropdown: FC<UserAvatarDropdownProps> = ({
  userData,
  avatarUrl,
  showPresence = true,
  presence = 'online',
  size = 'md',
  guardianRank,
  currentPath = '/',
}) => {
  const script = `
    const avatarButton = document.getElementById('userAvatarButton');
    const dropdown = document.getElementById('userAvatarDropdown');

    function toggleDropdown() {
      dropdown?.classList.toggle('hidden');
      const isOpen = !dropdown?.classList.contains('hidden');
      avatarButton?.setAttribute('aria-expanded', String(isOpen));
    }

    function closeDropdown() {
      dropdown?.classList.add('hidden');
      avatarButton?.setAttribute('aria-expanded', 'false');
    }

    avatarButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    document.addEventListener('click', (e) => {
      const target = e.target;
      const isClickInside =
        avatarButton?.contains(target) || dropdown?.contains(target);

      if (!isClickInside) closeDropdown();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdown();
    });

    const themeToggleButton = document.getElementById('themeToggleButton');
    themeToggleButton?.addEventListener('click', (e) => {
      e.stopPropagation();

      const htmlElement = document.documentElement;
      const isDark = htmlElement.classList.contains('dark');

      if (isDark) {
        htmlElement.classList.remove('dark');
        localStorage.setItem('hs_theme', 'default');
      } else {
        htmlElement.classList.add('dark');
        localStorage.setItem('hs_theme', 'dark');
      }

      window.dispatchEvent(
        new CustomEvent('on-hs-appearance-change', {
          detail: isDark ? 'default' : 'dark',
        })
      );
    });

    const cookiePreferencesButton = document.getElementById('cookiePreferencesButton');
    cookiePreferencesButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      alert(
        'Cookie preferences coming soon!\n\nThis site uses essential cookies for authentication and session management. If you do not wish to aloow cookies for Amina, simply log out'
      );
    });

    const logoutButton = document.getElementById('logoutButton');
    logoutButton?.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Logout failed:', error);
      }
    });
  `;

  return (
    <>
      <div class="relative user-avatar-dropdown">
        <button
          id="userAvatarButton"
          type="button"
          class="flex items-center gap-2 rounded-full ring-2 ring-cyber-blue/50 hover:ring-cyber-blue focus:ring-cyber-blue focus:outline-none transition-all duration-200 hover:scale-105"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <Avatar
            src={avatarUrl}
            alt={userData.global_name || userData.username}
            size={size}
            presence={presence}
            showPresence={showPresence}
          />
        </button>

        <div
          id="userAvatarDropdown"
          class="hidden absolute right-0 mt-3 w-72 z-[9999] animate-dropdown"
        >
          <div class="liquid-glass-dropdown rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div class="liquid-glass-header px-4 py-4">
              <div class="flex items-center gap-3">
                <Avatar
                  src={avatarUrl}
                  alt={userData.global_name || userData.username}
                  size="lg"
                  presence={presence}
                  showPresence={showPresence}
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {userData.global_name || userData.username}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{userData.username}
                  </p>

                  {guardianRank && (
                    <div class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-cyber-blue/10 dark:bg-cyber-blue/20 border border-cyber-blue/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        class="text-cyber-blue"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                      <span class="text-xs font-medium text-cyber-blue">
                        {guardianRank}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div class="py-1.5 px-2">
              <a
                href="/user"
                class="liquid-glass-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                <div class="flex items-center justify-center w-7 h-7 rounded-md bg-cyber-blue/10 dark:bg-cyber-blue/20">
                  <LucideIcon name="user" class="text-cyber-blue" size={16} />
                </div>
                <span>Profile</span>
              </a>

              {!currentPath.includes('/dash') && (
                <a
                  href="/dash"
                  class="liquid-glass-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
                >
                  <div class="flex items-center justify-center w-7 h-7 rounded-md bg-imperial-gold/10 dark:bg-imperial-gold/20">
                    <LucideIcon
                      name="shield"
                      class="text-imperial-gold"
                      size={16}
                    />
                  </div>
                  <span>Dashboard</span>
                </a>
              )}

              <button
                type="button"
                id="cookiePreferencesButton"
                class="liquid-glass-item flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                <div class="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/10 dark:bg-amber-500/20">
                  <LucideIcon
                    name="cookie"
                    class="text-amber-600 dark:text-amber-400"
                    size={16}
                  />
                </div>
                <span>Cookies</span>
              </button>

              <div class="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-night-steel to-transparent my-2" />

              <button
                type="button"
                id="themeToggleButton"
                class="liquid-glass-item flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                <div class="flex items-center justify-center w-7 h-7 rounded-md bg-purple-500/10 dark:bg-amber-500/20">
                  <span class="dark:hidden">
                    <LucideIcon name="moon" class="text-purple-600" size={16} />
                  </span>
                  <span class="hidden dark:block">
                    <LucideIcon
                      name="sun"
                      class="text-amber-500 dark:text-amber-400"
                      size={16}
                    />
                  </span>
                </div>
                <span>Theme</span>
              </button>

              <a
                href={URLS.docs}
                rel="noopener noreferrer"
                target="_blank"
                class="liquid-glass-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                <div class="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/10 dark:bg-blue-500/20">
                  <LucideIcon
                    name="external-link"
                    class="text-blue-500 dark:text-blue-400"
                    size={16}
                  />
                </div>
                <span>Documentation</span>
              </a>

              <a
                href={URLS.support}
                rel="noopener noreferrer"
                target="_blank"
                class="liquid-glass-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                <div class="flex items-center justify-center w-7 h-7 rounded-md bg-green-500/10 dark:bg-green-500/20">
                  <LucideIcon
                    name="help-circle"
                    class="text-green-500 dark:text-green-400"
                    size={16}
                  />
                </div>
                <span>Support</span>
              </a>

              <div class="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-night-steel to-transparent my-2" />

              <button
                id="logoutButton"
                type="button"
                class="liquid-glass-item flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-amina-crimson dark:text-amina-rose-red transition-all duration-200"
              >
                <div class="flex items-center justify-center w-7 h-7 rounded-md bg-amina-crimson/10 dark:bg-amina-crimson/20">
                  <LucideIcon name="log-out" size={16} />
                </div>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .liquid-glass-dropdown {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow:
              0 0 0 1px rgba(0, 0, 0, 0.04),
              0 8px 32px rgba(0, 0, 0, 0.12),
              0 0 1px rgba(255, 255, 255, 0.8) inset;
          }

          .dark .liquid-glass-dropdown {
            background: rgba(10, 10, 10, 0.72);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.06),
              0 8px 32px rgba(0, 0, 0, 0.4),
              0 0 1px rgba(255, 255, 255, 0.1) inset;
          }

          .liquid-glass-header {
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0) 100%
            );
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          }

          .dark .liquid-glass-header {
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.05) 0%,
              rgba(255, 255, 255, 0) 100%
            );
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .liquid-glass-item {
            position: relative;
            cursor: pointer;
            overflow: hidden;
          }

          .liquid-glass-item::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              135deg,
              rgba(30, 144, 255, 0.05) 0%,
              rgba(220, 20, 60, 0.05) 100%
            );
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: inherit;
          }

          .liquid-glass-item:hover::before {
            opacity: 1;
          }

          .liquid-glass-item:hover {
            background: rgba(30, 144, 255, 0.08);
            transform: translateX(2px);
          }

          .dark .liquid-glass-item:hover {
            background: rgba(30, 144, 255, 0.15);
          }

          .liquid-glass-item::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            transition: left 0.5s ease;
          }

          .liquid-glass-item:hover::after {
            left: 100%;
          }

          @keyframes dropdown {
            from {
              opacity: 0;
              transform: translateY(-12px) scale(0.95);
              filter: blur(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          .animate-dropdown {
            animation: dropdown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .user-avatar-dropdown button:hover {
            filter: drop-shadow(0 0 8px rgba(30, 144, 255, 0.4));
          }

          .liquid-glass-item,
          .liquid-glass-item > * {
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
        `}
      </style>

      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
};
