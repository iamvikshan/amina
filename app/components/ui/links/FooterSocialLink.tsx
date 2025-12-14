import type { FC } from 'hono/jsx';

interface FooterSocialLinkProps {
  url: string;
  class?: string;
  children?: unknown;
}

export const FooterSocialLink: FC<FooterSocialLinkProps> = ({
  url,
  class: className,
  children,
}) => {
  const baseClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-lg bg-night-steel/40 border border-night-steel text-neutral-400 transition-all duration-300 hover:border-amina-crimson hover:text-amina-crimson hover:shadow-[0_0_15px_rgba(220,20,60,0.4)] hover:scale-110 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-amina-crimson';

  const linkClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <a class={linkClass} href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};
