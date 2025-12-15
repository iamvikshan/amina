/**
 * SwitchField Component
 * Toggle switch with form card wrapper
 * Based on reference: .reference/frontend/src/components/forms/SwitchField.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { FormControlProps } from '@types';

interface SwitchFieldProps extends FormControlProps {
  /** Input name attribute */
  name?: string;
  /** Current checked state */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color when checked */
  color?: 'primary' | 'success' | 'danger';
  /** Change handler */
  onChange?: (e: Event) => void;
}

const sizeStyles = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
  },
};

const colorStyles = {
  primary: 'peer-checked:bg-cyber-blue',
  success: 'peer-checked:bg-discord-green',
  danger: 'peer-checked:bg-discord-red',
};

/**
 * SwitchField - Toggle switch with label and description
 * Uses a horizontal layout with the switch on the right
 */
export const SwitchField: FC<SwitchFieldProps> = ({
  // FormCard-like props
  label,
  description,
  required,
  error,
  className,
  // Switch props
  name,
  checked,
  defaultChecked,
  disabled = false,
  size = 'md',
  color = 'primary',
  onChange,
}) => {
  const styles = sizeStyles[size];

  return (
    <div
      class={cn(
        'bg-night-shadow rounded-xl p-5 shadow-md border',
        error ? 'border-discord-red/50' : 'border-night-slate',
        className
      )}
    >
      <div class="flex items-center justify-between gap-4">
        {/* Label & Description */}
        <div class="flex-1 min-w-0">
          {label && (
            <label class="block text-base md:text-lg font-medium text-pure-white">
              {label}
              {required && <span class="text-discord-red ml-1">*</span>}
            </label>
          )}
          {description && (
            <p class="text-sm md:text-base text-gray-400 mt-1">{description}</p>
          )}
        </div>

        {/* Switch */}
        <label class="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            name={name}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onchange={onChange}
            class="sr-only peer"
          />
          <div
            class={cn(
              // Track
              styles.track,
              'bg-night-steel rounded-full',
              'peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyber-blue/20',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              'transition-colors duration-200',
              // Checked color
              colorStyles[color],
              // Thumb - using after pseudo element
              "relative after:content-[''] after:absolute after:top-[2px] after:start-[2px]",
              'after:bg-white after:rounded-full after:transition-all after:duration-200',
              styles.thumb.replace('w-', 'after:w-').replace('h-', 'after:h-'),
              `peer-checked:after:${styles.translate}`
            )}
          />
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <p class="mt-2 text-sm text-discord-red flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Inline Switch - Switch without card wrapper
 * For use in tables or compact layouts
 */
export const InlineSwitch: FC<{
  name?: string;
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'danger';
  onChange?: (e: Event) => void;
  className?: string;
}> = ({
  name,
  label,
  checked,
  defaultChecked,
  disabled = false,
  size = 'md',
  color = 'primary',
  onChange,
  className,
}) => {
  const styles = sizeStyles[size];

  return (
    <label
      class={cn('inline-flex items-center gap-3 cursor-pointer', className)}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onchange={onChange}
        class="sr-only peer"
      />
      <div
        class={cn(
          styles.track,
          'bg-night-steel rounded-full',
          'peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyber-blue/20',
          'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
          'transition-colors duration-200',
          colorStyles[color],
          "relative after:content-[''] after:absolute after:top-[2px] after:start-[2px]",
          'after:bg-white after:rounded-full after:transition-all after:duration-200',
          styles.thumb.replace('w-', 'after:w-').replace('h-', 'after:h-'),
          `peer-checked:after:${styles.translate}`
        )}
      />
      {label && (
        <span class="text-sm text-pure-white peer-disabled:opacity-50">
          {label}
        </span>
      )}
    </label>
  );
};
