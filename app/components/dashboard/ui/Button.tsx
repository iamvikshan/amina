/**
 * Button Component
 * Action buttons for dashboard interactions
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { ButtonVariant, ButtonSize } from '@types';

interface ButtonProps {
  children?: any;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-amina-crimson hover:bg-amina-rose-red text-white shadow-md hover:shadow-lg hover:shadow-amina-crimson/20',
  secondary:
    'bg-night-steel hover:bg-night-slate text-pure-white border border-night-slate',
  danger:
    'bg-discord-red hover:bg-discord-red/80 text-white shadow-md hover:shadow-lg hover:shadow-discord-red/20',
  ghost:
    'bg-transparent hover:bg-night-shadow text-gray-400 hover:text-pure-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className,
  onClick,
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      class={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-amina-crimson focus:ring-offset-2 focus:ring-offset-night-black',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

const LoadingSpinner: FC = () => {
  return (
    <svg
      class="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
