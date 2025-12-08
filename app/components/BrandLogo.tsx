import type { FC } from 'hono/jsx';
import { ImagePaths } from '@/utils/cdn';

interface BrandLogoProps {
  class?: string;
  alt?: string;
}

/**
 * BrandLogo Component
 * ===================
 * Amina's iconic headshot emoji logo
 * Pure server-rendered image component
 */
export const BrandLogo: FC<BrandLogoProps> = ({ 
  class: className, 
  alt = 'Amina Logo' 
}) => {
  return (
    <img
      class={className}
      src={ImagePaths.logo.headshotEmoji}
      alt={alt}
      loading="lazy"
    />
  );
};
