import { dark, light } from '../colors';
import { selectAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';
import { mode, StyleFunctionProps } from '@chakra-ui/theme-tools';

const { defineMultiStyleConfig, definePartsStyle } =
  createMultiStyleConfigHelpers(selectAnatomy.keys);

function getDefaults(props: StyleFunctionProps) {
  const { focusBorderColor: fc, errorBorderColor: ec } = props;
  return {
    focusBorderColor: fc || mode(light.brand, dark.brand)(props),
    errorBorderColor: ec || mode('red.500', 'red.300')(props),
  };
}

const outline = definePartsStyle((props) => {
  const defaults = getDefaults(props);

  return {
    field: {
      border: '1px solid',
      borderColor: 'inherit',
      bg: 'inherit',
      _hover: {
        borderColor: mode('gray.300', 'whiteAlpha.400')(props),
      },
      _invalid: {
        borderColor: defaults.errorBorderColor,
        boxShadow: `0 0 0 1px ${defaults.errorBorderColor}`,
      },
      _focusVisible: {
        zIndex: 0,
        borderColor: defaults.focusBorderColor,
        boxShadow: `0 0 0 1px ${defaults.focusBorderColor}`,
      },
    },
  };
});

export const selectStyles = defineMultiStyleConfig({
  variants: { outline },
});
