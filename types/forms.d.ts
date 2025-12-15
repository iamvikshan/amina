/**
 * Form Component Types
 * Based on reference: .reference/frontend/src/components/forms/types.ts
 */

import type { ReactNode } from 'react';
import type {
  FieldValues,
  Path,
  UseControllerProps,
  FieldPathByValue,
  UseFormReturn,
} from 'react-hook-form';

/** Base form field control props */
export interface FormControlProps {
  /** Field label */
  label?: ReactNode;
  /** Field description/helper text */
  description?: ReactNode;
  /** Is field required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Additional className */
  className?: string;
}

/** Props with form control wrapper */
export type WithControl<T> = T & {
  control: FormControlProps;
};

/** Props for controlled form inputs with react-hook-form */
export interface ControlledFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> {
  /** Form control props (label, description, etc.) */
  control: Omit<FormControlProps, 'error'>;
  /** react-hook-form controller props */
  controller: UseControllerProps<TFieldValues, TName>;
}

/** Generic controlled input type */
export type ControlledInput<Props, V = unknown> = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, V>,
>(
  props: Props & ControlledFieldProps<TFieldValues, TName>
) => ReactNode;

/** Select option type */
export interface SelectOption {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
}

/** Select option group */
export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

/** Discord channel option */
export interface ChannelOption {
  id: string;
  name: string;
  type: number;
  category?: string;
  position?: number;
}

/** Discord role option */
export interface RoleOption {
  id: string;
  name: string;
  /** Color as integer (Discord format) or hex string */
  color: number | string;
  position: number;
}

/** Form submit handler type */
export type FormSubmitHandler<T> = (data: T) => Promise<void> | void;

/** Form wrapper props */
export interface FormWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: FormSubmitHandler<T>;
  children: ReactNode;
  className?: string;
}
