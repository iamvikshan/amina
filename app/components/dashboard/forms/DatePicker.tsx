/**
 * DatePicker Component
 * Date/time input with various formats
 * Based on reference: .reference/frontend/src/components/forms/DatePicker.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { FormCard } from './Form';
import type { FormControlProps } from '@types';

interface DatePickerProps extends FormControlProps {
  /** Input name attribute */
  name?: string;
  /** Current value (ISO string or Date) */
  value?: string | Date;
  /** Default value */
  defaultValue?: string;
  /** Input type */
  type?: 'date' | 'datetime-local' | 'time';
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Minimum date/time */
  min?: string;
  /** Maximum date/time */
  max?: string;
  /** Show clear button */
  clearable?: boolean;
  /** Placeholder text (for display) */
  placeholder?: string;
  /** Change handler - receives ISO string */
  onChange?: (value: string) => void;
  /** Blur handler */
  onBlur?: (e: Event) => void;
  /** Input className */
  inputClassName?: string;
}

/**
 * Format date for display
 */
function formatDateForInput(
  value: string | Date | undefined,
  type: string
): string {
  if (!value) return '';

  const date = typeof value === 'string' ? new Date(value) : value;

  if (isNaN(date.getTime())) return '';

  switch (type) {
    case 'date':
      return date.toISOString().split('T')[0];
    case 'datetime-local':
      return date.toISOString().slice(0, 16);
    case 'time':
      return date.toISOString().slice(11, 16);
    default:
      return '';
  }
}

/**
 * Format date for display (human readable)
 */
function formatDateForDisplay(
  value: string | Date | undefined,
  type: string
): string {
  if (!value) return '';

  const date = typeof value === 'string' ? new Date(value) : value;

  if (isNaN(date.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {};

  switch (type) {
    case 'date':
      options.dateStyle = 'medium';
      break;
    case 'datetime-local':
      options.dateStyle = 'medium';
      options.timeStyle = 'short';
      break;
    case 'time':
      options.timeStyle = 'short';
      break;
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export const DatePicker: FC<DatePickerProps> = ({
  // FormCard props
  label,
  description,
  required,
  error,
  className,
  // DatePicker props
  name,
  value,
  defaultValue,
  type = 'date',
  disabled = false,
  readOnly = false,
  min,
  max,
  clearable = false,
  placeholder,
  onChange,
  onBlur,
  inputClassName,
}) => {
  const formattedValue = formatDateForInput(value, type);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (onChange) {
      onChange(target.value);
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange('');
    }
  };

  return (
    <FormCard
      label={label}
      description={description}
      required={required}
      error={error}
      className={className}
    >
      <div class="relative">
        <input
          type={type}
          name={name}
          value={formattedValue}
          defaultValue={defaultValue}
          disabled={disabled}
          readOnly={readOnly}
          min={min}
          max={max}
          onchange={handleChange}
          onblur={onBlur}
          class={cn(
            'w-full rounded-xl border bg-night-steel/30 text-pure-white',
            'px-4 py-2.5',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-discord-red' : 'border-night-slate',
            // Styling for date/time picker icon
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            '[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert',
            clearable && value && 'pr-10',
            inputClassName
          )}
        />

        {/* Clear Button */}
        {clearable && value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-pure-white transition-colors"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Display formatted value */}
      {value && (
        <p class="mt-2 text-xs text-gray-500">
          {type === 'date' && '📅'}
          {type === 'datetime-local' && '📅⏰'}
          {type === 'time' && '⏰'} {formatDateForDisplay(value, type)}
        </p>
      )}
    </FormCard>
  );
};

/**
 * Inline Date Picker - Compact version without form card
 */
export const InlineDatePicker: FC<
  Omit<DatePickerProps, 'label' | 'description' | 'className'>
> = ({
  error,
  value,
  type = 'date',
  clearable = false,
  onChange,
  inputClassName,
  ...props
}) => {
  const formattedValue = formatDateForInput(value, type);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (onChange) {
      onChange(target.value);
    }
  };

  return (
    <div class="relative">
      <input
        type={type}
        value={formattedValue}
        onchange={handleChange}
        {...props}
        class={cn(
          'w-full rounded-lg border bg-night-steel/30 text-pure-white',
          'px-3 py-2 text-sm',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-discord-red' : 'border-night-slate',
          '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
          '[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert',
          clearable && value && 'pr-8',
          inputClassName
        )}
      />

      {clearable && value && (
        <button
          type="button"
          onClick={() => onChange?.('')}
          disabled={props.disabled}
          class="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-pure-white"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * DateRangePicker - For selecting a date range
 */
export const DateRangePicker: FC<
  {
    startValue?: string;
    endValue?: string;
    onStartChange?: (value: string) => void;
    onEndChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
  } & FormControlProps
> = ({
  label,
  description,
  required,
  error,
  className,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  disabled = false,
}) => {
  return (
    <FormCard
      label={label}
      description={description}
      required={required}
      error={error}
      className={className}
    >
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <label class="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startValue ? formatDateForInput(startValue, 'date') : ''}
            max={endValue ? formatDateForInput(endValue, 'date') : undefined}
            disabled={disabled}
            onchange={(e: Event) =>
              onStartChange?.((e.target as HTMLInputElement).value)
            }
            class={cn(
              'w-full rounded-lg border bg-night-steel/30 text-pure-white',
              'px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'border-night-slate',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              '[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert'
            )}
          />
        </div>

        <span class="text-gray-500 mt-5">→</span>

        <div class="flex-1">
          <label class="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endValue ? formatDateForInput(endValue, 'date') : ''}
            min={
              startValue ? formatDateForInput(startValue, 'date') : undefined
            }
            disabled={disabled}
            onchange={(e: Event) =>
              onEndChange?.((e.target as HTMLInputElement).value)
            }
            class={cn(
              'w-full rounded-lg border bg-night-steel/30 text-pure-white',
              'px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'border-night-slate',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              '[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert'
            )}
          />
        </div>
      </div>
    </FormCard>
  );
};
