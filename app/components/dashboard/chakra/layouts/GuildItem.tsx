/** @jsxImportSource react */
import { Avatar, Card, CardBody, Flex, Skeleton, Text } from '@chakra-ui/react';
import { iconUrl } from '@/api/discord';
import type { Guild } from '@/config/dashboard/types';

export function GuildItem({
  guild,
  active,
  href,
}: {
  guild: Guild;
  active: boolean;
  href: string;
}) {
  return (
    <Card
      bg={active ? 'Brand' : 'MainBackground'}
      color={active ? 'white' : undefined}
      cursor="pointer"
      as="a"
      href={href}
      rounded="xl"
      _hover={{
        transform: 'translateY(-2px)',
        shadow: 'lg',
      }}
      transition="all 0.2s"
    >
      <CardBody as={Flex} direction="column" gap={3}>
        <Avatar name={guild.name} src={iconUrl(guild)} />
        <Text fontWeight="600">{guild.name}</Text>
      </CardBody>
    </Card>
  );
}

export function GuildItemsSkeleton() {
  return (
    <>
      <Skeleton h="124px" rounded="xl" />
      <Skeleton h="124px" rounded="xl" />
      <Skeleton h="124px" rounded="xl" />
      <Skeleton h="124px" rounded="xl" />
      <Skeleton h="124px" rounded="xl" />
    </>
  );
}
