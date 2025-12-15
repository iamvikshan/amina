/**
 * ColorPicker Component
 * Color input with preview and hex/rgb support
 * Based on reference: .reference/frontend/src/components/forms/ColorPicker.tsx
 */

import type { FC } from 'hono/jsx';
import { cn } from '@/lib/dashboard/utils';
import { FormCard } from './Form';
import type { FormControlProps } from '@types';

/** Preset colors for quick selection */
const PRESET_COLORS = [
  '#5865F2', // Discord Blurple
  '#57F287', // Discord Green
  '#FEE75C', // Discord Yellow
  '#EB459E', // Discord Fuchsia
  '#ED4245', // Discord Red
  '#FF6B6B', // Amina Crimson
  '#00D4FF', // Cyber Blue
  '#FFD700', // Imperial Gold
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#F39C12', // Orange
  '#95A5A6', // Gray
];

interface ColorPickerProps extends FormControlProps {
  /** Input name attribute */
  name?: string;
  /** Current color value (hex format) */
  value?: string;
  /** Default color value */
  defaultValue?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show preset colors */
  showPresets?: boolean;
  /** Show hex input */
  showInput?: boolean;
  /** Custom preset colors */
  presets?: string[];
  /** Change handler - receives hex color */
  onChange?: (color: string) => void;
  /** Blur handler */
  onBlur?: (e: Event) => void;
}

/**
 * Validate and format hex color
 */
function normalizeHexColor(color: string): string {
  // Remove # if present
  let hex = color.replace('#', '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  // Validate 6-digit hex
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return '#000000';
  }

  return `#${hex}`.toUpperCase();
}

export const ColorPicker: FC<ColorPickerProps> = ({
  // FormCard props
  label,
  description,
  required,
  error,
  className,
  // ColorPicker props
  name,
  value = '#5865F2',
  defaultValue,
  disabled = false,
  showPresets = true,
  showInput = true,
  presets = PRESET_COLORS,
  onChange,
  onBlur,
}) => {
  const normalizedValue = normalizeHexColor(value);

  const handleColorChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (onChange) {
      onChange(target.value.toUpperCase());
    }
  };

  const handleHexInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const hex = normalizeHexColor(target.value);
    if (onChange) {
      onChange(hex);
    }
  };

  const handlePresetClick = (color: string) => {
    if (disabled) return;
    if (onChange) {
      onChange(color);
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
      <div class="space-y-4">
        {/* Color Preview & Native Picker */}
        <div class="flex items-center gap-4">
          {/* Color Preview */}
          <div
            class={cn(
              'w-14 h-14 rounded-xl border-2 border-night-slate shadow-inner',
              'transition-all duration-200',
              !disabled && 'cursor-pointer hover:scale-105'
            )}
            style={{ backgroundColor: normalizedValue }}
          />

          {/* Native Color Input */}
          <label class="relative">
            <input
              type="color"
              name={name}
              value={normalizedValue}
              defaultValue={defaultValue}
              disabled={disabled}
              onchange={handleColorChange}
              class={cn(
                'w-12 h-12 rounded-lg cursor-pointer border-2 border-night-slate',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                '[&::-webkit-color-swatch-wrapper]:p-0',
                '[&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0'
              )}
            />
          </label>

          {/* Hex Input */}
          {showInput && (
            <div class="flex-1">
              <input
                type="text"
                value={normalizedValue}
                disabled={disabled}
                onblur={handleHexInput}
                placeholder="#000000"
                maxLength={7}
                class={cn(
                  'w-full px-3 py-2 rounded-lg border bg-night-steel/30 text-pure-white',
                  'font-mono text-sm uppercase',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  error ? 'border-discord-red' : 'border-night-slate'
                )}
              />
            </div>
          )}
        </div>

        {/* Preset Colors */}
        {showPresets && (
          <div>
            <p class="text-xs text-gray-500 mb-2">Presets</p>
            <div class="flex flex-wrap gap-2">
              {presets.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={disabled}
                  onClick={() => handlePresetClick(color)}
                  class={cn(
                    'w-8 h-8 rounded-lg border-2 transition-all duration-200',
                    normalizedValue === color
                      ? 'border-pure-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </FormCard>
  );
};

/**
 * Inline Color Picker - Compact version without form card
 */
export const InlineColorPicker: FC<{
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  showPresets?: boolean;
  presets?: string[];
  onChange?: (color: string) => void;
  className?: string;
}> = ({
  name,
  value = '#5865F2',
  defaultValue,
  disabled = false,
  showPresets = false,
  presets = PRESET_COLORS.slice(0, 6),
  onChange,
  className,
}) => {
  const normalizedValue = normalizeHexColor(value);

  const handleColorChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (onChange) {
      onChange(target.value.toUpperCase());
    }
  };

  return (
    <div class={cn('flex items-center gap-2', className)}>
      {/* Native Color Input */}
      <input
        type="color"
        name={name}
        value={normalizedValue}
        defaultValue={defaultValue}
        disabled={disabled}
        onchange={handleColorChange}
        class={cn(
          'w-8 h-8 rounded cursor-pointer border border-night-slate',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[&::-webkit-color-swatch-wrapper]:p-0',
          '[&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0'
        )}
      />

      {/* Preset Colors */}
      {showPresets && (
        <div class="flex gap-1">
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(color)}
              class={cn(
                'w-6 h-6 rounded border',
                normalizedValue === color
                  ? 'border-pure-white'
                  : 'border-transparent',
                'disabled:opacity-50'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {/* Hex Value */}
      <span class="text-xs font-mono text-gray-400">{normalizedValue}</span>
    </div>
  );
};
