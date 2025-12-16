/** @jsxImportSource react */
import { Center, HStack, StackProps, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export function SidebarItem({
  name,
  active,
  icon,
  href,
}: {
  name: ReactNode;
  icon: ReactNode;
  active: boolean;
  href: string;
}) {
  return (
    <CardItem active={active} href={href}>
      <Center
        p={2}
        fontSize="sm"
        bg={active ? 'brand.500' : 'transparent'}
        rounded="xl"
        color={active ? 'white' : 'TextPrimary'}
        border="2px solid"
        borderColor="blackAlpha.200"
        boxShadow={`0px 0px 15px ${
          active
            ? 'var(--chakra-colors-brandAlpha-500)'
            : 'rgba(112, 144, 176, 0.3)'
        }`}
        _dark={{
          bg: active ? 'brand.400' : 'transparent',
          borderColor: 'whiteAlpha.400',
        }}
      >
        {icon}
      </Center>
      <Text fontSize="md" fontWeight="medium">
        {name}
      </Text>
    </CardItem>
  );
}

function CardItem({
  active,
  href,
  ...props
}: { href: string; active: boolean } & StackProps) {
  return (
    <HStack
      as="a"
      href={href}
      rounded="xl"
      p={2}
      color={active ? 'TextPrimary' : 'TextSecondary'}
      bg={active ? 'MainBackground' : undefined}
      _dark={{
        bg: active ? 'whiteAlpha.100' : undefined,
      }}
      cursor="pointer"
      _hover={{
        bg: active ? undefined : 'whiteAlpha.50',
      }}
      {...props}
    />
  );
}
