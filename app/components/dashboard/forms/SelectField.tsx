/**
 * SelectField Component
 * Dropdown select with form card wrapper
 * Based on reference: .reference/frontend/src/components/forms/SelectField.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { FormCard } from './Form';
import type { FormControlProps, SelectOption, SelectOptionGroup } from '@types';

interface SelectFieldProps extends FormControlProps {
  /** Input name attribute */
  name?: string;
  /** Current value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Options to display */
  options: (SelectOption | SelectOptionGroup)[];
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Allow clearing selection */
  clearable?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Change handler */
  onChange?: (e: Event) => void;
  /** Blur handler */
  onBlur?: (e: Event) => void;
  /** Select className */
  selectClassName?: string;
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-lg',
};

/**
 * Check if option is a group
 */
function isOptionGroup(
  option: SelectOption | SelectOptionGroup
): option is SelectOptionGroup {
  return 'options' in option;
}

/**
 * Render options recursively (handles groups)
 */
function renderOptions(options: (SelectOption | SelectOptionGroup)[]) {
  return options.map((option, index) => {
    if (isOptionGroup(option)) {
      return (
        <optgroup key={`group-${index}`} label={option.label}>
          {option.options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </optgroup>
      );
    }

    return (
      <option
        key={option.value}
        value={option.value}
        disabled={option.disabled}
      >
        {option.label}
      </option>
    );
  });
}

export const SelectField: FC<SelectFieldProps> = ({
  // FormCard props
  label,
  description,
  required,
  error,
  className,
  // Select props
  name,
  value,
  defaultValue,
  placeholder,
  options,
  disabled = false,
  loading = false,
  clearable = false,
  size = 'md',
  onChange,
  onBlur,
  selectClassName,
}) => {
  return (
    <FormCard
      label={label}
      description={description}
      required={required}
      error={error}
      className={className}
    >
      <div class="relative">
        <select
          name={name}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled || loading}
          onchange={onChange}
          onblur={onBlur}
          class={cn(
            // Base styles
            'w-full rounded-xl border bg-night-steel/30 text-pure-white',
            'appearance-none cursor-pointer',
            'transition-all duration-200',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
            // Disabled styles
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Error styles
            error ? 'border-discord-red' : 'border-night-slate',
            // Size
            sizeStyles[size],
            // Right padding for dropdown icon
            'pr-10',
            selectClassName
          )}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled={!clearable}>
              {placeholder}
            </option>
          )}

          {/* Options */}
          {renderOptions(options)}
        </select>

        {/* Dropdown Icon */}
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
          {loading ? (
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
          ) : (
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </div>
    </FormCard>
  );
};

/**
 * Inline Select - Select without form card wrapper
 */
export const InlineSelect: FC<
  Omit<SelectFieldProps, 'label' | 'description' | 'className'>
> = ({
  error,
  options,
  placeholder,
  loading = false,
  clearable = false,
  size = 'md',
  selectClassName,
  ...props
}) => {
  return (
    <div class="relative">
      <select
        {...props}
        disabled={props.disabled || loading}
        class={cn(
          'w-full rounded-lg border bg-night-steel/30 text-pure-white',
          'appearance-none cursor-pointer',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-discord-red' : 'border-night-slate',
          sizeStyles[size],
          'pr-10',
          selectClassName
        )}
      >
        {placeholder && (
          <option value="" disabled={!clearable}>
            {placeholder}
          </option>
        )}
        {renderOptions(options)}
      </select>

      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
        {loading ? (
          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
        ) : (
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>
    </div>
  );
};
