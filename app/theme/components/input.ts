import { inputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';
import { dark, light } from '../colors';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys);

const main = definePartsStyle({
  field: {
    border: '2px solid',
    borderRadius: '16px',
    fontSize: 'sm',
    p: '20px',
    _light: {
      color: 'gray.900',
      bg: 'transparent',
      _placeholder: {
        color: 'gray.500',
      },
      _invalid: {
        borderColor: 'red.400',
      },
      borderColor: 'gray.300',
    },
    _dark: {
      color: 'white',
      bg: 'night.800',
      _placeholder: {
        color: 'gray.500',
      },
      _invalid: {
        borderColor: 'red.400',
      },
      borderColor: 'night.200',
    },
  },
});

export const inputStyles = defineMultiStyleConfig({
  baseStyle: definePartsStyle({
    field: {
      fontWeight: 400,
      _light: {
        borderColor: 'gray.300',
      },
      _dark: {
        borderColor: 'night.200',
      },
      borderRadius: '8px',
    },
  }),
  variants: {
    main,
    flushed: definePartsStyle({
      field: {
        _focus: {
          _dark: {
            borderColor: dark.brand,
          },
          _light: {
            borderColor: light.brand,
          },
        },
      },
    }),
    glass: definePartsStyle({
      field: {
        borderColor: 'var(--border-color)',
        border: '1px solid',
        _light: {
          bg: 'gray.100',
          borderColor: 'blackAlpha.200',
          _invalid: {
            borderColor: 'red.300',
          },
          _placeholder: {
            color: 'gray.500',
          },
        },
        _dark: {
          bg: 'blackAlpha.300',
          borderColor: 'whiteAlpha.200',
          _invalid: {
            borderColor: 'red.400',
          },
          _placeholder: {
            color: 'gray.500',
          },
        },
      },
    }),
  },
});
