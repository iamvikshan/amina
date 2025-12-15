/**
 * Form Wrapper Component
 * Provides styled form card with label, description, and error handling
 * Based on reference: .reference/frontend/src/components/forms/Form.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import type { FormControlProps } from '@types';

export interface FormCardProps extends FormControlProps {
  /** Card title (alias for label) */
  title?: string;
  children?: any;
}

/**
 * FormCard - Styled wrapper for form fields
 * Provides consistent styling for label, description, and error states
 */
export const FormCard: FC<FormCardProps> = ({
  label,
  title,
  description,
  required,
  error,
  className,
  children,
}) => {
  // Allow title as alias for label
  const heading = title || label;

  return (
    <div
      class={cn(
        'bg-night-shadow rounded-xl p-5 shadow-md border',
        error ? 'border-discord-red/50' : 'border-night-slate',
        className
      )}
    >
      {/* Label/Title */}
      {heading && (
        <label class="block text-base md:text-lg font-medium text-pure-white mb-0">
          {heading}
          {required && <span class="text-discord-red ml-1">*</span>}
        </label>
      )}

      {/* Description */}
      {description && (
        <p class="text-sm md:text-base text-gray-400 mt-1">{description}</p>
      )}

      {/* Field Content */}
      <div class="mt-3">{children}</div>

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
 * FormSection - Groups multiple form fields with a title
 */
export const FormSection: FC<{
  title?: string;
  description?: string;
  children?: any;
  className?: string;
}> = ({ title, description, children, className }) => {
  return (
    <div class={cn('space-y-4', className)}>
      {(title || description) && (
        <div class="mb-6">
          {title && (
            <h3 class="text-xl font-heading font-semibold text-pure-white">
              {title}
            </h3>
          )}
          {description && (
            <p class="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </div>
      )}
      <div class="space-y-4">{children}</div>
    </div>
  );
};

/**
 * FormActions - Container for form action buttons (submit, cancel, etc.)
 */
export const FormActions: FC<{
  children?: any;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      class={cn(
        'flex items-center justify-end gap-3 pt-6 mt-6 border-t border-night-slate',
        className
      )}
    >
      {children}
    </div>
  );
};
