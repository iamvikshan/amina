/** @jsxImportSource react */
'use client';

import {
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  Text,
  Switch,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

export type FeatureItemProps = {
  name: string;
  description?: string;
  icon?: IconType;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  isLoading?: boolean;
  href?: string;
  onClick?: () => void;
};

export function FeatureItem({
  name,
  description,
  icon,
  enabled,
  onToggle,
  isLoading,
  onClick,
}: FeatureItemProps) {
  const cardBg = useColorModeValue('white', 'night.800');
  const borderColor = useColorModeValue('gray.200', 'night.600');
  const headingColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const iconBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const iconColor = useColorModeValue('brand.500', 'brand.400');

  return (
    <Card
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      cursor={onClick ? 'pointer' : undefined}
      onClick={onClick}
      _hover={onClick ? { borderColor: 'brand.500', shadow: 'md' } : undefined}
      transition="all 0.2s"
    >
      <CardBody>
        <Flex align="center" justify="space-between" gap={4}>
          <Flex align="center" gap={4} flex="1">
            {icon && (
              <Flex
                align="center"
                justify="center"
                w={12}
                h={12}
                borderRadius="xl"
                bg={iconBg}
                color={iconColor}
              >
                <Icon as={icon} boxSize={6} />
              </Flex>
            )}
            <Box flex="1">
              <Heading size="sm" color={headingColor} mb={1}>
                {name}
              </Heading>
              {description && (
                <Text fontSize="sm" color={descColor} noOfLines={2}>
                  {description}
                </Text>
              )}
            </Box>
          </Flex>
          {onToggle && (
            <Switch
              isChecked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              isDisabled={isLoading}
              size="lg"
            />
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}

export type FeatureGridProps = {
  children: ReactNode;
  columns?: number | { base?: number; sm?: number; md?: number; lg?: number };
};

export function FeatureGrid({
  children,
  columns = { base: 1, md: 2, lg: 3 },
}: FeatureGridProps) {
  return (
    <Box
      display="grid"
      gap={4}
      gridTemplateColumns={{
        base: `repeat(${typeof columns === 'number' ? columns : columns.base || 1}, 1fr)`,
        sm:
          typeof columns === 'object' && columns.sm
            ? `repeat(${columns.sm}, 1fr)`
            : undefined,
        md:
          typeof columns === 'object' && columns.md
            ? `repeat(${columns.md}, 1fr)`
            : undefined,
        lg:
          typeof columns === 'object' && columns.lg
            ? `repeat(${columns.lg}, 1fr)`
            : undefined,
      }}
    >
      {children}
    </Box>
  );
}
