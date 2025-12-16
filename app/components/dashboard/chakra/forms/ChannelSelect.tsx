/** @jsxImportSource react */
'use client';

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Flex,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { Select as ChakraSelect, chakraComponents } from 'chakra-react-select';
import { FiHash, FiVolume2, FiFolder } from 'react-icons/fi';
import type { ReactNode } from 'react';
import type { GroupBase, OptionProps } from 'chakra-react-select';

export type ChannelOption = {
  value: string;
  label: string;
  type: 'text' | 'voice' | 'category' | number;
};

const ChannelIcon = ({ type }: { type: ChannelOption['type'] }) => {
  // Discord channel types: 0 = text, 2 = voice, 4 = category
  if (type === 'text' || type === 0) return <FiHash />;
  if (type === 'voice' || type === 2) return <FiVolume2 />;
  if (type === 'category' || type === 4) return <FiFolder />;
  return <FiHash />;
};

const CustomOption = (
  props: OptionProps<ChannelOption, false, GroupBase<ChannelOption>>
) => {
  return (
    <chakraComponents.Option {...props}>
      <Flex align="center" gap={2}>
        <Box color="gray.500">
          <ChannelIcon type={props.data.type} />
        </Box>
        <Text>{props.data.label}</Text>
      </Flex>
    </chakraComponents.Option>
  );
};

const CustomSingleValue = ({ data }: { data: ChannelOption }) => {
  return (
    <Flex align="center" gap={2}>
      <Box color="gray.500">
        <ChannelIcon type={data.type} />
      </Box>
      <Text>{data.label}</Text>
    </Flex>
  );
};

export type ChannelSelectProps = {
  label?: ReactNode;
  description?: string;
  error?: string;
  isRequired?: boolean;
  options: ChannelOption[];
  value?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  filter?: (channel: ChannelOption) => boolean;
};

export function ChannelSelect({
  label,
  description,
  error,
  isRequired,
  options,
  value,
  onChange,
  placeholder = 'Select a channel',
  isDisabled,
  isClearable = true,
  filter,
}: ChannelSelectProps) {
  const labelColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');

  const filteredOptions = filter ? options.filter(filter) : options;
  const selectedValue = options.find((opt) => opt.value === value) || null;

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
      <ChakraSelect<ChannelOption, false, GroupBase<ChannelOption>>
        options={filteredOptions}
        value={selectedValue}
        onChange={(newValue) => onChange(newValue?.value ?? null)}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        components={{
          Option: CustomOption,
          SingleValue: ({ data }) => <CustomSingleValue data={data} />,
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
