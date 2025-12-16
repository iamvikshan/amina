import { popoverAnatomy as parts } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/styled-system';

const { defineMultiStyleConfig, definePartsStyle } =
  createMultiStyleConfigHelpers(parts.keys);

export const popoverStyles = defineMultiStyleConfig({
  baseStyle: definePartsStyle({
    content: {
      bg: 'gray.100',
      rounded: 'xl',
      boxShadow: 'normal',
      _dark: {
        bg: 'night.900',
      },
    },
  }),
});
