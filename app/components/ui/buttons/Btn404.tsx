import type { FC } from 'hono/jsx';
import { LucideIcon } from '@/components/ui/icons/LucideIcon';

interface Btn404Props {
  text?: string;
  icon?: 'arrow-left' | 'arrow-right' | 'shield' | 'star' | 'ghost';
  class?: string;
}

export const Btn404: FC<Btn404Props> = ({
  text = 'Go Back',
  icon = 'arrow-left',
  class: className = '',
}) => {
  const script = `
    const btn = document.getElementById('btn404-back');
    btn?.addEventListener('click', () => {
      try {
        history.back();
      } catch {
        window.location.href = '/';
      }
    });
  `;

  return (
    <>
      <button
        id="btn404-back"
        type="button"
        class={[
          'group inline-flex items-center gap-2 px-8 py-4',
          'bg-gradient-to-l from-amina-crimson to-rose-red text-white',
          'rounded-xl font-heading font-bold text-lg',
          'hover:scale-105 hover:shadow-glow-red',
          'transition-all duration-300',
          className,
        ].join(' ')}
      >
        <LucideIcon
          name="arrow-left"
          class="transition-transform duration-300 group-hover:-translate-x-1"
          size={20}
        />
        <span>{text}</span>
        <LucideIcon name={icon} size={24} />
      </button>

      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
};
