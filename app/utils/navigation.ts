import { URLS } from '@config/site';
import { getInviteUrl, getSocialUrl } from '@config/permalinks';

/**
 * Navigation configuration generator
 * Called at request time so CLIENT_ID-based URLs are resolved.
 */
function getNavigation() {
  const navBarLinks = [
    { name: 'Home', url: '/' },
    { name: 'Docs', url: URLS.docs, target: '_blank' },
  ];

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

  const socialLinks = {
    discord: getSocialUrl('discord'),
    x: getSocialUrl('x'),
    github: getSocialUrl('github'),
  };

  return { navBarLinks, footerLinks, socialLinks };
}

export default getNavigation();
