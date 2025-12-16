/** @jsxImportSource react */
import {
  Avatar,
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spacer,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useGuilds, useSelfUserQuery } from '@/api/hooks';
import { SearchBar } from '../forms/SearchBar';
import { useMemo, useState } from 'react';
import { config } from '@/config/dashboard/common';
import { FiSettings as SettingsIcon } from 'react-icons/fi';
import { avatarUrl, iconUrl } from '@/api/discord';
import { GuildItem, GuildItemsSkeleton } from './GuildItem';
import { SidebarItem } from './SidebarItem';
import items from '@/config/dashboard/sidebar-items';
import type { SidebarItemInfo } from '@/config/dashboard/sidebar-items';

interface SidebarContentProps {
  activeGuildId?: string;
  activePath?: string;
}

export function SidebarContent({
  activeGuildId,
  activePath,
}: SidebarContentProps) {
  const [filter, setFilter] = useState('');
  const guilds = useGuilds();

  const filteredGuilds = useMemo(
    () =>
      guilds.data?.filter((guild) => {
        const contains = guild.name
          .toLowerCase()
          .includes(filter.toLowerCase());
        return config.guild.filter(guild) && contains;
      }),
    [guilds.data, filter]
  );

  return (
    <>
      <VStack align="center" py="2rem" m={3} bg="Brand" rounded="xl">
        <Heading size="lg" fontWeight={600} color="white">
          {config.name}
        </Heading>
      </VStack>

      <Stack direction="column" mb="auto">
        <Items activePath={activePath} />
        <Box px="10px">
          <SearchBar
            w="full"
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFilter(e.target.value)
            }
            placeholder="Search servers..."
          />
        </Box>
        <Flex direction="column" px="10px" gap={3}>
          {filteredGuilds == null ? (
            <GuildItemsSkeleton />
          ) : (
            filteredGuilds?.map((guild) => (
              <GuildItem
                key={guild.id}
                guild={guild}
                active={activeGuildId === guild.id}
                href={`/dash/guild/${guild.id}`}
              />
            ))
          )}
        </Flex>
      </Stack>
    </>
  );
}

export function BottomCard() {
  const user = useSelfUserQuery().data;
  if (user == null) return <></>;

  return (
    <Card pos="sticky" left={0} bottom={0} w="full" py={2}>
      <CardBody as={HStack}>
        <Avatar src={avatarUrl(user)} name={user.username} size="sm" />
        <Text fontWeight="600">{user.global_name || user.username}</Text>
        <Spacer />
        <a href="/dash/profile">
          <IconButton
            icon={<SettingsIcon />}
            aria-label="settings"
            variant="ghost"
          />
        </a>
      </CardBody>
    </Card>
  );
}

function Items({ activePath }: { activePath?: string }) {
  return (
    <Flex direction="column" px="10px" gap={0}>
      {items.map((route: SidebarItemInfo, index: number) => (
        <SidebarItem
          key={index}
          href={route.path}
          name={route.name}
          icon={route.icon}
          active={activePath === route.path}
        />
      ))}
    </Flex>
  );
}
