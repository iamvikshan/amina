/**
 * RolePicker Component
 * Discord role selector with color indicators
 * Based on reference: .reference/frontend/src/components/forms/RoleSelect.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { FormCard } from './Form';
import type { FormControlProps, RoleOption } from '@types';

interface RolePickerProps extends FormControlProps {
  /** Input name attribute */
  name?: string;
  /** Currently selected role ID */
  value?: string;
  /** Available roles */
  roles: RoleOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Exclude @everyone role */
  excludeEveryone?: boolean;
  /** Exclude managed (bot) roles */
  excludeManaged?: boolean;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Selected role IDs (for multiple) */
  values?: string[];
  /** Change handler - receives role ID (single) */
  onChange?: (roleId: string) => void;
  /** Change handler - receives role IDs (multiple) */
  onChangeMultiple?: (roleIds: string[]) => void;
  /** Select className */
  selectClassName?: string;
}

/**
 * Convert Discord role color (decimal or hex string) to hex string
 */
function roleColorToHex(color: number | string): string {
  if (typeof color === 'string') {
    // Already a hex string, ensure it starts with #
    return color.startsWith('#') ? color : `#${color}`;
  }
  if (color === 0) return '#99aab5'; // Default Discord gray
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Sort roles by position (higher = more important)
 */
function sortRolesByPosition(roles: RoleOption[]): RoleOption[] {
  return [...roles].sort((a, b) => b.position - a.position);
}

export const RolePicker: FC<RolePickerProps> = ({
  // FormCard props
  label,
  description,
  required,
  error,
  className,
  // Select props
  name,
  value,
  roles,
  placeholder = 'Select a role',
  disabled = false,
  loading = false,
  excludeEveryone = true,
  excludeManaged = false,
  multiple = false,
  values = [],
  onChange,
  onChangeMultiple,
  selectClassName,
}) => {
  // Filter and sort roles
  let filteredRoles = sortRolesByPosition(roles);

  if (excludeEveryone) {
    filteredRoles = filteredRoles.filter((r) => r.name !== '@everyone');
  }

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    if (multiple && onChangeMultiple) {
      const selectedOptions = Array.from(target.selectedOptions).map(
        (o) => o.value
      );
      onChangeMultiple(selectedOptions);
    } else if (onChange) {
      onChange(target.value);
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
        <select
          name={name}
          value={multiple ? undefined : value}
          multiple={multiple}
          disabled={disabled || loading}
          onchange={handleChange}
          class={cn(
            'w-full rounded-xl border bg-night-steel/30 text-pure-white',
            multiple ? 'px-4 py-3 min-h-[120px]' : 'px-4 py-2.5',
            'appearance-none cursor-pointer',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-discord-red' : 'border-night-slate',
            !multiple && 'pr-10',
            selectClassName
          )}
        >
          {!multiple && (
            <option value="">
              {loading ? 'Loading roles...' : placeholder}
            </option>
          )}

          {filteredRoles.map((role) => (
            <option
              key={role.id}
              value={role.id}
              selected={multiple ? values.includes(role.id) : value === role.id}
              style={{ color: roleColorToHex(role.color) }}
            >
              ● {role.name}
            </option>
          ))}
        </select>

        {/* Dropdown Icon (single select only) */}
        {!multiple && (
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
        )}
      </div>

      {/* Selected role preview (single) */}
      {!multiple && value && (
        <div class="mt-2 flex items-center gap-2">
          {(() => {
            const selectedRole = roles.find((r) => r.id === value);
            if (!selectedRole) return null;
            return (
              <>
                <span
                  class="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: roleColorToHex(selectedRole.color),
                  }}
                />
                <span
                  class="text-sm"
                  style={{ color: roleColorToHex(selectedRole.color) }}
                >
                  {selectedRole.name}
                </span>
              </>
            );
          })()}
        </div>
      )}

      {/* Selected roles preview (multiple) */}
      {multiple && values.length > 0 && (
        <div class="mt-2 flex flex-wrap gap-2">
          {values.map((roleId) => {
            const role = roles.find((r) => r.id === roleId);
            if (!role) return null;
            return (
              <span
                key={roleId}
                class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${roleColorToHex(role.color)}20`,
                  color: roleColorToHex(role.color),
                  border: `1px solid ${roleColorToHex(role.color)}40`,
                }}
              >
                <span
                  class="w-2 h-2 rounded-full"
                  style={{ backgroundColor: roleColorToHex(role.color) }}
                />
                {role.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Helper text for multiple */}
      {multiple && (
        <p class="mt-2 text-xs text-gray-500">
          Hold Ctrl/Cmd to select multiple roles
        </p>
      )}
    </FormCard>
  );
};

/**
 * Inline Role Picker - Without form card wrapper
 */
export const InlineRolePicker: FC<
  Omit<RolePickerProps, 'label' | 'description' | 'className'>
> = ({
  error,
  roles,
  placeholder = 'Select a role',
  loading = false,
  excludeEveryone = true,
  onChange,
  selectClassName,
  value,
  ...props
}) => {
  let filteredRoles = sortRolesByPosition(roles);
  if (excludeEveryone) {
    filteredRoles = filteredRoles.filter((r) => r.name !== '@everyone');
  }

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    if (onChange) {
      onChange(target.value);
    }
  };

  return (
    <div class="relative">
      <select
        value={value}
        {...props}
        disabled={props.disabled || loading}
        onchange={handleChange}
        class={cn(
          'w-full rounded-lg border bg-night-steel/30 text-pure-white',
          'px-3 py-2 text-sm appearance-none cursor-pointer',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-discord-red' : 'border-night-slate',
          'pr-8',
          selectClassName
        )}
      >
        <option value="">{loading ? 'Loading...' : placeholder}</option>
        {filteredRoles.map((role) => (
          <option
            key={role.id}
            value={role.id}
            style={{ color: roleColorToHex(role.color) }}
          >
            ● {role.name}
          </option>
        ))}
      </select>

      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
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
      </div>
    </div>
  );
};
