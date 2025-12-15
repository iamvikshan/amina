/**
 * ChannelPicker Component
 * Discord channel selector with category grouping
 * Based on reference: .reference/frontend/src/components/forms/ChannelSelect.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { FormCard } from './Form';
import type {
  FormControlProps,
  ChannelOption,
  SelectOptionGroup,
} from '@types';

/** Discord channel types */
export const ChannelTypes = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_ANNOUNCEMENT: 5,
  GUILD_STORE: 6,
  ANNOUNCEMENT_THREAD: 10,
  PUBLIC_THREAD: 11,
  PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15,
} as const;

interface ChannelPickerProps extends FormControlProps {
  /** Input name attribute */
  name?: string;
  /** Currently selected channel ID */
  value?: string;
  /** Available channels */
  channels: ChannelOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Filter by channel types (default: text channels) */
  allowedTypes?: number[];
  /** Change handler - receives channel ID */
  onChange?: (channelId: string) => void;
  /** Select className */
  selectClassName?: string;
}

/**
 * Get icon for channel type
 */
function getChannelIcon(type: number): string {
  switch (type) {
    case ChannelTypes.GUILD_VOICE:
    case ChannelTypes.GUILD_STAGE_VOICE:
      return '🔊';
    case ChannelTypes.GUILD_ANNOUNCEMENT:
      return '📢';
    case ChannelTypes.GUILD_FORUM:
      return '💬';
    case ChannelTypes.GUILD_CATEGORY:
      return '📁';
    default:
      return '#';
  }
}

/**
 * Group channels by category
 */
function groupChannelsByCategory(channels: ChannelOption[]): {
  categories: Map<string, { name: string; channels: ChannelOption[] }>;
  uncategorized: ChannelOption[];
} {
  const categories = new Map<
    string,
    { name: string; channels: ChannelOption[] }
  >();
  const uncategorized: ChannelOption[] = [];

  // First pass: identify categories
  for (const channel of channels) {
    if (channel.type === ChannelTypes.GUILD_CATEGORY) {
      categories.set(channel.id, { name: channel.name, channels: [] });
    }
  }

  // Second pass: group channels
  for (const channel of channels) {
    if (channel.type === ChannelTypes.GUILD_CATEGORY) continue;

    if (channel.category && categories.has(channel.category)) {
      categories.get(channel.category)!.channels.push(channel);
    } else {
      uncategorized.push(channel);
    }
  }

  return { categories, uncategorized };
}

export const ChannelPicker: FC<ChannelPickerProps> = ({
  // FormCard props
  label,
  description,
  required,
  error,
  className,
  // Select props
  name,
  value,
  channels,
  placeholder = 'Select a channel',
  disabled = false,
  loading = false,
  allowedTypes = [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_ANNOUNCEMENT],
  onChange,
  selectClassName,
}) => {
  // Filter channels by allowed types
  const filteredChannels = channels.filter((c) =>
    allowedTypes.includes(c.type)
  );

  // Group by category
  const { categories, uncategorized } =
    groupChannelsByCategory(filteredChannels);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    if (onChange) {
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
          value={value}
          disabled={disabled || loading}
          onchange={handleChange}
          class={cn(
            'w-full rounded-xl border bg-night-steel/30 text-pure-white',
            'px-4 py-2.5 appearance-none cursor-pointer',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-discord-red' : 'border-night-slate',
            'pr-10',
            selectClassName
          )}
        >
          <option value="">
            {loading ? 'Loading channels...' : placeholder}
          </option>

          {/* Uncategorized channels first */}
          {uncategorized.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {getChannelIcon(channel.type)} {channel.name}
            </option>
          ))}

          {/* Categorized channels */}
          {Array.from(categories.entries()).map(
            ([
              categoryId,
              { name: categoryName, channels: categoryChannels },
            ]) => {
              if (categoryChannels.length === 0) return null;
              return (
                <optgroup key={categoryId} label={`📁 ${categoryName}`}>
                  {categoryChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {getChannelIcon(channel.type)} {channel.name}
                    </option>
                  ))}
                </optgroup>
              );
            }
          )}
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

      {/* Selected channel info */}
      {value && (
        <div class="mt-2 text-xs text-gray-500">
          Selected: <span class="text-cyber-blue">{value}</span>
        </div>
      )}
    </FormCard>
  );
};

/**
 * Inline Channel Picker - Without form card wrapper
 */
export const InlineChannelPicker: FC<
  Omit<ChannelPickerProps, 'label' | 'description' | 'className'>
> = ({
  error,
  channels,
  placeholder = 'Select a channel',
  loading = false,
  allowedTypes = [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_ANNOUNCEMENT],
  onChange,
  selectClassName,
  ...props
}) => {
  const filteredChannels = channels.filter((c) =>
    allowedTypes.includes(c.type)
  );
  const { categories, uncategorized } =
    groupChannelsByCategory(filteredChannels);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    if (onChange) {
      onChange(target.value);
    }
  };

  return (
    <div class="relative">
      <select
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
        {uncategorized.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {getChannelIcon(channel.type)} {channel.name}
          </option>
        ))}
        {Array.from(categories.entries()).map(
          ([
            categoryId,
            { name: categoryName, channels: categoryChannels },
          ]) => {
            if (categoryChannels.length === 0) return null;
            return (
              <optgroup key={categoryId} label={categoryName}>
                {categoryChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {getChannelIcon(channel.type)} {channel.name}
                  </option>
                ))}
              </optgroup>
            );
          }
        )}
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
