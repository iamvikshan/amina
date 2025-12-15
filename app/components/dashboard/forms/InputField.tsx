/**
 * InputField Component
 * Text input with form card wrapper
 * Based on reference: .reference/frontend/src/components/forms/InputForm.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { FormCard } from './Form';
import type { FormControlProps } from '@types';

interface InputFieldProps extends FormControlProps {
  /** Input name attribute */
  name?: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel';
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string | number;
  /** Default value */
  defaultValue?: string | number;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Minimum value (for number type) */
  min?: number;
  /** Maximum value (for number type) */
  max?: number;
  /** Step value (for number type) */
  step?: number;
  /** Auto-complete attribute */
  autoComplete?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Input size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Icon to show on the left */
  leftIcon?: any;
  /** Icon to show on the right */
  rightIcon?: any;
  /** Change handler */
  onChange?: (e: Event) => void;
  /** Blur handler */
  onBlur?: (e: Event) => void;
  /** Input className */
  inputClassName?: string;
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-lg',
};

export const InputField: FC<InputFieldProps> = ({
  // FormCard props
  label,
  description,
  required,
  error,
  className,
  // Input props
  name,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  disabled = false,
  readOnly = false,
  maxLength,
  min,
  max,
  step,
  autoComplete,
  autoFocus,
  size = 'md',
  leftIcon,
  rightIcon,
  onChange,
  onBlur,
  inputClassName,
}) => {
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;

  return (
    <FormCard
      label={label}
      description={description}
      required={required}
      error={error}
      className={className}
    >
      <div class="relative">
        {/* Left Icon */}
        {hasLeftIcon && (
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onchange={onChange}
          onblur={onBlur}
          class={cn(
            // Base styles
            'w-full rounded-xl border bg-night-steel/30 text-pure-white placeholder-gray-500',
            'transition-all duration-200',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
            // Disabled styles
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Error styles
            error ? 'border-discord-red' : 'border-night-slate',
            // Size
            sizeStyles[size],
            // Icon padding
            hasLeftIcon && 'pl-10',
            hasRightIcon && 'pr-10',
            inputClassName
          )}
        />

        {/* Right Icon */}
        {hasRightIcon && (
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Character count */}
      {maxLength && value && typeof value === 'string' && (
        <div class="mt-1 text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </div>
      )}
    </FormCard>
  );
};

/**
 * Inline Input - Input without form card wrapper
 * For use in tables, inline editing, etc.
 */
export const InlineInput: FC<
  Omit<InputFieldProps, 'label' | 'description' | 'className'>
> = ({ error, size = 'md', leftIcon, rightIcon, inputClassName, ...props }) => {
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;

  return (
    <div class="relative">
      {hasLeftIcon && (
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          {leftIcon}
        </div>
      )}
      <input
        {...props}
        class={cn(
          'w-full rounded-lg border bg-night-steel/30 text-pure-white placeholder-gray-500',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-discord-red' : 'border-night-slate',
          sizeStyles[size],
          hasLeftIcon && 'pl-10',
          hasRightIcon && 'pr-10',
          inputClassName
        )}
      />
      {hasRightIcon && (
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
          {rightIcon}
        </div>
      )}
    </div>
  );
};
