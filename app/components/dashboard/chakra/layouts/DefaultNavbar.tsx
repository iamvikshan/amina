/** @jsxImportSource react */
import {
  Breadcrumb,
  BreadcrumbItem,
  Flex,
  Icon,
  Tag,
  Text,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { IoHome } from 'react-icons/io5';
import { FaChevronRight as ChevronRightIcon } from 'react-icons/fa';
import { navbarBreakpoint } from '@/theme/breakpoints';

interface BreadcrumbItem {
  icon?: ReactNode;
  text: ReactNode;
  href: string;
}

interface DefaultNavbarProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function DefaultNavbar({ title, breadcrumbs }: DefaultNavbarProps) {
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    {
      icon: <IoHome />,
      text: 'Dashboard',
      href: '/dash',
    },
  ];

  const items = breadcrumbs || defaultBreadcrumbs;

  return (
    <Flex
      direction="column"
      gap={{
        base: 2,
        [navbarBreakpoint]: 3,
      }}
      mt={{
        base: '8px',
        [navbarBreakpoint]: '0',
      }}
    >
      <Breadcrumb
        fontSize="sm"
        separator={
          <Icon
            verticalAlign="middle"
            as={ChevronRightIcon}
            color="brand.500"
            _dark={{
              color: 'brand.100',
            }}
          />
        }
      >
        {items.map((item, i) => (
          <BreadcrumbItem key={i}>
            <Tag
              as="a"
              href={item.href}
              gap={1}
              rounded="full"
              color="brand.500"
              bg="brand.100"
              _dark={{
                color: 'brand.100',
                bg: 'brandAlpha.100',
              }}
            >
              {item.icon}
              <Text>{item.text}</Text>
            </Tag>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
      {title && (
        <Text
          color="TextPrimary"
          fontWeight="bold"
          fontSize={{ base: '25px', '3sm': '34px' }}
          mb={2}
        >
          {title}
        </Text>
      )}
    </Flex>
  );
}
