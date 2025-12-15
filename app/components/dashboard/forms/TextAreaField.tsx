/**
 * TextAreaField Component
 * Multi-line text input with form card wrapper
 * Based on reference: .reference/frontend/src/components/forms/TextAreaForm.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { FormCard } from './Form';
import type { FormControlProps } from '@types';

interface TextAreaFieldProps extends FormControlProps {
  /** Input name attribute */
  name?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Number of visible rows */
  rows?: number;
  /** Maximum length */
  maxLength?: number;
  /** Allow resize */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Change handler */
  onChange?: (e: Event) => void;
  /** Blur handler */
  onBlur?: (e: Event) => void;
  /** TextArea className */
  textareaClassName?: string;
}

const resizeStyles = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

export const TextAreaField: FC<TextAreaFieldProps> = ({
  // FormCard props
  label,
  description,
  required,
  error,
  className,
  // TextArea props
  name,
  placeholder,
  value,
  defaultValue,
  disabled = false,
  readOnly = false,
  rows = 4,
  maxLength,
  resize = 'vertical',
  onChange,
  onBlur,
  textareaClassName,
}) => {
  return (
    <FormCard
      label={label}
      description={description}
      required={required}
      error={error}
      className={className}
    >
      <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
        onchange={onChange}
        onblur={onBlur}
        class={cn(
          // Base styles
          'w-full rounded-xl border bg-night-steel/30 text-pure-white placeholder-gray-500',
          'px-4 py-3 text-base',
          'transition-all duration-200',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
          // Disabled styles
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Error styles
          error ? 'border-discord-red' : 'border-night-slate',
          // Resize
          resizeStyles[resize],
          textareaClassName
        )}
      />

      {/* Character count */}
      {maxLength && (
        <div class="mt-1 text-xs text-gray-500 text-right">
          {value?.length || 0}/{maxLength}
        </div>
      )}
    </FormCard>
  );
};

/**
 * Inline TextArea - TextArea without form card wrapper
 */
export const InlineTextArea: FC<
  Omit<TextAreaFieldProps, 'label' | 'description' | 'className'>
> = ({ error, rows = 3, resize = 'vertical', textareaClassName, ...props }) => {
  return (
    <textarea
      rows={rows}
      {...props}
      class={cn(
        'w-full rounded-lg border bg-night-steel/30 text-pure-white placeholder-gray-500',
        'px-3 py-2 text-sm',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-discord-red' : 'border-night-slate',
        resizeStyles[resize],
        textareaClassName
      )}
    />
  );
};
