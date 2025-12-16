/** @jsxImportSource react */
'use client';

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Select as ChakraSelect } from 'chakra-react-select';
import type { ReactNode } from 'react';
import type { GroupBase, Props as SelectProps } from 'chakra-react-select';

export type SelectOption<V = string> = {
  value: V;
  label: string;
};

export type SelectFieldProps<V = string> = {
  label?: ReactNode;
  description?: string;
  error?: string;
  isRequired?: boolean;
  options: SelectOption<V>[];
  value?: V;
  onChange: (value: V | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isMulti?: false;
  isClearable?: boolean;
};

export type MultiSelectFieldProps<V = string> = {
  label?: ReactNode;
  description?: string;
  error?: string;
  isRequired?: boolean;
  options: SelectOption<V>[];
  value?: V[];
  onChange: (value: V[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isMulti: true;
  isClearable?: boolean;
};

export function SelectField<V = string>({
  label,
  description,
  error,
  isRequired,
  options,
  value,
  onChange,
  placeholder,
  isDisabled,
  isMulti,
  isClearable = true,
}: SelectFieldProps<V> | MultiSelectFieldProps<V>) {
  const labelColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');

  const selectedValue = isMulti
    ? options.filter((opt) => (value as V[] | undefined)?.includes(opt.value))
    : options.find((opt) => opt.value === value) || null;

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      {label && (
        <FormLabel fontSize="md" fontWeight="600" color={labelColor}>
          {label}
        </FormLabel>
      )}
      {description && (
        <Text color={descColor} fontSize="sm" mb={2}>
          {description}
        </Text>
      )}
      <ChakraSelect<
        SelectOption<V>,
        typeof isMulti extends true ? true : false,
        GroupBase<SelectOption<V>>
      >
        options={options}
        value={selectedValue}
        onChange={(newValue) => {
          if (isMulti) {
            const values =
              (newValue as SelectOption<V>[] | null)?.map((opt) => opt.value) ||
              [];
            (onChange as (value: V[]) => void)(values);
          } else {
            const val = (newValue as SelectOption<V> | null)?.value ?? null;
            (onChange as (value: V | null) => void)(val);
          }
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isMulti={isMulti as any}
        isClearable={isClearable}
        chakraStyles={{
          container: (base) => ({
            ...base,
            w: 'full',
          }),
          control: (base) => ({
            ...base,
            borderRadius: 'lg',
          }),
          menu: (base) => ({
            ...base,
            borderRadius: 'lg',
            overflow: 'hidden',
          }),
        }}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}
