// @/utils/navigation.ts
// Navigation utilities and link definitions

export interface NavLink {
  text: string;
  href: string;
  icon?: string;
}

export interface SocialLink {
  name: string;
  href: string;
  icon: string;
}

export const mainNavLinks: NavLink[] = [
  { text: 'Home', href: '/' },
  { text: 'Features', href: '/#features' },
  { text: 'Docs', href: 'https://docs.4mina.app' },
];

export const dashboardNavLinks: NavLink[] = [
  { text: 'Dashboard', href: '/dash', icon: 'layout-dashboard' },
  { text: 'Servers', href: '/dash/guilds', icon: 'server' },
  { text: 'Profile', href: '/dash/profile', icon: 'user' },
  { text: 'Leaderboard', href: '/dash/leaderboard', icon: 'trophy' },
];

export const footerLinks = {
  product: [
    { text: 'Features', href: '/#features' },
    { text: 'Documentation', href: 'https://docs.4mina.app' },
    { text: 'Support Server', href: 'https://discord.gg/uMgS9evnmv' },
  ],
  company: [
    { text: 'About', href: '/about' },
    { text: 'GitHub', href: 'https://github.com/iamvikshan/amina' },
  ],
  legal: [
    { text: 'Privacy Policy', href: '/privacy' },
    { text: 'Terms of Service', href: '/terms' },
  ],
};

export const socialLinks: SocialLink[] = [
  {
    name: 'Discord',
    href: 'https://discord.gg/uMgS9evnmv',
    icon: 'discord',
  },
  {
    name: 'GitHub',
    href: 'https://github.com/iamvikshan/amina',
    icon: 'github',
  },
  {
    name: 'X',
    href: 'https://twitter.com/iamvikshan',
    icon: 'x',
  },
];
