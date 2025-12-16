/** @jsxImportSource react */
'use client';

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Flex,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  SimpleGrid,
  Button,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';

// Common Discord colors
const PRESET_COLORS = [
  '#dc143c', // Brand crimson
  '#b01030', // Brand dark
  '#e8364b', // Brand light
  '#ffd700', // Imperial gold
  '#00d4ff', // Cyber blue
  '#5865F2', // Discord blurple
  '#57F287', // Discord green
  '#FEE75C', // Discord yellow
  '#EB459E', // Discord fuchsia
  '#ED4245', // Discord red
  '#FFFFFF', // White
  '#99AAB5', // Gray
];

export type ColorPickerProps = {
  label?: ReactNode;
  description?: string;
  error?: string;
  isRequired?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  presetColors?: string[];
};

export function ColorPicker({
  label,
  description,
  error,
  isRequired,
  value,
  onChange,
  placeholder = '#dc143c',
  isDisabled,
  presetColors = PRESET_COLORS,
}: ColorPickerProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const labelColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const popoverBg = useColorModeValue('white', 'night.800');

  const handlePresetClick = (color: string) => {
    onChange(color);
    onClose();
  };

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
      <Popover
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <InputGroup>
            <InputLeftElement>
              <Box
                w={5}
                h={5}
                borderRadius="md"
                bg={value || '#dc143c'}
                border="2px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.300')}
                cursor="pointer"
              />
            </InputLeftElement>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              isDisabled={isDisabled}
              pl={10}
            />
          </InputGroup>
        </PopoverTrigger>
        <PopoverContent bg={popoverBg} w="auto" minW="240px">
          <PopoverBody p={3}>
            <Text fontSize="sm" fontWeight="600" mb={2}>
              Preset Colors
            </Text>
            <SimpleGrid columns={6} spacing={2}>
              {presetColors.map((color) => (
                <Button
                  key={color}
                  w={8}
                  h={8}
                  p={0}
                  minW={0}
                  bg={color}
                  border="2px solid"
                  borderColor={value === color ? 'brand.500' : 'transparent'}
                  _hover={{ transform: 'scale(1.1)' }}
                  onClick={() => handlePresetClick(color)}
                />
              ))}
            </SimpleGrid>
          </PopoverBody>
        </PopoverContent>
      </Popover>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}
