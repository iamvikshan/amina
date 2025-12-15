/**
 * Dashboard Type Definitions
 * Based on reference: src/components/layout/ and src/config/
 */

import type { ReactNode } from 'react';
import type { FeatureId, CustomFeatures } from './features.d.ts';

/** Sidebar item configuration */
export interface DashSidebarItem {
  id: string;
  name: string;
  href: string;
  icon?: string; // Lucide icon name
  badge?: string | number;
  external?: boolean;
  active?: boolean;
}

/** Sidebar section with grouped items */
export interface DashSidebarSection {
  title?: string;
  items: DashSidebarItem[];
}

/** Breadcrumb item */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Layout props for AppLayout */
export interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

/** Layout props for GuildLayout */
export interface GuildLayoutProps {
  guildId: string;
  children: ReactNode;
}

/** Feature card props */
export interface FeatureCardProps {
  guildId: string;
  featureId: FeatureId;
  feature: FeatureConfig;
  enabled: boolean;
}

/** Feature form render function */
export type UseFormRender<T> = (
  data: T,
  onSubmit: SubmitFn<T>
) => {
  component: ReactNode;
  onSubmit: () => void;
};

/** Form submit function */
export type SubmitFn<T> = (data: T) => Promise<void>;

/** Feature configuration for dashboard */
export interface FeatureConfig<K extends keyof CustomFeatures = any> {
  id: K;
  name: string;
  description?: string;
  icon?: string; // Lucide icon name
  category?: 'moderation' | 'fun' | 'utility' | 'leveling';
  useRender?: UseFormRender<CustomFeatures[K]>;
}

/** Panel component props */
export interface PanelProps {
  children?: ReactNode;
  className?: string;
}

/** Loading panel props */
export interface LoadingPanelProps extends PanelProps {
  message?: string;
}

/** Error panel props */
export interface ErrorPanelProps extends PanelProps {
  error: Error | string;
  retry?: () => void;
}

/** Card variant types */
export type CardVariant = 'default' | 'primary' | 'active' | 'danger';

/** Button variant types */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Button size types */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Badge variant types */
export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
