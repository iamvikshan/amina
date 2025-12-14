import type { FC } from 'hono/jsx';
import { LucideIcon } from '@components/ui/icons/LucideIcon';

interface TertiaryBtnProps {
  text?: string;
  url?: string;
  icon?: 'star' | 'trophy' | 'badge' | 'crown' | 'flame' | 'zap';
  class?: string;
}

export const TertiaryBtn: FC<TertiaryBtnProps> = ({
  text = 'Click Me',
  url = '#',
  icon = 'star',
  class: className = '',
}) => {
  const classes = `inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-heading font-bold text-imperial-gold bg-transparent border-2 border-imperial-gold rounded-xl transition-all duration-300 hover:bg-imperial-gold/10 hover:scale-105 hover:shadow-glow-gold outline-none ring-imperial-gold/50 focus-visible:ring-4 ${className}`;

  return (
    <a href={url} class={classes}>
      <LucideIcon name={icon} size={24} />
      <span>{text}</span>
    </a>
  );
};
