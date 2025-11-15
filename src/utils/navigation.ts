import { URLS } from '@/config/site';
import { getInviteUrl, getSocialUrl } from '@/config/permalinks';

/**
 * Navigation configuration generator
 * This function is called at request time to ensure CLIENT_ID is properly resolved
 */
function getNavigation() {
  // An array of links for navigation bar
  const navBarLinks = [
    { name: 'Home', url: '/' },
    // { name: 'Blog', url: '/blog' },
    { name: 'Docs', url: URLS.docs, target: '_blank' },
    /* { name: 'Products', url: '/products' },
    { name: 'Services', url: '/services' },
    { name: 'Contact', url: '/contact' }, */
  ];

  // An array of links for footer
  const footerLinks = [
    {
      section: 'Arsenal',
      links: [
        {
          name: 'Documentation',
          url: URLS.docs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        // { name: 'Blog', url: '/blog' },
        {
          name: 'Recruit Amina',
          url: getInviteUrl(),
        },
        { name: 'Command Center', url: '/dash' },
      ],
    },
    {
      section: 'Alliance',
      links: [
        {
          name: 'GitHub',
          url: URLS.github,
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        {
          name: 'Support Server',
          url: URLS.support,
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      ],
    },
  ];

  // An object of links for social icons
  const socialLinks = {
    discord: getSocialUrl('discord'),
    x: getSocialUrl('x'),
    github: getSocialUrl('github'),
  };

  return { navBarLinks, footerLinks, socialLinks };
}

// Export as default for backward compatibility
export default getNavigation();
