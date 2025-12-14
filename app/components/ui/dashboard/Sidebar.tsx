import type { FC } from 'hono/jsx';
import type { SidebarFooter, SidebarHeader, SidebarSection } from '@types';
import { SidebarIcon } from '@/components/ui/dashboard/SidebarIcon';

interface SidebarProps {
  sections: SidebarSection[];
  header?: SidebarHeader;
  footer?: SidebarFooter;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  class?: string;
}

export const Sidebar: FC<SidebarProps> = ({
  sections,
  header,
  footer,
  collapsible = true,
  defaultCollapsed = false,
  class: className = '',
}) => {
  const xData = `{ 
    collapsed: ${defaultCollapsed ? 'true' : 'false'},
    toggle() { this.collapsed = !this.collapsed }
  }`;

  return (
    <>
      <aside
        x-data={xData}
        x-bind:class="collapsed ? 'w-20' : 'w-72'"
        class={`sidebar-amina flex flex-col transition-all duration-300 ${className}`}
      >
        {collapsible && (
          <button
            x-on:click="toggle"
            x-bind:class="collapsed ? 'right-2' : '-right-3'"
            class="absolute top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border-2 border-night-steel bg-night-shadow text-cyber-blue transition-all duration-300 hover:border-cyber-blue hover:shadow-glow-blue"
            title="Toggle sidebar"
            type="button"
          >
            <svg
              x-show="collapsed"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <svg
              x-show="!collapsed"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {header && (
          <div class="sidebar-header border-b border-night-steel p-6">
            <div class="flex items-center gap-4">
              {header.image ? (
                <div class="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 border-amina-crimson shadow-glow-crimson">
                  <img
                    src={header.image}
                    alt={header.title}
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div class="relative h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-lg border-2 border-amina-crimson shadow-glow-crimson bg-night-steel">
                  <span class="text-xl font-heading font-bold text-amina-crimson">
                    {header.title?.charAt(0) || 'S'}
                  </span>
                </div>
              )}

              <div x-show="!collapsed" class="min-w-0 flex-1">
                <h2 class="truncate font-heading text-lg font-bold text-white">
                  {header.title}
                </h2>
                {header.subtitle && (
                  <p class="truncate text-sm text-gray-400">
                    {header.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <nav class="sidebar-nav flex-1 overflow-y-auto p-4">
          {sections.map((section) => (
            <div class="mb-6">
              {section.title && (
                <h3
                  x-show="!collapsed"
                  class="mb-3 px-3 font-heading text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  {section.title}
                </h3>
              )}

              <ul class="space-y-1">
                {section.items.map((item) => (
                  <li>
                    {item.href ? (
                      <a
                        href={item.href}
                        class={`sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          item.active
                            ? 'bg-amina-crimson/20 text-amina-crimson shadow-glow-crimson'
                            : 'text-gray-300 hover:bg-night-steel hover:text-white'
                        } ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        title={item.label}
                        aria-disabled={item.disabled}
                      >
                        {item.icon && (
                          <span
                            class={`flex-shrink-0 ${
                              item.active
                                ? 'text-amina-crimson'
                                : 'text-gray-400 group-hover:text-cyber-blue'
                            }`}
                          >
                            <SidebarIcon name={item.icon} class="h-5 w-5" />
                          </span>
                        )}

                        <span
                          x-show="!collapsed"
                          class="flex-1 truncate font-medium"
                        >
                          {item.label}
                        </span>

                        {item.badge && (
                          <span
                            x-show="!collapsed"
                            class={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                              item.badgeVariant === 'success'
                                ? 'bg-discord-green/20 text-discord-green'
                                : item.badgeVariant === 'warning'
                                  ? 'bg-imperial-amber/20 text-imperial-amber'
                                  : item.badgeVariant === 'danger'
                                    ? 'bg-amina-blood-red/20 text-amina-rose-red'
                                    : 'bg-cyber-blue/20 text-cyber-blue'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {item.active && (
                          <span
                            x-show="collapsed"
                            class="absolute right-2 h-1.5 w-1.5 rounded-full bg-amina-crimson"
                          />
                        )}
                      </a>
                    ) : (
                      <button
                        type="button"
                        x-on:click={item.onClick}
                        class={`sidebar-item group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          item.active
                            ? 'bg-amina-crimson/20 text-amina-crimson shadow-glow-crimson'
                            : 'text-gray-300 hover:bg-night-steel hover:text-white'
                        } ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        title={item.label}
                        disabled={item.disabled}
                      >
                        {item.icon && (
                          <span
                            class={`flex-shrink-0 ${
                              item.active
                                ? 'text-amina-crimson'
                                : 'text-gray-400 group-hover:text-cyber-blue'
                            }`}
                          >
                            <SidebarIcon name={item.icon} class="h-5 w-5" />
                          </span>
                        )}

                        <span
                          x-show="!collapsed"
                          class="flex-1 truncate text-left font-medium"
                        >
                          {item.label}
                        </span>

                        {item.badge && (
                          <span
                            x-show="!collapsed"
                            class={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                              item.badgeVariant === 'success'
                                ? 'bg-discord-green/20 text-discord-green'
                                : item.badgeVariant === 'warning'
                                  ? 'bg-imperial-amber/20 text-imperial-amber'
                                  : item.badgeVariant === 'danger'
                                    ? 'bg-amina-blood-red/20 text-amina-rose-red'
                                    : 'bg-cyber-blue/20 text-cyber-blue'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div class="sidebar-footer border-t border-night-steel p-4">
          <ul class="space-y-1">
            {header?.backHref && (
              <li>
                <a
                  href={header.backHref}
                  class="sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-300 transition-all duration-200 hover:bg-night-steel hover:text-white"
                  title="Back to Dashboard"
                >
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-cyber-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span x-show="!collapsed" class="flex-1 truncate font-medium">
                    Back to Dashboard
                  </span>
                </a>
              </li>
            )}

            <li>
              <form action="/api/auth/logout" method="post" class="w-full">
                <button
                  type="submit"
                  class="sidebar-item group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-300 transition-all duration-200 hover:bg-night-steel hover:text-white"
                  title="Log Out"
                >
                  <SidebarIcon
                    name="logout"
                    class="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-cyber-blue"
                  />
                  <span
                    x-show="!collapsed"
                    class="flex-1 truncate text-left font-medium"
                  >
                    Log Out
                  </span>
                </button>
              </form>
            </li>

            {footer?.items.map((item) => (
              <li>
                {item.href ? (
                  <a
                    href={item.href}
                    class="sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-300 transition-all duration-200 hover:bg-night-steel hover:text-white"
                    title={item.label}
                  >
                    {item.icon && (
                      <span class="flex-shrink-0 text-gray-400 group-hover:text-cyber-blue">
                        <SidebarIcon name={item.icon} class="h-5 w-5" />
                      </span>
                    )}
                    <span
                      x-show="!collapsed"
                      class="flex-1 truncate font-medium"
                    >
                      {item.label}
                    </span>
                  </a>
                ) : (
                  <button
                    type="button"
                    x-on:click={item.onClick}
                    class="sidebar-item group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-300 transition-all duration-200 hover:bg-night-steel hover:text-white"
                    title={item.label}
                  >
                    {item.icon && (
                      <span class="flex-shrink-0 text-gray-400 group-hover:text-cyber-blue">
                        <SidebarIcon name={item.icon} class="h-5 w-5" />
                      </span>
                    )}
                    <span
                      x-show="!collapsed"
                      class="flex-1 truncate text-left font-medium"
                    >
                      {item.label}
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <style>
        {`
          .sidebar-amina {
            background-color: var(--color-night-shadow);
            border-right: 1px solid var(--color-night-steel);
            height: 100vh;
            position: sticky;
            top: 0;
            overflow-y: auto;
          }

          .sidebar-nav::-webkit-scrollbar {
            width: 4px;
          }

          .sidebar-nav::-webkit-scrollbar-track {
            background-color: var(--color-night-black);
          }

          .sidebar-nav::-webkit-scrollbar-thumb {
            background-color: var(--color-night-steel);
            border-radius: 9999px;
          }

          .sidebar-nav::-webkit-scrollbar-thumb:hover {
            background-color: var(--color-night-slate);
          }

          .sidebar-item[aria-current='page'],
          .sidebar-item.active {
            position: relative;
          }

          .sidebar-item[aria-current='page']::before,
          .sidebar-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 70%;
            background: var(--color-amina-crimson);
            border-radius: 0 4px 4px 0;
          }

          [x-cloak] {
            display: none;
          }

          @media (max-width: 768px) {
            .sidebar-amina {
              position: fixed;
              left: 0;
              top: 0;
              height: 100vh;
              z-index: 40;
              transform: translateX(-100%);
              transition: transform 0.3s ease;
            }

            .sidebar-amina.mobile-open {
              transform: translateX(0);
            }
          }
        `}
      </style>
    </>
  );
};
