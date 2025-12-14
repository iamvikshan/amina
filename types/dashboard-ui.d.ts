export type SidebarBadgeVariant = 'info' | 'success' | 'warning' | 'danger';

export type SidebarItem = {
  label: string;
  href?: string;
  icon?: string;
  badge?: string | number;
  badgeVariant?: SidebarBadgeVariant;
  active?: boolean;
  onClick?: string;
  disabled?: boolean;
};

export type SidebarSection = {
  title: string;
  icon?: string;
  items: SidebarItem[];
};

export type SidebarHeader = {
  title: string;
  subtitle?: string;
  icon?: string;
  image?: string;
  backHref?: string;
};

export type SidebarFooter = {
  items: SidebarItem[];
};
