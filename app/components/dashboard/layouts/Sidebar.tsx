/**
 * Sidebar Component
 * Navigation sidebar for dashboard
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { DashSidebarSection } from '@types';

interface SidebarProps {
  sections: DashSidebarSection[];
  header?: any;
  footer?: any;
  className?: string;
}

export const Sidebar: FC<SidebarProps> = ({
  sections,
  header,
  footer,
  className,
}) => {
  return (
    <aside
      class={cn(
        'flex flex-col h-full bg-night-shadow border-r border-night-slate',
        className
      )}
    >
      {/* Sidebar Header */}
      {header && (
        <div class="flex-shrink-0 p-4 border-b border-night-slate">
          {header}
        </div>
      )}

      {/* Sidebar Content */}
      <nav class="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {section.title && (
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                {section.title}
              </h3>
            )}
            <ul class="space-y-1">
              {section.items.map((item) => (
                <li key={item.id}>
                  <SidebarItem
                    href={item.href}
                    icon={item.icon}
                    external={item.external}
                    badge={item.badge}
                  >
                    {item.name}
                  </SidebarItem>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      {footer && (
        <div class="flex-shrink-0 p-4 border-t border-night-slate">
          {footer}
        </div>
      )}
    </aside>
  );
};

interface SidebarItemProps {
  children?: any;
  href: string;
  icon?: string;
  badge?: string | number;
  external?: boolean;
  active?: boolean;
}

export const SidebarItem: FC<SidebarItemProps> = ({
  children,
  href,
  icon,
  badge,
  external = false,
  active = false,
}) => {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      class={cn(
        'flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
        active
          ? 'bg-cyber-blue/10 text-cyber-blue border-l-2 border-cyber-blue'
          : 'text-gray-400 hover:text-pure-white hover:bg-night-steel/50'
      )}
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <span class="iconify w-5 h-5 flex-shrink-0" data-icon={icon} />
        )}
        <span class="truncate">{children}</span>
      </div>
      {badge !== undefined && (
        <span class="flex-shrink-0 px-2 py-0.5 rounded-full bg-cyber-blue/20 text-cyber-blue text-xs font-medium">
          {badge}
        </span>
      )}
      {external && (
        <svg
          class="w-3 h-3 flex-shrink-0 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </a>
  );
};
