import type { FC } from 'hono/jsx';
import { SITE, OG, SEO } from '@/config/site';
import { ImagePaths } from '@/utils/cdn';

interface MetaProps {
  meta?: string;
  structuredData?: object;
  canonical?: string;
}

/**
 * Meta Component
 * ==============
 * SEO metadata, Open Graph, Twitter Cards, and structured data
 * Handles all <head> metadata except <title> (handled by BaseLayout)
 * 
 * Note: Using absolute URLs for social images (required by OG spec)
 */
export const Meta: FC<MetaProps> = ({ 
  meta = SITE.description, 
  structuredData = SEO.structuredData,
  canonical 
}) => {
  const author = SITE.author;
  const ogTitle = OG.title;
  const ogDescription = OG.description;
  
  // Construct absolute URL for social image
  // In production, this should use the actual domain
  const baseUrl = process.env.BASE_URL || 'https://4mina.app';
  // OG.image is a relative path like '/social.png'
  const socialImage = `${baseUrl}${OG.image}`;

  // Use canonical or construct from base URL
  const canonicalUrl = canonical || baseUrl;

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
        />
      )}

      {/* Basic Meta Tags */}
      <meta charset="utf-8" />
      <meta name="description" content={meta} />
      <meta name="web_author" content={author} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0"
      />
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Facebook Meta Tags */}
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:site_name" content={SITE.title} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="600" />
      <meta property="og:image:type" content="image/png" />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content={canonicalUrl} />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={socialImage} />

      {/* Links to manifests and sitemaps */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="sitemap" href="/sitemap-index.xml" />

      {/* Favicons */}
      <link rel="icon" href="/favicon.ico" sizes="any" type="image/x-icon" />
      <link rel="icon" href={ImagePaths.logo.headshotEmoji} type="image/svg+xml" sizes="any" />
      <meta name="mobile-web-app-capable" content="yes" />
      <link rel="apple-touch-icon" href={ImagePaths.logo.headshotEmoji} />
      <link rel="shortcut icon" href={ImagePaths.logo.headshotEmoji} />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#facc15" />
    </>
  );
};
