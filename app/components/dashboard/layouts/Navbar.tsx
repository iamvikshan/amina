/**
 * Navbar Component
 * Top navigation bar for dashboard
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { BreadcrumbItem } from '@types';

interface NavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  actions?: any;
  className?: string;
}

export const Navbar: FC<NavbarProps> = ({
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div class={cn('flex items-center justify-between h-16 px-6', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}

      {/* Actions (right side) */}
      {actions && <div class="flex items-center gap-3">{actions}</div>}
    </div>
  );
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" class="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={index} class="flex items-center">
          {index > 0 && (
            <svg
              class="flex-shrink-0 mx-2 h-4 w-4 text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {item.href ? (
            <a
              href={item.href}
              class="font-medium text-gray-400 hover:text-pure-white transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span class="font-medium text-pure-white">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};
