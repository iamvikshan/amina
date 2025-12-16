/** @jsxImportSource react */
'use client';

import {
  Box,
  Flex,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import type { ReactNode } from 'react';

export type BreadcrumbItem = {
  name: string;
  href?: string;
};

export type FeaturePageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  icon?: ReactNode;
};

export function FeaturePageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  icon,
}: FeaturePageHeaderProps) {
  const headingColor = useColorModeValue('night.900', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const breadcrumbColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box mb={8}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          spacing="8px"
          separator={<Icon as={FiChevronRight} color="gray.500" />}
          mb={4}
        >
          <BreadcrumbItem>
            <BreadcrumbLink href="/dash" color={breadcrumbColor}>
              <Icon as={FiHome} />
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((item, index) => (
            <BreadcrumbItem
              key={index}
              isCurrentPage={index === breadcrumbs.length - 1}
            >
              <BreadcrumbLink
                href={item.href}
                color={
                  index === breadcrumbs.length - 1
                    ? headingColor
                    : breadcrumbColor
                }
                fontWeight={index === breadcrumbs.length - 1 ? '600' : 'normal'}
              >
                {item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      )}

      <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
        <Flex align="center" gap={4}>
          {icon}
          <Box>
            <Heading size="lg" color={headingColor}>
              {title}
            </Heading>
            {description && (
              <Text color={descColor} mt={1}>
                {description}
              </Text>
            )}
          </Box>
        </Flex>
        {actions && <Flex gap={3}>{actions}</Flex>}
      </Flex>
    </Box>
  );
}
