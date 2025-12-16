/** @jsxImportSource react */
import { Center, CenterProps, Spinner, Text, VStack } from '@chakra-ui/react';

export function LoadingPanel(props: CenterProps) {
  return (
    <Center w="full" h="full" {...props}>
      <VStack>
        <Spinner size="lg" color="brand.400" />
        <Text color="TextPrimary">Loading...</Text>
      </VStack>
    </Center>
  );
}
