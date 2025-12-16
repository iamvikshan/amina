/** @jsxImportSource react */
'use client';

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Flex,
  Box,
  Tag,
  useColorModeValue,
} from '@chakra-ui/react';
import { Select as ChakraSelect, chakraComponents } from 'chakra-react-select';
import type { ReactNode } from 'react';
import type {
  GroupBase,
  OptionProps,
  MultiValueProps,
} from 'chakra-react-select';

export type RoleOption = {
  value: string;
  label: string;
  color?: string; // Hex color from Discord
};

const RoleColorDot = ({ color }: { color?: string }) => {
  if (!color || color === '0') return null;
  const hexColor =
    typeof color === 'string' && color.startsWith('#')
      ? color
      : `#${parseInt(color, 10).toString(16).padStart(6, '0')}`;

  return <Box w={3} h={3} borderRadius="full" bg={hexColor} flexShrink={0} />;
};

const CustomOption = (
  props: OptionProps<RoleOption, boolean, GroupBase<RoleOption>>
) => {
  return (
    <chakraComponents.Option {...props}>
      <Flex align="center" gap={2}>
        <RoleColorDot color={props.data.color} />
        <Text>{props.data.label}</Text>
      </Flex>
    </chakraComponents.Option>
  );
};

const CustomSingleValue = ({ data }: { data: RoleOption }) => {
  return (
    <Flex align="center" gap={2}>
      <RoleColorDot color={data.color} />
      <Text>{data.label}</Text>
    </Flex>
  );
};

const CustomMultiValue = (
  props: MultiValueProps<RoleOption, true, GroupBase<RoleOption>>
) => {
  const hexColor =
    props.data.color && props.data.color !== '0'
      ? typeof props.data.color === 'string' && props.data.color.startsWith('#')
        ? props.data.color
        : `#${parseInt(props.data.color, 10).toString(16).padStart(6, '0')}`
      : undefined;

  return (
    <Tag
      size="sm"
      borderRadius="full"
      variant="subtle"
      colorScheme="brand"
      bg={hexColor ? `${hexColor}22` : undefined}
      color={hexColor || undefined}
      borderColor={hexColor || undefined}
      borderWidth={hexColor ? '1px' : undefined}
    >
      <Flex align="center" gap={1}>
        <RoleColorDot color={props.data.color} />
        <Text fontSize="sm">{props.data.label}</Text>
        <Box
          as="span"
          cursor="pointer"
          ml={1}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            props.removeProps?.onClick?.(e as any);
          }}
        >
          ×
        </Box>
      </Flex>
    </Tag>
  );
};

export type RoleSelectProps = {
  label?: ReactNode;
  description?: string;
  error?: string;
  isRequired?: boolean;
  options: RoleOption[];
  value?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isMulti?: false;
};

export type MultiRoleSelectProps = {
  label?: ReactNode;
  description?: string;
  error?: string;
  isRequired?: boolean;
  options: RoleOption[];
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isMulti: true;
};

export function RoleSelect({
  label,
  description,
  error,
  isRequired,
  options,
  value,
  onChange,
  placeholder = 'Select a role',
  isDisabled,
  isClearable = true,
  isMulti,
}: RoleSelectProps | MultiRoleSelectProps) {
  const labelColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');

  const selectedValue = isMulti
    ? options.filter((opt) =>
        (value as string[] | undefined)?.includes(opt.value)
      )
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
        RoleOption,
        typeof isMulti extends true ? true : false,
        GroupBase<RoleOption>
      >
        options={options}
        value={selectedValue}
        onChange={(newValue) => {
          if (isMulti) {
            const values =
              (newValue as RoleOption[] | null)?.map((opt) => opt.value) || [];
            (onChange as (value: string[]) => void)(values);
          } else {
            const val = (newValue as RoleOption | null)?.value ?? null;
            (onChange as (value: string | null) => void)(val);
          }
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isMulti={isMulti as any}
        isClearable={isClearable}
        components={{
          Option: CustomOption as any,
          SingleValue: ({ data }) => <CustomSingleValue data={data} />,
          MultiValue: CustomMultiValue as any,
        }}
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
