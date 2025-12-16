import { mode } from '@chakra-ui/theme-tools';
import { defineStyle, defineStyleConfig } from '@chakra-ui/react';
import { light, dark } from '../colors';

export const textareaStyles = defineStyleConfig({
  baseStyle: defineStyle((props) => ({
    fontWeight: 400,
    borderRadius: '8px',
    fontSize: 'md',
    bg: mode(light.globalBg, dark.globalBg)(props),
    rounded: 'lg',
    border: 0,
    _focus: { boxShadow: 'none' },
  })),
  variants: {
    main: defineStyle((props: any) => ({
      bg: mode('transparent', 'night.800')(props),
      border: '2px solid',
      color: mode('gray.900', 'white')(props),
      borderColor: mode('gray.300', 'night.200')(props),
      borderRadius: '16px',
      fontSize: 'sm',
      p: '20px',
      _placeholder: {
        color: mode('gray.500', 'gray.500')(props),
      },
    })),
    glass: {
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
  },
});
