import type { FC } from 'hono/jsx';
import { LucideIcon } from '@components/ui/icons/LucideIcon';

interface SecondaryBtnProps {
  text?: string;
  url?: string;
  icon?:
    | 'file-text'
    | 'layout-dashboard'
    | 'book-open'
    | 'book'
    | 'bar-chart-3'
    | 'house-plug'
    | 'settings';
  class?: string;
}

/**
 * SecondaryBtn Component
 * ======================
 * Secondary CTA button with electric blue outline
 * Amina Style: Tactical, informative, support actions
 * Perfect for: Documentation, secondary CTAs, info links
 */
export const SecondaryBtn: FC<SecondaryBtnProps> = ({
  text = 'Learn More',
  url = '#',
  icon = 'file-text',
  class: className = '',
}) => {
  const classes = `inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-heading font-bold text-cyber-blue bg-transparent border-2 border-cyber-blue rounded-xl transition-all duration-300 hover:bg-cyber-blue/10 hover:scale-105 hover:shadow-glow-blue outline-none ring-cyber-blue/50 focus-visible:ring-4 ${className}`;

  return (
    <a href={url} class={classes}>
      <LucideIcon name={icon} size={24} />
      <span>{text}</span>
    </a>
  );
};
