/** @jsxImportSource react */
'use client';

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Input,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';

export type DatePickerProps = {
  label?: ReactNode;
  description?: string;
  error?: string;
  isRequired?: boolean;
  value?: string; // ISO date string
  onChange: (value: string | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  min?: string;
  max?: string;
  type?: 'date' | 'datetime-local' | 'time';
};

export function DatePicker({
  label,
  description,
  error,
  isRequired,
  value,
  onChange,
  isDisabled,
  min,
  max,
  type = 'datetime-local',
}: DatePickerProps) {
  const labelColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');

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
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        isDisabled={isDisabled}
        min={min}
        max={max}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}
