/** @jsxImportSource react */
'use client';

import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import type { ReactNode, FormEvent } from 'react';

export type UpdateFeaturePanelProps = {
  name: string;
  description?: string;
  children: ReactNode;
  onSubmit?: (e: FormEvent) => void;
  onReset?: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  success?: boolean;
  successMessage?: string;
  footer?: ReactNode;
  saveText?: string;
  resetText?: string;
};

export function UpdateFeaturePanel({
  name,
  description,
  children,
  onSubmit,
  onReset,
  isLoading,
  isSaving,
  error,
  success,
  successMessage = 'Settings saved successfully!',
  footer,
  saveText = 'Save Changes',
  resetText = 'Reset',
}: UpdateFeaturePanelProps) {
  const cardBg = useColorModeValue('white', 'night.800');
  const borderColor = useColorModeValue('gray.200', 'night.600');
  const headingColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Card
      as="form"
      onSubmit={handleSubmit}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
    >
      <CardHeader pb={2}>
        <Heading size="md" color={headingColor}>
          {name}
        </Heading>
        {description && (
          <Text fontSize="sm" color={descColor} mt={1}>
            {description}
          </Text>
        )}
      </CardHeader>

      <Divider />

      <CardBody>
        <VStack spacing={6} align="stretch">
          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert status="success" borderRadius="lg">
              <AlertIcon />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {children}
        </VStack>
      </CardBody>

      {(onSubmit || onReset || footer) && (
        <>
          <Divider />
          <Box p={4}>
            {footer || (
              <Flex justify="flex-end" gap={3}>
                {onReset && (
                  <Button
                    variant="ghost"
                    leftIcon={<FiRefreshCw />}
                    onClick={onReset}
                    isDisabled={isLoading || isSaving}
                  >
                    {resetText}
                  </Button>
                )}
                {onSubmit && (
                  <Button
                    type="submit"
                    colorScheme="brand"
                    leftIcon={<FiSave />}
                    isLoading={isSaving}
                    isDisabled={isLoading}
                  >
                    {saveText}
                  </Button>
                )}
              </Flex>
            )}
          </Box>
        </>
      )}
    </Card>
  );
}
