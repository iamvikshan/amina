/** @jsxImportSource react */
'use client';

import {
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Input,
  Textarea,
  Switch,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import type {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export type FormProps = {
  label?: ReactNode;
  description?: string | ReactNode;
  error?: string;
  isRequired?: boolean;
  children: ReactNode;
};

export function Form({
  label,
  description,
  error,
  isRequired,
  children,
}: FormProps) {
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      {label && (
        <FormLabel
          fontSize="md"
          fontWeight="600"
          color={useColorModeValue('night.900', 'white')}
        >
          {label}
        </FormLabel>
      )}
      {description && (
        <Text
          color={useColorModeValue('gray.600', 'gray.400')}
          fontSize="sm"
          mb={2}
        >
          {description}
        </Text>
      )}
      {children}
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}

export type InputFieldProps = FormProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  isDisabled?: boolean;
};

export function InputField({
  label,
  description,
  error,
  isRequired,
  value,
  onChange,
  placeholder,
  type = 'text',
  leftElement,
  rightElement,
  isDisabled,
}: InputFieldProps) {
  return (
    <Form
      label={label}
      description={description}
      error={error}
      isRequired={isRequired}
    >
      <InputGroup>
        {leftElement && <InputLeftElement>{leftElement}</InputLeftElement>}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          isDisabled={isDisabled}
        />
        {rightElement && <InputRightElement>{rightElement}</InputRightElement>}
      </InputGroup>
    </Form>
  );
}

export type TextAreaFieldProps = FormProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  resize?: TextareaHTMLAttributes<HTMLTextAreaElement>['style'] extends {
    resize?: infer R;
  }
    ? R
    : never;
  isDisabled?: boolean;
};

export function TextAreaField({
  label,
  description,
  error,
  isRequired,
  value,
  onChange,
  placeholder,
  rows = 4,
  isDisabled,
}: TextAreaFieldProps) {
  return (
    <Form
      label={label}
      description={description}
      error={error}
      isRequired={isRequired}
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        isDisabled={isDisabled}
      />
    </Form>
  );
}

export type SwitchFieldProps = FormProps & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDisabled?: boolean;
};

export function SwitchField({
  label,
  description,
  error,
  checked,
  onChange,
  isDisabled,
}: SwitchFieldProps) {
  return (
    <FormControl isInvalid={!!error}>
      <Flex align="center" justify="space-between" gap={4}>
        <Flex direction="column" flex="1">
          {label && (
            <FormLabel
              mb={0}
              fontSize="md"
              fontWeight="600"
              color={useColorModeValue('night.900', 'white')}
            >
              {label}
            </FormLabel>
          )}
          {description && (
            <Text
              color={useColorModeValue('gray.600', 'gray.400')}
              fontSize="sm"
            >
              {description}
            </Text>
          )}
        </Flex>
        <Switch
          isChecked={checked}
          onChange={(e) => onChange(e.target.checked)}
          isDisabled={isDisabled}
          size="lg"
        />
      </Flex>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}
